import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { useUser } from "~/utils";

import { createOrder } from "~/models/mulchOrder.server";
import { requireUserId } from "~/session.server";
import { z } from "zod";
import { Select } from "~/components/Select";

const DELIVER_PRICE = 7;
const SPREAD_PRICE = DELIVER_PRICE + 1;

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
}

const NEIGHBORHOODS: Neighborhood[] = [
  Neighborhood.Arrowbrooke,
  Neighborhood.Savannah,
  Neighborhood.UnionPark,
  Neighborhood.PalomaCreek,
  Neighborhood.WinnRidge,
];

type Color = (typeof COLORS)[number]["value"];

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const result = z
    .object({
      quantity: z.string().regex(/^\d+$/).transform(Number),
      color: z.enum(COLORS.map((c) => c.value) as [Color, ...Color[]]),
      shouldSpread: z.boolean(),
      note: z.string().trim(),
      neighborhood: z.enum(NEIGHBORHOODS as [Neighborhood, ...Neighborhood[]]),
      street: z.string().trim().min(1),
      city: z.string().trim().min(1),
      state: z.literal("TX"),
      zip: z.string().trim().min(5),
      deliveryAddressId: z.string().optional(),
    })
    .safeParse({
      quantity: formData.get("quantity"),
      color: formData.get("color"),
      shouldSpread: formData.get("shouldSpread") === "on",
      neighborhood: formData.get("neighborhood"),
      street: formData.get("street"),
      city: formData.get("city"),
      state: formData.get("state"),
      zip: formData.get("zip"),
      deliveryAddressId: formData.get("deliveryAddressId"),
      note: formData.get("note"),
    });

  if (!result.success) {
    console.log(result);
    return json({ errors: result.error.format() }, { status: 400 });
  }
  const { shouldSpread, quantity, color, note, deliveryAddressId, ...address } =
    result.data;

  const order = await createOrder({
    userId,
    quantity,
    color,
    note,
    orderType: shouldSpread ? "SPREAD" : "DELIVERY",
    pricePerUnit: shouldSpread ? SPREAD_PRICE : DELIVER_PRICE,
    deliveryAddressId: deliveryAddressId,
    address: { ...address, userId },
  });

  return redirect(`/fundraisers/mulch/orders/${order.id}`);
}

export default function NewOrderPage() {
  const user = useUser();
  const address = user.addresses[0];

  const actionData = useActionData<typeof action>();
  const quantityRef = React.useRef<HTMLInputElement>(null);
  const colorRef = React.useRef<HTMLSelectElement>(null);
  const streetRef = React.useRef<HTMLInputElement>(null);
  const cityRef = React.useRef<HTMLInputElement>(null);
  const stateRef = React.useRef<HTMLInputElement>(null);
  const zipRef = React.useRef<HTMLInputElement>(null);
  const neighborhoodRef = React.useRef<HTMLSelectElement>(null);
  const noteRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.quantity) {
      quantityRef.current?.focus();
    } else if (actionData?.errors?.color) {
      colorRef.current?.focus();
    } else if (actionData?.errors?.neighborhood) {
      neighborhoodRef.current?.focus();
    } else if (actionData?.errors?.street) {
      streetRef.current?.focus();
    } else if (actionData?.errors?.city) {
      cityRef.current?.focus();
    } else if (actionData?.errors?.state) {
      stateRef.current?.focus();
    } else if (actionData?.errors?.zip) {
      zipRef.current?.focus();
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
      <Input
        ref={quantityRef}
        id="quantity"
        label="Number of bags"
        error={actionData?.errors?.quantity?._errors[0]}
        type="number"
      />

      <Input
        id="shouldSpread"
        label="Would you like us to spread the mulch? (+$1/bag)"
        type="checkbox"
      />

      {/* select element for color. */}
      <div>
        <label
          htmlFor="color"
          className="block text-sm font-medium text-gray-700"
        >
          Color
        </label>
        <div className="mt-1">
          <select
            id="color"
            name="color"
            aria-invalid={
              actionData?.errors?.color?._errors[0] ? true : undefined
            }
            aria-describedby="color-error"
            className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
            ref={colorRef}
          >
            {COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Select
          id="neighborhood"
          label="Neighborhood"
          error={actionData?.errors?.neighborhood?._errors[0]}
          defaultDisplayValue={NEIGHBORHOODS.find(
            (neighborhood) => neighborhood === address?.neighborhood
          )}
          defaultValue={address?.neighborhood}
          readOnly={!!address?.neighborhood}
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
        label="Street"
        error={actionData?.errors?.street?._errors[0]}
        autoComplete="street-address"
        defaultValue={address?.street}
        readOnly={!!address?.street}
      />
      <Input
        ref={cityRef}
        id="city"
        label="City"
        error={actionData?.errors?.city?._errors[0]}
        autoComplete="address-level2"
        defaultValue={address?.city}
        readOnly={!!address?.city}
      />
      <Input
        ref={stateRef}
        id="state"
        label="State"
        error={actionData?.errors?.state?._errors[0]}
        autoComplete="address-level1"
        value="TX"
        readOnly
      />
      <Input
        ref={zipRef}
        id="zip"
        label="Zip"
        error={actionData?.errors?.zip?._errors[0]}
        autoComplete="postal-code"
        defaultValue={address?.zip}
        readOnly={!!address?.zip}
      />
      <Input
        ref={noteRef}
        id="note"
        label="Extra Details"
        error={actionData?.errors?.note?._errors[0]}
      />
      {/* hidden input for delivery address */}
      <input type="hidden" name="deliveryAddressId" value={address?.id} />

      <div className="text-right">
        <Button type="submit">Go to payment</Button>
      </div>
    </Form>
  );
}
