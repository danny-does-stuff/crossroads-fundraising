import { Outlet, useOutletContext, useParams } from "@remix-run/react";
import { HeroImage } from "~/components/HeroImage";
import { ACCEPTING_MULCH_ORDERS, NEXT_MULCH_YEAR } from "~/constants";

type ContextType = React.ReactNode;

export default function OrdersPage() {
  const { orderId } = useParams();

  const image = orderId
    ? {
        src: "/assets/youth_jumping.png",
        alt: "Crossroads Youth Jumping for Joy",
      }
    : {
        src: "/assets/youth_with_completed_mulch.png",
        alt: "Crossroads Youth with Beautifully Spread Mulch",
      };
  return (
    <main>
      <HeroImage {...image} />

      <div className="p-6 pt-4">
        {ACCEPTING_MULCH_ORDERS ? (
          <Outlet
            context={
              <>
                <h2 className="text-xl font-medium">
                  HOW TO PREPARE FOR MULCH DELIVERY
                </h2>
                <p>
                  To best help you prepare for our youth to spread the mulch, we
                  recommend taking the following steps.
                </p>
                <ol className="ml-6 list-decimal">
                  <li>
                    <b>Remove all existing mulch from your yard.</b> Our youth
                    will not be responsible for removing old mulch. If existing
                    mulch is present, then we will spread the new mulch over the
                    top of the existing mulch.
                  </li>
                  <li>
                    <b>Remove all weeds from your garden beds.</b> We will not
                    remove weeds for you, so to allow the mulch to be as
                    effective as possible, please remove the weeds yourself.
                  </li>
                  <li>
                    <b>
                      Trim the bushes and trees in or around the garden beds.
                    </b>{" "}
                    Once the mulch is installed, removing the trimmings will be
                    more difficult.
                  </li>
                  <li>
                    <b>Edge your mulch bed.</b> If you have plans to remove
                    grass overhang, then remove it before we come and spread the
                    mulch.
                  </li>
                  <li>
                    <b>After the mulch is laid,</b> you will want to wait a day
                    or two and then water the mulch to help it settle into
                    place.
                  </li>
                </ol>
              </>
            }
          />
        ) : (
          <div className="mx-auto max-w-7xl sm:px-6 sm:pt-6 lg:px-8">
            <h2 className="text-2xl font-medium">Thank you!</h2>
            <p>
              We have reached our {NEXT_MULCH_YEAR - 1} goal and could not have
              done it without your support and generosity! We are grateful to
              live in a community that cares about the youth of today. We look
              forward to serving you again in {NEXT_MULCH_YEAR}.
            </p>
            <p>Happy Gardening!</p>
          </div>
        )}
      </div>
    </main>
  );
}

export function useMulchPrepContent() {
  return useOutletContext<ContextType>();
}
