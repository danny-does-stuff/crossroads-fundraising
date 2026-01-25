import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { logout } from "~/session.server";

// Server function to handle logout
const logoutFn = createServerFn().handler(async () => {
  await logout();
});

export const Route = createFileRoute("/logout")({
  // Redirect to home if accessed via GET
  beforeLoad: async () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

// Export the logout function for use in other components
export { logoutFn };
