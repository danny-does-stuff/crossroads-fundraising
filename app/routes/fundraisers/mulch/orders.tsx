import { Outlet, useOutletContext } from "@remix-run/react";

type ContextType = React.ReactNode;

export default function OrdersPage() {
  return (
    <div className="p-6">
      <Outlet
        context={
          <>
            <h2 className="text-xl font-medium">How to Prepare</h2>
            <p>
              The Crossroads Ward Youth will be delivering and spreading mulch
              on Saturday March 11 and Saturday March 18. We will reach out to
              you by email beforehand to let you know which day we will be
              servicing your home. Mulch removal is not included in the price of
              the mulch, so please remove any existing mulch from your garden
              beds before we arrive.
            </p>
            <ol className="ml-6 list-decimal">
              <li>Order Mulch</li>
              <li>Receive email notifying you of your delivery date</li>
              <li>Remove any old mulch</li>
              <li>Mulch Delivery!</li>
            </ol>
          </>
        }
      />
    </div>
  );
}

export function useMulchPrepContent() {
  return useOutletContext<ContextType>();
}
