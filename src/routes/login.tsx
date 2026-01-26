import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import * as React from "react";
import z from "zod";

import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";

// Server function to check if user is already logged in
const checkAuth = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (userId) {
    throw redirect({ to: "/" });
  }
});

// Server function to handle login
const loginFn = createServerFn()
  .inputValidator(
    z.object({
      email: z.string(),
      password: z.string(),
      redirectTo: z.string().optional(),
      remember: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { email, password, redirectTo, remember } = data;

    if (!validateEmail(email)) {
      return { errors: { email: "Email is invalid", password: null } };
    }

    if (typeof password !== "string" || password.length === 0) {
      return { errors: { email: null, password: "Password is required" } };
    }

    if (password.length < 8) {
      return { errors: { email: null, password: "Password is too short" } };
    }

    const user = await verifyLogin(email, password);

    if (!user) {
      return { errors: { email: "Invalid email or password", password: null } };
    }

    // This will redirect on success
    await createUserSession({
      userId: user.id,
      remember: remember ?? false,
      redirectTo: safeRedirect(redirectTo, "/"),
    });

    // This line won't be reached due to redirect, but TypeScript needs it
    return { errors: null };
  });

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: async () => {
    await checkAuth();
  },
  head: () => ({
    meta: [{ title: "Login" }],
  }),
  validateSearch: (search): { redirectTo?: string } => {
    return {
      redirectTo:
        typeof search.redirectTo === "string" ? search.redirectTo : undefined,
    };
  },
});

function LoginPage() {
  const searchParams = Route.useSearch();
  const redirectTo = searchParams.redirectTo;

  const [actionData, setActionData] = React.useState<{
    errors: { email: string | null; password: string | null } | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const login = useServerFn(loginFn);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";
    const redirectToValue = formData.get("redirectTo") as string;

    try {
      const result = await login({
        data: {
          email,
          password,
          remember,
          redirectTo: redirectToValue,
        },
      });
      if (result?.errors) {
        setActionData(result);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            error={actionData?.errors?.email}
            ref={emailRef}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            error={actionData?.errors?.password}
            ref={passwordRef}
          />

          <input type="hidden" name="redirectTo" value={redirectTo || ""} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
            <div className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to="/join"
                search={{ redirectTo }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
