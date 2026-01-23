import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { HeroImage } from "~/components/HeroImage";
import { createContext, useContext, type ReactNode } from "react";
import { useWardConfig } from "~/utils";

// Create context for mulch prep content
const MulchPrepContext = createContext<ReactNode | null>(null);

export const Route = createFileRoute("/fundraisers/mulch/orders")({
  component: OrdersLayout,
});

function OrdersLayout() {
  const wardConfig = useWardConfig();
  const params = useParams({ strict: false }) as { orderId?: string };
  const orderId = params.orderId;

  const image = orderId
    ? {
        src: wardConfig.orderConfirmationImage,
        alt: wardConfig.orderConfirmationImageAlt,
      }
    : {
        src: wardConfig.orderFormImage,
        alt: wardConfig.orderFormImageAlt,
      };

  const mulchPrepContent = (
    <>
      <h2 className="text-xl font-medium">HOW TO PREPARE FOR MULCH DELIVERY</h2>
      <p>
        To best help you prepare for our youth to spread the mulch, we recommend
        taking the following steps.
      </p>
      <ol className="ml-6 list-decimal">
        <li>
          <b>Remove all existing mulch from your yard.</b> Our youth will not be
          responsible for removing old mulch. If existing mulch is present, then
          we will spread the new mulch over the top of the existing mulch.
        </li>
        <li>
          <b>Remove all weeds from your garden beds.</b> We will not remove
          weeds for you, so to allow the mulch to be as effective as possible,
          please remove the weeds yourself.
        </li>
        <li>
          <b>Trim the bushes and trees in or around the garden beds.</b> Once
          the mulch is installed, removing the trimmings will be more difficult.
        </li>
        <li>
          <b>Edge your mulch bed.</b> If you have plans to remove grass
          overhang, then remove it before we come and spread the mulch.
        </li>
        <li>
          <b>After the mulch is laid,</b> you will want to wait a day or two and
          then water the mulch to help it settle into place.
        </li>
      </ol>
    </>
  );

  // Determine which message to show when not accepting orders
  const getPlaceholderMessage = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11, where 0 is January
    const startDate = new Date(wardConfig.ordersStartDate);
    let startYear = startDate.getFullYear();

    // If the start date is in a past year and we're in the spring period (Jan-Mar),
    // assume the start date hasn't been updated yet and treat it as current year
    // This allows updating the start date anytime between January and February
    if (startYear < currentYear && currentMonth < 3) {
      // We're in Jan-Mar and start date is from last year, so use current year
      startYear = currentYear;
      // Adjust the start date to current year for display
      const startDateCurrentYear = new Date(startDate);
      startDateCurrentYear.setFullYear(currentYear);
      const displayStartDate = startDateCurrentYear.toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );

      return (
        <div className="mx-auto max-w-7xl sm:px-6 sm:pt-6 lg:px-8">
          <h2 className="text-2xl font-medium">Mulch Orders Starting Soon!</h2>
          <p>
            Mulch orders for {startYear} will be starting soon. Check back on{" "}
            {displayStartDate} to place your order!
          </p>
          <p>We look forward to serving you again this year.</p>
        </div>
      );
    }

    // If we're before the start date, show "coming soon" message
    if (now < startDate) {
      return (
        <div className="mx-auto max-w-7xl sm:px-6 sm:pt-6 lg:px-8">
          <h2 className="text-2xl font-medium">Mulch Orders Starting Soon!</h2>
          <p>
            Mulch orders for {startYear} will be starting soon. Check back on{" "}
            {wardConfig.ordersStartDate} to place your order!
          </p>
          <p>We look forward to serving you again this year.</p>
        </div>
      );
    }

    // Otherwise, show the completion message for the previous year
    const previousYear = startYear - 1;
    return (
      <div className="mx-auto max-w-7xl sm:px-6 sm:pt-6 lg:px-8">
        <h2 className="text-2xl font-medium">Thank you!</h2>
        <p>
          We have reached our {previousYear} goal and could not have done it
          without your support and generosity! We are grateful to live in a
          community that cares about the youth of today. We look forward to
          serving you again in {startYear}.
        </p>
        <p>Happy Gardening!</p>
      </div>
    );
  };

  return (
    <main>
      <HeroImage {...image} />

      <div className="p-6 pt-4">
        {wardConfig.acceptingMulchOrders ? (
          <MulchPrepContext.Provider value={mulchPrepContent}>
            <Outlet />
          </MulchPrepContext.Provider>
        ) : (
          getPlaceholderMessage()
        )}
      </div>
    </main>
  );
}

export function useMulchPrepContent() {
  return useContext(MulchPrepContext);
}
