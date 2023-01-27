// The base for the mulch fundraiser page. Includes a bit of margin and an Outlet

import { Outlet } from "@remix-run/react";

export default function MulchFundraiserPage() {
  return (
    <div className="m-4">
      <Outlet />
    </div>
  );
}
