import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/Button";
import { HeroImage } from "~/components/HeroImage";
import {
  MULCH_DELIVERY_DATE_1,
  MULCH_DELIVERY_DATE_2,
  CONTACT_EMAIL,
} from "~/constants";
import { useOptionalUser } from "~/utils";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const user = useOptionalUser();

  return (
    <main className="relative min-h-screen bg-white">
      <HeroImage />
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-3xl font-bold">
          Crossroads Youth Mulch Fundraiser
        </h1>
        <h2 className="mb-6 text-xl font-medium">
          Beautify Your Yard. Support Local Youth.
        </h2>

        <p className="mb-4">
          Thank you for supporting the Crossroads Ward Youth! Proceeds from this
          fundraiser help fund impactful programs and initiatives for our youth
          throughout the year.
        </p>

        <p className="mb-4">
          We&apos;re offering high-quality mulch with optional spreading
          services to refresh your garden and improve its health. Our youth are
          committed to providing exceptional service and ensuring your yard
          looks its best.
        </p>

        <p className="mb-4 font-medium">
          Early Bird Special: Take advantage of reduced spreading fees! Prices
          will increase after February 22nd, so order early to lock in savings.
        </p>

        <h3 className="mb-3 text-lg font-medium">How It Works:</h3>
        <ul className="mb-4 ml-6 list-disc">
          <li>Use our mulch calculator to determine your needs.</li>
          <li>
            Select your neighborhood and mulch color (service limited to listed
            neighborhoods).
          </li>
          <li>Choose delivery-only or delivery with spreading services.</li>
        </ul>

        <p className="mb-4">
          Delivery Dates: {MULCH_DELIVERY_DATE_1} or {MULCH_DELIVERY_DATE_2}{" "}
          (you&apos;ll receive a confirmation email 5 days prior to delivery
          with instructions).
        </p>

        <p className="mb-4">
          Let&apos;s create beautiful gardens while empowering local youth!
        </p>

        <p className="mb-4">
          📧 Questions? Email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-blue-600 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>

        <div className="my-3 flex gap-2">
          <Button linkTo="/fundraisers/mulch/orders/new">Order Mulch</Button>
          <Button linkTo="/fundraisers/mulch/donate">Donate Here</Button>
          {user?.roles.some(({ role }) => role.name === "ADMIN") && (
            <Button linkTo="/admin">Admin Dashboard</Button>
          )}
        </div>
      </div>
    </main>
  );
}
