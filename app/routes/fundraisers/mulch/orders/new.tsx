import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";

import { createOrder } from "~/models/mulchOrder.server";
import { z } from "zod";
import { Select } from "~/components/Select";
import { useMulchPrepContent } from "../orders";
import {
  ACCEPTING_MULCH_ORDERS,
  Neighborhood,
  REFERRAL_SOURCE_LABELS,
  ReferralSource,
} from "~/constants";

const SPREAD_PRICE_DIFFERENCE = 1;
const DELIVER_PRICE = 7;
const SPREAD_PRICE = DELIVER_PRICE + SPREAD_PRICE_DIFFERENCE;

const COLORS = [
  { label: "Black", value: "BLACK" },
  { label: "Brown", value: "BROWN" },
];

const NEIGHBORHOODS: Neighborhood[] = Object.values(Neighborhood).sort();

type Color = (typeof COLORS)[number]["value"];

export async function action({ request }: ActionFunctionArgs) {
  if (!ACCEPTING_MULCH_ORDERS) {
    return redirect("/fundraisers/mulch/orders");
  }

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
      phone: z.string().trim().min(10),
      referralSource: z.nativeEnum(ReferralSource),
      referralSourceDetails: z
        .union([
          z.string().trim().min(1, "Please specify how you heard about us"),
          z.null(),
        ])
        .superRefine((val, ctx) => {
          if (formData.get("referralSource") === ReferralSource.Other && !val) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please specify how you heard about us",
            });
          }
        }),
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
      referralSource: formData.get("referralSource"),
      referralSourceDetails: formData.get("referralSourceDetails"),
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
    referralSource: result.data.referralSource,
    referralSourceDetails: result.data.referralSourceDetails,
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
  const [shouldSpread, setShouldSpread] = React.useState(true);
  const pricePerUnit = shouldSpread ? SPREAD_PRICE : DELIVER_PRICE;

  const mulchPrepContent = useMulchPrepContent();

  const [selectedReferralSource, setSelectedReferralSource] =
    React.useState("");

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
      <p className="text-lg">
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
        <Select
          id="color"
          label="Mulch Color"
          error={getErrorForField("color")}
        >
          <option value="">Select a color</option>
          {COLORS.map((color) => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </Select>
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
          label={`Would you like us to spread the mulch? ($${SPREAD_PRICE_DIFFERENCE}/bag)`}
          type="checkbox"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setShouldSpread(e.target.checked)
          }
          checked={shouldSpread}
          wrapperClass="flex flex-row-reverse gap-2 items-center justify-end"
        />
        {currencyFormatter.format(pricePerUnit)}/bag X {Number(quantity)} ={" "}
        {currencyFormatter.format(pricePerUnit * Number(quantity))}
        <MulchCalculator />
        <hr className="mt-2" />
        <Input
          ref={nameRef}
          id="name"
          label="Name"
          error={getErrorForField("name")}
          autoComplete="name"
          placeholder="Chuck Norris"
        />
        <Input
          ref={phoneRef}
          id="phone"
          label="Phone"
          error={getErrorForField("phone")}
          autoComplete="tel"
        />
        <Input
          ref={emailRef}
          id="email"
          label="Email"
          error={getErrorForField("email")}
          autoComplete="email"
          placeholder="chuck@roundhouse.com"
        />
        <Select
          id="neighborhood"
          label="Neighborhood"
          error={getErrorForField("neighborhood")}
        >
          <option value="">Select one</option>
          {NEIGHBORHOODS.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>
              {neighborhood}
            </option>
          ))}
        </Select>
        <Input
          ref={streetRef}
          id="street"
          label="Street Address"
          error={getErrorForField("street")}
          autoComplete="street-address"
          placeholder="42 Wallaby Way"
        />
        <Input
          type="textarea"
          // @ts-expect-error - Input supports text area refs too
          ref={noteRef}
          id="note"
          label="Extra Details"
          error={getErrorForField("note")}
          placeholder="e.g. I have a driveway that is difficult to access, beware of the dog, etc."
        />
        <Select
          id="referralSource"
          label="How did you hear about us?"
          error={getErrorForField("referralSource")}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedReferralSource(e.target.value)
          }
        >
          <option value="">Select one</option>
          {Object.values(ReferralSource).map((value) => (
            <option key={value} value={value}>
              {REFERRAL_SOURCE_LABELS[value]}
            </option>
          ))}
        </Select>
        {selectedReferralSource === ReferralSource.Other && (
          <Input
            id="referralSourceDetails"
            label="Please specify"
            error={getErrorForField("referralSourceDetails")}
            placeholder="Tell us how you heard about us"
          />
        )}
        {mulchPrepContent}
        <div className="text-right">
          <Button type="submit">Proceed to Checkout</Button>
        </div>
      </Form>
    </div>
  );
}

/**
 * Component to help calculate how many bags of mulch the user needs
 */
function MulchCalculator() {
  const [length, setLength] = React.useState(20);
  const [width, setWidth] = React.useState(10);

  return (
    <div>
      <hr className="my-2" />
      <h3 className="text-xl font-medium">How many bags do I need?</h3>
      <p>
        Texas can be hot. It is recommended to spread mulch to a depth of 4".
        One bag at 4 inch thickness covers 6 square feet.
      </p>
      <div className="flex gap-2">
        <Input
          id="length"
          label="Length (feet)"
          type="number"
          min={0}
          value={length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLength(parseInt(e.target.value))
          }
        />
        <span className="pt-8">X</span>
        <Input
          id="width"
          label="Width (feet)"
          type="number"
          min={0}
          value={width}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setWidth(parseInt(e.target.value))
          }
        />
        <span className="pt-8">
          = {width * length} ft<sup>2</sup>.{" "}
        </span>
      </div>
      <div className="pt-2 font-medium">
        Suggested number of bags: {Math.ceil((width * length) / 6)}
      </div>
    </div>
  );
}
