import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  routes(defineRoutes) {
    // uses the v1 routes convention (nested in folders)
    return createRoutesFromFolders(defineRoutes);
  },
};
