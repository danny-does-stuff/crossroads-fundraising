// a remix route to fill in your contact information in a form and submit it
import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";

import { requireUserId } from "~/session.server";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const errors: Record<FieldName, string> = {};
  fields.forEach((field) => {
    const value = formData.get(field.name);
    if (typeof value !== "string" || value.length === 0) {
      errors[field.name] = `${field.label} is required`;
    }
  });


  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  // TODO create mulch order
  const mulchOrder = await { id: "new", userId: userId };

  return redirect(`/fundraisers/mulch/${mulchOrder.id}`);
}

const fields = [
  { name: "name", label: "Name", autocomplete: "name"},
  { name: "street", label: "Street", autocomplete: "street-address" },
  { name: "city", label: "City", autocomplete: "address-level2" },
  { name: "state", label: "State", autocomplete: "address-level1" },
  { name: "zip", label: "Zip", autocomplete: "postal-code" },
  {
    name: "phone",
    label: "Phone",
    autocomplete: "tel",
    type: "tel",
    validator: (phoneNumber: string) => {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!phoneRegex.test(phoneNumber)) {
        return "Invalid phone number";
      }
    },
  },
  { name: "email", label: "Email", autocomplete: "email", type: "email" },
];

type FieldName = (typeof fields)[number]["name"];

export default function NewMulchOrderPage() {
  const actionData = useActionData<typeof action>();
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      {fields.map(({ name, label, autocomplete, type }) => {
        return (
          <div key={name}>
            <label className="flex w-full flex-col gap-1">
              <span>{label}: </span>
              <input
                type={type || "text"}
                name={name}
                className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                autoComplete={autocomplete}
                aria-invalid={actionData?.errors?.[name] ? true : undefined}
                aria-errormessage={
                  actionData?.errors?.[name] ? `${name}-error` : undefined
                }
              />
            </label>
            {actionData?.errors?.[name] && (
              <div className="pt-1 text-red-700" id={`${name}-error`}>
                {actionData.errors[name]}
              </div>
            )}
          </div>
        );
      })}

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Submit
        </button>
      </div>
    </Form>
  );
}
