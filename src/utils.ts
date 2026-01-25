import { getRouteApi, useRouteContext } from "@tanstack/react-router";
import type { UserInSession } from "~/models/user.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * Hook to get the optional user from the router context.
 * Uses TanStack Router's useRouteContext to access the user.
 */
export function useOptionalUser(): UserInSession | undefined {
  const context = useRouteContext({ from: "__root__" });
  return context.user ?? undefined;
}

/**
 * Hook to get the required user from the router context.
 * Throws an error if no user is found.
 */
export function useUser(): UserInSession {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in router context, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  return maybeUser;
}

/**
 * Hook to get ENV variables from router context.
 */
export function useEnv() {
  const context = useRouteContext({ from: "__root__" });
  return context.ENV;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

export function useWardConfig() {
  return getRouteApi("__root__").useRouteContext().wardConfig;
}
