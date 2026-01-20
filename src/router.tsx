import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getClientConfig } from "./config";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    context: {
      user: null,
      ENV: {
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      },
      wardConfig: getClientConfig(),
    },
  });

  return router;
}
