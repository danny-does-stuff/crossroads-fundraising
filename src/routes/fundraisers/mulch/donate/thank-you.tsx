import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import z from "zod";
import { CONTACT_EMAIL } from "~/constants";
import { Button } from "~/components/Button";
import { verifyCheckoutSessionPayment } from "~/services/stripe/checkout.server";
import { createDonation } from "~/models/donation.server";

const verifyDonationSchema = z.object({
  sessionId: z.string(),
});

// Server function to verify donation payment
const verifyDonationFn = createServerFn()
  .inputValidator(verifyDonationSchema)
  .handler(async ({ data }) => {
    const session = await verifyCheckoutSessionPayment(data.sessionId);
    if (!session) {
      return { success: false, error: "Payment not verified" };
    }

    if (session.metadata?.type !== "donation") {
      return { success: false, error: "Invalid session type" };
    }

    // Create donation record (webhook may also do this, but it's idempotent with unique stripeSessionId)
    try {
      await createDonation({
        amount: (session.amount_total ?? 0) / 100,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        stripeCustomerId:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null,
        donorEmail: session.customer_email || session.metadata?.donorEmail || null,
        donorGivenName:
          session.customer_details?.name?.split(" ")[0] ||
          session.metadata?.donorGivenName ||
          null,
        donorSurname:
          session.customer_details?.name?.split(" ").slice(1).join(" ") ||
          session.metadata?.donorSurname ||
          null,
      });
    } catch (error) {
      // If donation already exists (from webhook), that's fine
      console.log("Donation may already exist:", error);
    }

    return {
      success: true,
      amount: (session.amount_total ?? 0) / 100,
    };
  });

// Search params schema
const searchParamsSchema = z.object({
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/fundraisers/mulch/donate/thank-you")({
  component: ThankYouPage,
  validateSearch: searchParamsSchema,
});

/**
 * Thank you page shown after a successful donation
 */
function ThankYouPage() {
  const searchParams = Route.useSearch();
  const [isVerifying, setIsVerifying] = useState(!!searchParams.session_id);
  const [verified, setVerified] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);

  const verifyDonation = useServerFn(verifyDonationFn);

  useEffect(() => {
    async function verify() {
      if (!searchParams.session_id) {
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyDonation({
          data: { sessionId: searchParams.session_id },
        });
        if (result.success) {
          setVerified(true);
          setAmount(result.amount ?? null);
        }
      } catch (error) {
        console.error("Donation verification error:", error);
      } finally {
        setIsVerifying(false);
      }
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isVerifying) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <div className="rounded border border-blue-200 bg-blue-50 p-6">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="font-medium text-blue-700">
            Verifying your donation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <div className="mb-6 text-6xl">🎉</div>
      <h1 className="mb-4 text-2xl font-bold text-green-600">
        Thank You for Your Donation!
      </h1>
      {verified && amount && (
        <p className="mb-4 text-lg font-semibold">
          Your donation of ${amount.toFixed(2)} has been received.
        </p>
      )}
      <p className="mb-4">
        Your generosity helps make our youth programs possible. We appreciate
        your support!
      </p>
      <p className="mb-8">
        Please contact us at{" "}
        <a className="text-blue-500" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>{" "}
        if you have any questions.
      </p>
      <Button linkTo="/" className="mx-auto">
        Return Home
      </Button>
    </div>
  );
}
