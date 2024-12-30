import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Form, useActionData, useMatches } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { ActionArgs } from "@remix-run/node";
import { useState, useRef } from "react";
import { z } from "zod";
import { Input } from "~/components/Input";
import { CONTACT_EMAIL } from "~/constants";
import { Button } from "~/components/Button";

const PRESET_AMOUNTS = [
  { label: "$20", value: "20" },
  { label: "$50", value: "50" },
  { label: "$75", value: "75" },
  { label: "Other", value: "other" },
] as const;

/**
 * Handles form submission for donations. Validates the amount and returns
 * either an error or the validated amount.
 */
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  const result = z
    .object({
      amount: z
        .string()
        .regex(/^\d+(\.\d{2})?$/)
        .transform(Number)
        .refine((n) => n >= 1, "Minimum donation is $1"),
    })
    .safeParse({
      amount: formData.get("amount"),
    });

  if (!result.success) {
    return json({ errors: result.error.format() }, { status: 400 });
  }

  return json({ amount: result.data.amount });
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

  /**
   * Gets the error message for a specific form field from the action data.
   * Currently only handles the "amount" field.
   */
  function getErrorForField(field: "amount") {
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
          "client-id": data?.ENV.PAYPAL_CLIENT_ID,
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
                    purchase_units: [
                      {
                        amount: {
                          value: amountRef.current,
                        },
                        description: "Crossroads Youth Fundraiser Donation",
                      },
                    ],
                  });
                }}
                onApprove={async (_, actions) => {
                  await actions.order?.capture();
                  window.location.href = "/fundraisers/mulch/donate/thank-you";
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
