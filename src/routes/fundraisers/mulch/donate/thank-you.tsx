import { createFileRoute } from "@tanstack/react-router";
import { CONTACT_EMAIL } from "~/constants";
import { Button } from "~/components/Button";

export const Route = createFileRoute("/fundraisers/mulch/donate/thank-you")({
  component: ThankYouPage,
});

/**
 * Thank you page shown after a successful donation
 */
function ThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="mb-4 text-2xl font-bold">Thank You for Your Donation!</h1>
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

