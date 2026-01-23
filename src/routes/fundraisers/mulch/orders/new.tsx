import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import * as React from "react";
import z from "zod";

import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { Select } from "~/components/Select";
import { createOrder } from "~/models/mulchOrder.server";
import { REFERRAL_SOURCE_LABELS, ReferralSource } from "~/constants";
import { getWardConfig } from "~/config";
import { useMulchPrepContent } from "../orders";

const COLORS = [
  { label: "Black", value: "BLACK" },
  { label: "Brown", value: "BROWN" },
];

type Color = (typeof COLORS)[number]["value"];

// Server function to create order
const createOrderFn = createServerFn()
  .inputValidator(async (data) => {
    // Get config at request time for validation
    const config = await getWardConfig();

    const orderSchema = z
      .object({
        quantity: z.string().regex(/^\d+$/).transform(Number),
        color: z.enum(COLORS.map((c) => c.value) as [Color, ...Color[]]),
        shouldSpread: z.boolean(),
        note: z.string().trim(),
        neighborhood: z.enum(config.neighborhoods),
        street: z.string().trim().min(1, "Street address is required"),
        name: z.string().trim().min(1, "Name is required"),
        email: z
          .string()
          .trim()
          .pipe(z.email({ error: "Valid email is required" })),
        phone: z.string().trim().min(10, "Phone must be at least 10 digits"),
        referralSource: z.enum(ReferralSource),
        referralSourceDetails: z.string().trim().nullable(),
      })
      .refine(
        (order) =>
          order.referralSource !== ReferralSource.Other ||
          order.referralSourceDetails,
        {
          path: ["referralSourceDetails"],
          message: "Please specify how you heard about us",
        }
      );

    const result = orderSchema.safeParse(data);
    if (!result.success) {
      throw z.flattenError(result.error);
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    const config = await getWardConfig();

    if (!config.acceptingMulchOrders) {
      throw redirect({ to: "/fundraisers/mulch/orders" });
    }

    const { shouldSpread, quantity, color, note, neighborhood, street } = data;

    const pricePerUnit = shouldSpread
      ? config.mulchPriceSpread
      : config.mulchPriceDelivery;

    const order = await createOrder({
      quantity,
      color,
      note,
      neighborhood,
      streetAddress: street,
      orderType: shouldSpread ? "SPREAD" : "DELIVERY",
      pricePerUnit,
      referralSource: data.referralSource,
      referralSourceDetails: data.referralSourceDetails,
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    throw redirect({
      to: `/fundraisers/mulch/orders/$orderId`,
      params: { orderId: order.id },
    });
  });

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const Route = createFileRoute("/fundraisers/mulch/orders/new")({
  component: NewOrderPage,
});

function NewOrderPage() {
  const { wardConfig } = getRouteApi("__root__").useLoaderData();

  const [fieldErrors, setFieldErrors] = React.useState<Record<
    string,
    string
  > | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
  const pricePerUnit = shouldSpread
    ? wardConfig.mulchPriceSpread
    : wardConfig.mulchPriceDelivery;
  const spreadPriceDifference =
    wardConfig.mulchPriceSpread - wardConfig.mulchPriceDelivery;

  const mulchPrepContent = useMulchPrepContent();

  const [selectedReferralSource, setSelectedReferralSource] =
    React.useState("");

  const createOrderAction = useServerFn(createOrderFn);

  React.useEffect(() => {
    if (!fieldErrors) {
      return;
    }
    if (fieldErrors["quantity"]) {
      quantityRef.current?.focus();
    } else if (fieldErrors["color"]) {
      colorRef.current?.focus();
    } else if (fieldErrors["neighborhood"]) {
      neighborhoodRef.current?.focus();
    } else if (fieldErrors["street"]) {
      streetRef.current?.focus();
    } else if (fieldErrors["name"]) {
      nameRef.current?.focus();
    } else if (fieldErrors["email"]) {
      emailRef.current?.focus();
    } else if (fieldErrors["phone"]) {
      phoneRef.current?.focus();
    }
  }, [fieldErrors]);

  function getErrorForField(field: string) {
    return fieldErrors?.[field];
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await createOrderAction({
        data: {
          quantity: formData.get("quantity") as string,
          color: formData.get("color") as Color,
          shouldSpread: formData.get("shouldSpread") === "on",
          note: (formData.get("note") as string) || "",
          neighborhood: formData.get("neighborhood"),
          street: formData.get("street") as string,
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          referralSource: formData.get("referralSource") as ReferralSource,
          referralSourceDetails:
            (formData.get("referralSourceDetails") as string) || null,
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "fieldErrors" in error &&
        typeof error.fieldErrors === "object" &&
        error.fieldErrors
      ) {
        // Cast is ok because we are very confident this is the error we're expecting at this point
        setFieldErrors(error.fieldErrors as Record<string, string>);
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-lg">
        Order now and pay{" "}
        {currencyFormatter.format(wardConfig.mulchPriceSpread)} per bag for
        having the mulch spread in your landscaping, or{" "}
        {currencyFormatter.format(wardConfig.mulchPriceDelivery)} per bag to
        have it delivered to your driveway.
      </p>
      <br />
      <form
        onSubmit={handleSubmit}
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
          label={`Would you like us to spread the mulch? ($${spreadPriceDifference}/bag)`}
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
          {wardConfig.neighborhoods.map((neighborhood) => (
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Proceed to Checkout"}
          </Button>
        </div>
      </form>
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
        Texas can be hot. It is recommended to spread mulch to a depth of
        4&quot;. One bag at 4 inch thickness covers 6 square feet.
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
