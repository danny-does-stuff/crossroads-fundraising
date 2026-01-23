import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getClientConfig } from "./config";

export function getRouter() {
  console.log('[ROUTER] getRouter() called');
  const clientConfig = getClientConfig();
  console.log('[ROUTER] clientConfig.acceptingMulchOrders:', clientConfig.acceptingMulchOrders);
  
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    context: {
      user: null,
      ENV: {
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      },
      wardConfig: clientConfig,
    },
  });

  console.log('[ROUTER] Router context wardConfig.acceptingMulchOrders:', router.options.context.wardConfig.acceptingMulchOrders);
  return router;
}
