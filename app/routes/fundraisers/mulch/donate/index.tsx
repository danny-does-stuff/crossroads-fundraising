import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Form, useActionData, useMatches, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { ActionArgs } from "@remix-run/node";
import { useState, useRef } from "react";
import { z } from "zod";
import { Input } from "~/components/Input";
import { CONTACT_EMAIL } from "~/constants";
import { Button } from "~/components/Button";
import { createDonation } from "~/models/donation.server";

const PRESET_AMOUNTS = [
  { label: "$20", value: "20" },
  { label: "$50", value: "50" },
  { label: "$75", value: "75" },
  { label: "Other", value: "other" },
] as const;

/**
 * Handles form submission for donations. Validates the amount and creates
 * the donation record in the database.
 */
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  const orderUpdateInfo = z
    .object({
      paypalOrderId: z.string(),
      paypalPayerId: z.string().nullable(),
      paypalPaymentSource: z.string(),
      amount: z.number(),
      donorGivenName: z.string().nullable(),
      donorSurname: z.string().nullable(),
      donorEmail: z.string().email().nullable(),
    })
    .safeParse({
      paypalOrderId: formData.get("paypalOrderId"),
      paypalPayerId: formData.get("paypalPayerId"),
      paypalPaymentSource: formData.get("paypalPaymentSource"),
      amount: Number(formData.get("amount")),
      donorGivenName: formData.get("donorGivenName"),
      donorSurname: formData.get("donorSurname"),
      donorEmail: formData.get("donorEmail"),
    });

  if (!orderUpdateInfo.success) {
    return json({ errors: orderUpdateInfo.error.format() }, { status: 400 });
  }

  const donation = await createDonation(orderUpdateInfo.data);

  return json({ donation });
}

/**
 * Main donation page component. Displays preset donation amounts and PayPal
 * integration for processing payments.
 */
export default function DonatePage() {
  const [amount, setAmount] = useState("");
  const amountRef = useRef<string>(amount);
  // Copy the amount to the ref so that the PayPalButtons component doesn't use stale state
  amountRef.current = amount;
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const actionData = useActionData<typeof action>();
  const data = useMatches().find((m) => m.id === "root")?.data;
  const fetcher = useFetcher();

  /**
   * Gets the error message for a specific form field from the action data.
   * Currently only handles the "amount" field.
   */
  function getErrorForField(
    field: "amount" | "donorGivenName" | "donorSurname" | "donorEmail"
  ) {
    return actionData && "errors" in actionData
      ? actionData.errors[field]?._errors[0]
      : undefined;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Support Our Youth Program</h1>
      <p className="mb-6">
        Your donation helps support the youth in your local community. Thank you
        for your generosity!
      </p>

      <PayPalScriptProvider
        options={{
          clientId: data?.ENV.PAYPAL_CLIENT_ID,
          components: "buttons",
          currency: "USD",
          "disable-funding": "credit",
          "enable-funding": "venmo",
        }}
      >
        <Form method="post" className="mb-6 space-y-4">
          <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
            {PRESET_AMOUNTS.map((preset) => {
              const isSelected = selectedAmount === preset.value;
              const isActive =
                isSelected && (preset.value === "other" ? amount : true);

              return (
                <Button
                  key={preset.value}
                  type="button"
                  variant={isActive ? "selected" : "primary"}
                  className={`h-16 text-lg ${
                    isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                  }`}
                  onClick={() => {
                    setSelectedAmount(preset.value);
                    if (preset.value !== "other") {
                      setAmount(preset.value);
                    } else {
                      setAmount("");
                    }
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>

          {selectedAmount === "other" && (
            <div className="mx-auto max-w-md">
              <Input
                id="amount"
                label="Custom Amount ($)"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setAmount(e.target.value);
                }}
                error={getErrorForField("amount")}
                placeholder="Enter amount"
              />
            </div>
          )}

          {amount && !getErrorForField("amount") && (
            <div className="mx-auto max-w-md">
              <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={async (_, actions) => {
                  if (!amountRef.current) {
                    throw new Error("Amount is required");
                  }
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                      {
                        amount: {
                          value: amountRef.current,
                          currency_code: "USD",
                          breakdown: {
                            item_total: {
                              currency_code: "USD",
                              value: amountRef.current,
                            },
                          },
                        },
                        description: "Crossroads Youth Fundraiser Donation",
                        items: [
                          {
                            name: "Crossroads Youth Fundraiser Donation",
                            quantity: "1",
                            unit_amount: {
                              currency_code: "USD",
                              value: amountRef.current,
                            },
                            category: "DONATION",
                          },
                        ],
                      },
                    ],
                    application_context: {
                      shipping_preference: "NO_SHIPPING",
                    },
                  });
                }}
                onApprove={async (data, actions) => {
                  const details = await actions.order?.capture();
                  if (!details) {
                    return;
                  }

                  const paypalPayer = details.payment_source?.paypal;

                  if (details.id === data.orderID) {
                    const paymentSource = details.payment_source;
                    const donationInfo = {
                      paypalOrderId: details.id,
                      paypalPaymentSource: paymentSource?.paypal
                        ? "paypal"
                        : paymentSource?.venmo
                        ? "venmo"
                        : paymentSource?.card
                        ? "card"
                        : "unknown",
                      paypalPayerId: paypalPayer?.account_id ?? null,
                      amount: Number(details.purchase_units?.[0].amount?.value),
                      donorGivenName: paypalPayer?.name?.given_name ?? null,
                      donorSurname: paypalPayer?.name?.surname ?? null,
                      donorEmail: paypalPayer?.email_address ?? null,
                    };

                    fetcher.submit(donationInfo, { method: "post" });
                    window.location.href =
                      "/fundraisers/mulch/donate/thank-you";
                  } else {
                    console.log("payment not captured");
                  }
                }}
              />
            </div>
          )}
        </Form>
      </PayPalScriptProvider>

      <p className="mt-4 text-sm text-gray-600">
        If you have any questions about donations, please contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-500 underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
