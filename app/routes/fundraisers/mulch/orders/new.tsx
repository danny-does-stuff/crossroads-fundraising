import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";

import { createOrder } from "~/models/mulchOrder.server";
import { z } from "zod";
import { Select } from "~/components/Select";

const SPREAD_PRICE_DIFFERENCE = 1;
const DELIVER_PRICE = 7;
const SPREAD_PRICE = DELIVER_PRICE + SPREAD_PRICE_DIFFERENCE;

const COLORS = [
  { label: "Black", value: "BLACK" },
  { label: "Brown", value: "BROWN" },
];

enum Neighborhood {
  Arrowbrooke = "Arrowbrooke",
  Savannah = "Savannah",
  UnionPark = "Union Park",
  PalomaCreek = "Paloma Creek",
  WinnRidge = "Winn Ridge",
  Glenbrooke = "Glenbrooke",
}

const NEIGHBORHOODS: Neighborhood[] = [
  Neighborhood.Arrowbrooke,
  Neighborhood.Savannah,
  Neighborhood.UnionPark,
  Neighborhood.PalomaCreek,
  Neighborhood.WinnRidge,
  Neighborhood.Glenbrooke,
];

type Color = (typeof COLORS)[number]["value"];

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  const result = z
    .object({
      quantity: z.string().regex(/^\d+$/).transform(Number),
      color: z.enum(COLORS.map((c) => c.value) as [Color, ...Color[]]),
      shouldSpread: z.boolean(),
      note: z.string().trim(),
      neighborhood: z.enum(NEIGHBORHOODS as [Neighborhood, ...Neighborhood[]]),
      street: z.string().trim().min(1),
      name: z.string().trim().min(1),
      email: z.string().trim().email(),
      phone: z.string().trim(),
    })
    .safeParse({
      quantity: formData.get("quantity"),
      color: formData.get("color"),
      shouldSpread: formData.get("shouldSpread") === "on",
      neighborhood: formData.get("neighborhood"),
      street: formData.get("street"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      note: formData.get("note"),
    });

  if (!result.success) {
    return json({ errors: result.error.format() }, { status: 400 });
  }
  const { shouldSpread, quantity, color, note, neighborhood, street } =
    result.data;

  const order = await createOrder({
    quantity,
    color,
    note,
    neighborhood,
    streetAddress: street,
    orderType: shouldSpread ? "SPREAD" : "DELIVERY",
    pricePerUnit: shouldSpread ? SPREAD_PRICE : DELIVER_PRICE,
    customer: {
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
    },
  });

  return redirect(`/fundraisers/mulch/orders/${order.id}`);
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function NewOrderPage() {
  const actionData = useActionData<typeof action>();
  const quantityRef = React.useRef<HTMLInputElement>(null);
  const colorRef = React.useRef<HTMLSelectElement>(null);
  const streetRef = React.useRef<HTMLInputElement>(null);
  const neighborhoodRef = React.useRef<HTMLSelectElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const phoneRef = React.useRef<HTMLInputElement>(null);
  const noteRef = React.useRef<HTMLTextAreaElement>(null);

  const [quantity, setQuantity] = React.useState<string>("1");
  const [shouldSpread, setShouldSpread] = React.useState(false);
  const pricePerUnit = shouldSpread ? SPREAD_PRICE : DELIVER_PRICE;

  React.useEffect(() => {
    if (!actionData || !("errors" in actionData)) {
      return;
    }
    if (actionData.errors?.quantity) {
      quantityRef.current?.focus();
    } else if (actionData.errors?.color) {
      colorRef.current?.focus();
    } else if (actionData.errors?.neighborhood) {
      neighborhoodRef.current?.focus();
    } else if (actionData.errors?.street) {
      streetRef.current?.focus();
    } else if (actionData.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData.errors?.phone) {
      phoneRef.current?.focus();
    }
  }, [actionData]);

  function getErrorForField(field: string) {
    return (
      actionData &&
      "errors" in actionData &&
      // @ts-expect-error - field should be a key of the errors object
      actionData.errors?.[field]?._errors[0]
    );
  }

  return (
    <div>
      <p>
        Order now and pay {currencyFormatter.format(SPREAD_PRICE)} per bag for
        having the mulch spread in your landscaping, or{" "}
        {currencyFormatter.format(DELIVER_PRICE)} per bag to have it delivered
        to your driveway.
      </p>
      <br />
      <Form
        method="post"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        <Input
          ref={quantityRef}
          id="quantity"
          label="Number of bags"
          error={getErrorForField("quantity")}
          type="number"
          min={1}
          value={quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuantity(e.target.value)
          }
        />
        <Input
          id="shouldSpread"
          label={`Would you like us to spread the mulch? (+$${SPREAD_PRICE_DIFFERENCE}/bag)`}
          type="checkbox"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setShouldSpread(e.target.checked)
          }
          value={shouldSpread}
          wrapperClass="flex flex-row-reverse gap-2 items-center"
        />
        {currencyFormatter.format(pricePerUnit)}/bag X {Number(quantity)} ={" "}
        {currencyFormatter.format(pricePerUnit * Number(quantity))}
        <Select id="color" label="Color" error={getErrorForField("color")}>
          {COLORS.map((color) => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </Select>
        <div>
          <Select
            id="neighborhood"
            label="Neighborhood"
            error={getErrorForField("neighborhood")}
          >
            {NEIGHBORHOODS.map((neighborhood) => (
              <option key={neighborhood} value={neighborhood}>
                {neighborhood}
              </option>
            ))}
          </Select>
        </div>
        <Input
          ref={streetRef}
          id="street"
          label="Street Address"
          error={getErrorForField("street")}
          autoComplete="street-address"
        />
        <Input
          type="textarea"
          // @ts-ignore - We want to pass a textarea ref to Input
          ref={noteRef}
          id="note"
          label="Extra Details"
          error={getErrorForField("note")}
        />
        <Input
          ref={nameRef}
          id="name"
          label="Name"
          error={getErrorForField("name")}
          autoComplete="name"
        />
        <Input
          ref={emailRef}
          id="email"
          label="Email"
          error={getErrorForField("email")}
          autoComplete="email"
        />
        <Input
          ref={phoneRef}
          id="phone"
          label="Phone"
          error={getErrorForField("phone")}
          autoComplete="tel"
        />
        <div className="text-right">
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    </div>
  );
}
