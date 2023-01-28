import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";

import { getUserId, createUserSession } from "~/session.server";

import { createUser, getUserByEmail } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");
  const phone = formData.get("phone");
  const redirectTo = safeRedirect(
    formData.get("redirectTo"),
    "/fundraisers/mulch/orders"
  );

  const emptyErrors = {
    email: null,
    password: null,
    name: null,
    phone: null,
  };

  if (!validateEmail(email)) {
    return json(
      { errors: { ...emptyErrors, email: "Email is invalid" } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { ...emptyErrors, password: "Password is required" } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { ...emptyErrors, password: "Password is too short" } },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return json(
      { errors: { ...emptyErrors, name: "Name is required" } },
      { status: 400 }
    );
  }

  if (typeof phone !== "string" || phone.trim().length === 0) {
    return json(
      { errors: { ...emptyErrors, phone: "Phone is required" } },
      { status: 400 }
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          ...emptyErrors,
          email: "A user already exists with this email",
        },
      },
      { status: 400 }
    );
  }

  const user = await createUser({ email, name, phone, password });

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return {
    title: "Sign Up",
  };
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const phoneRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
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
            id="name"
            label="Name"
            error={actionData?.errors?.name}
            autoComplete="name"
            required
            ref={nameRef}
          />
          <Input
            id="phone"
            label="Phone"
            error={actionData?.errors?.phone}
            autoComplete="phone"
            required
            ref={phoneRef}
          />
          <Input
            id="password"
            label="Password"
            error={actionData?.errors?.password}
            type="password"
            autoComplete="new-password"
            ref={passwordRef}
          />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button type="submit">Create Account</Button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
