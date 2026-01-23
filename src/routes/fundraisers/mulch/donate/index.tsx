import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import z from "zod";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { createDonationCheckoutSession } from "~/services/stripe/checkout.server";
import { useWardConfig } from "~/utils";

const PRESET_AMOUNTS = [
  { label: "$20", value: "20" },
  { label: "$50", value: "50" },
  { label: "$75", value: "75" },
  { label: "Other", value: "other" },
] as const;

const createCheckoutSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  donorEmail: z.email().nullable(),
  donorGivenName: z.string().nullable(),
  donorSurname: z.string().nullable(),
  returnUrl: z.url(),
});

// Server function to create Stripe Checkout session
const createCheckoutSessionFn = createServerFn()
  .inputValidator(createCheckoutSchema)
  .handler(async ({ data }) => {
    // Use {CHECKOUT_SESSION_ID} placeholder - Stripe will replace with actual session ID
    const session = await createDonationCheckoutSession({
      amount: data.amount,
      donorEmail: data.donorEmail,
      donorGivenName: data.donorGivenName,
      donorSurname: data.donorSurname,
      successUrl: `${data.returnUrl}/fundraisers/mulch/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${data.returnUrl}/fundraisers/mulch/donate`,
    });

    return { checkoutUrl: session.url };
  });

export const Route = createFileRoute("/fundraisers/mulch/donate/")({
  component: DonatePage,
});

function DonatePage() {
  const wardConfig = useWardConfig();
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useServerFn(createCheckoutSessionFn);

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  async function handleCheckout() {
    if (!isValidAmount) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCheckoutSession({
        data: {
          amount: numericAmount,
          donorEmail: null,
          donorGivenName: null,
          donorSurname: null,
          returnUrl: window.location.origin,
        },
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Support Our Youth Program</h1>
      <p className="mb-6">
        Your donation helps support the youth in your local community. Thank you
        for your generosity!
      </p>

      <div className="mb-6 space-y-4">
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
                  setError(null);
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
                setError(null);
              }}
              error={error || undefined}
              placeholder="Enter amount"
            />
          </div>
        )}

        {amount && isValidAmount && (
          <div className="mx-auto max-w-md">
            <Button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-4 text-lg"
            >
              {isSubmitting
                ? "Redirecting to checkout..."
                : `Donate $${numericAmount.toFixed(2)}`}
            </Button>
            <p className="mt-2 text-center text-sm text-gray-500">
              You&apos;ll be redirected to Stripe&apos;s secure checkout
            </p>
          </div>
        )}

        {error && selectedAmount !== "other" && (
          <p className="mx-auto max-w-md text-center text-red-500">{error}</p>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-600">
        If you have any questions about donations, please contact us at{" "}
        <a
          href={`mailto:${wardConfig.contactEmail}`}
          className="text-blue-500 underline"
        >
          {wardConfig.contactEmail}
        </a>
      </p>
    </div>
  );
}
