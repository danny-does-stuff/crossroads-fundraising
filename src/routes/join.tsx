import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import * as React from "react";
import z from "zod";

import { getUserId, createUserSession } from "~/session.server";
import {
  createUser,
  createUserWithAdminRole,
  getUserByEmail,
} from "~/models/user.server";
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

// Server function to handle registration
const joinFn = createServerFn()
  .inputValidator(
    z.object({
      email: z.string(),
      password: z.string(),
      redirectTo: z.string().optional(),
      code: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { email, password, redirectTo, code } = data;

    const emptyErrors = {
      email: null,
      password: null,
      name: null,
      phone: null,
    };

    if (!validateEmail(email)) {
      return { errors: { ...emptyErrors, email: "Email is invalid" } };
    }

    if (typeof password !== "string" || password.length === 0) {
      return { errors: { ...emptyErrors, password: "Password is required" } };
    }

    if (password.length < 8) {
      return { errors: { ...emptyErrors, password: "Password is too short" } };
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        errors: {
          ...emptyErrors,
          email: "A user already exists with this email",
        },
      };
    }

    const adminInviteCode = process.env.ADMIN_INVITE_CODE;
    const wantsAdmin = typeof code === "string" && code.length > 0;

    if (wantsAdmin) {
      if (!adminInviteCode) {
        return {
          errors: {
            ...emptyErrors,
            password: "Admin signup is not configured for this site",
          },
        };
      }
      if (code !== adminInviteCode) {
        return {
          errors: {
            ...emptyErrors,
            password: "Invalid invite code",
          },
        };
      }

      const user = await createUserWithAdminRole({ email, password });
      await createUserSession({
        userId: user.id,
        remember: false,
        redirectTo: "/admin",
      });
    } else {
      const user = await createUser({ email, password });
      await createUserSession({
        userId: user.id,
        remember: false,
        redirectTo: safeRedirect(redirectTo, "/fundraisers/mulch/orders"),
      });
    }

    return { errors: null };
  });

export const Route = createFileRoute("/join")({
  component: JoinPage,
  validateSearch: (search): { code?: string; redirectTo?: string } => ({
    code: typeof search.code === "string" ? search.code : undefined,
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  beforeLoad: async () => {
    await checkAuth();
  },
  head: () => ({
    meta: [{ title: "Sign Up" }],
  }),
});

function JoinPage() {
  const searchParams = Route.useSearch();
  const { redirectTo, code } = searchParams;

  const [actionData, setActionData] = React.useState<{
    errors: {
      email: string | null;
      password: string | null;
      name: string | null;
      phone: string | null;
    } | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const join = useServerFn(joinFn);

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
    const redirectToValue = formData.get("redirectTo") as string;
    const codeValue = formData.get("code") as string;

    try {
      const result = await join({
        data: {
          email,
          password,
          redirectTo: redirectToValue,
          code: codeValue || undefined,
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
            id="email"
            label="Email address"
            error={actionData?.errors?.email}
            autoComplete="email"
            required
            autoFocus
            ref={emailRef}
          />
          <Input
            id="password"
            label="Password"
            error={actionData?.errors?.password}
            type="password"
            autoComplete="new-password"
            ref={passwordRef}
          />
          <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
          <input type="hidden" name="code" value={code ?? ""} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to="/login"
                search={{ redirectTo }}
              >
                Log in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
