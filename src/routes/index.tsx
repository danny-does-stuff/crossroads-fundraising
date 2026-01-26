import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/Button";
import { HeroImage } from "~/components/HeroImage";
import { useOptionalUser, useWardConfig } from "~/utils";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const user = useOptionalUser();
  const wardConfig = useWardConfig();

  return (
    <main className="relative min-h-screen bg-white">
      <HeroImage
        src={wardConfig.homeHeroImage}
        alt={wardConfig.homeHeroImageAlt}
      />
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-3xl font-bold">
          {wardConfig.wardName} Youth Mulch Fundraiser
        </h1>
        <h2 className="mb-6 text-xl font-medium">
          Beautify Your Yard. Support Local Youth.
        </h2>

        <p className="mb-4">
          Thank you for supporting the {wardConfig.wardName} Youth! Proceeds
          from this fundraiser help fund impactful programs and initiatives for
          our youth throughout the year.
        </p>

        <p className="mb-4">
          We&apos;re offering high-quality mulch with optional spreading
          services to refresh your garden and improve its health. Our youth are
          committed to providing exceptional service and ensuring your yard
          looks its best.
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
          Delivery Dates: {wardConfig.deliveryDate1} or{" "}
          {wardConfig.deliveryDate2} (you&apos;ll receive a confirmation email 5
          days prior to delivery with instructions).
        </p>

        <p className="mb-4">
          Let&apos;s create beautiful gardens while empowering local youth!
        </p>

        <p className="mb-4">
          📧 Questions? Email us at{" "}
          <a
            href={`mailto:${wardConfig.contactEmail}`}
            className="text-blue-600 hover:underline"
          >
            {wardConfig.contactEmail}
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
