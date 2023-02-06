import { Outlet } from "@remix-run/react";

export default function OrdersPage() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
}
