import { Outlet, useOutletContext } from "@remix-run/react";
import { HeroImage } from "~/components/HeroImage";

type ContextType = React.ReactNode;

export default function OrdersPage() {
  return (
    <main>
      <HeroImage
        src="/assets/hands_spreading_mulch.jpg"
        alt="Hands spreading mulch"
      />
      <div className="p-6 pt-4">
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
                  remove weeds for you, so to allow the mulch to be as effective
                  as possible, please remove the weeds yourself.
                </li>
                <li>
                  <b>Trim the bushes and trees in or around the garden beds.</b>{" "}
                  Once the mulch is installed, removing the trimmings will be
                  more difficult.
                </li>
                <li>
                  <b>Edge your mulch bed.</b> If you have plans to remove grass
                  overhang, then remove it before we come and spread the mulch.
                </li>
                <li>
                  <b>After the mulch is laid,</b> you will want to wait a day or
                  two and then water the mulch to help it settle into place.
                </li>
              </ol>
            </>
          }
        />
      </div>
    </main>
  );
}

export function useMulchPrepContent() {
  return useOutletContext<ContextType>();
}
