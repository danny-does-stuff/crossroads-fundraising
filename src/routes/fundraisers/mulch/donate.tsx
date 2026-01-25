import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/fundraisers/mulch/donate")({
  component: DonateLayout,
});

function DonateLayout() {
  return <Outlet />;
}
