import {
  createFileRoute,
  ErrorComponent,
} from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { CONTACT_EMAIL } from "~/constants";
import { Button } from "~/components/Button";

import { updateOrderById, getOrder } from "~/models/mulchOrder.server";
import { createOrderCheckoutSession } from "~/services/stripe/checkout.server";
import { useMulchPrepContent } from "../orders";

// Server function to load order data
const loadOrder = createServerFn()
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const order = await getOrder({ id: data.orderId });
    if (!order) {
      throw new Error("Order not found");
    }
    return { order };
  });

const cancelOrderSchema = z.object({
  orderId: z.string(),
});

// Server function to cancel order
const cancelOrderFn = createServerFn()
  .inputValidator((data: unknown) => cancelOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await updateOrderById(data.orderId, {
      status: "CANCELLED",
    });
    return { order };
  });

const createCheckoutSchema = z.object({
  orderId: z.string(),
  returnUrl: z.string().url(),
});

// Server function to create Stripe Checkout session for order
const createOrderCheckoutFn = createServerFn()
  .inputValidator((data: unknown) => createCheckoutSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await getOrder({ id: data.orderId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "PENDING") {
      throw new Error("Order is not pending payment");
    }

    const session = await createOrderCheckoutSession({
      orderId: order.id,
      quantity: order.quantity,
      pricePerUnit: order.pricePerUnit,
      color: order.color,
      orderType: order.orderType,
      customerEmail: order.customer.email,
      successUrl: `${data.returnUrl}/fundraisers/mulch/orders/${order.id}?payment=success`,
      cancelUrl: `${data.returnUrl}/fundraisers/mulch/orders/${order.id}?payment=cancelled`,
    });

    return { checkoutUrl: session.url };
  });

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const Route = createFileRoute("/fundraisers/mulch/orders/$orderId")({
  component: OrderDetailsPage,
  loader: async ({ params }) => {
    invariant(params.orderId, "orderId not found");
    return loadOrder({ data: { orderId: params.orderId } });
  },
  errorComponent: OrderErrorBoundary,
});

function OrderDetailsPage() {
  const { order: initialOrder } = Route.useLoaderData();
  const [order, setOrder] = useState(initialOrder);
  const params = Route.useParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = useServerFn(cancelOrderFn);
  const createOrderCheckout = useServerFn(createOrderCheckoutFn);

  const mulchPrepContent = useMulchPrepContent();

  const total = order.pricePerUnit * order.quantity;

  async function handleCancelOrder() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await cancelOrder({
        data: {
          orderId: params.orderId,
        },
      });
      if (result.order) {
        setOrder(result.order);
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setError("Failed to cancel order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePayment() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createOrderCheckout({
        data: {
          orderId: params.orderId,
          returnUrl: window.location.origin,
        },
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-2xl font-bold">Mulch Order</h3>
      <div className="font-l mb-4 flex flex-col gap-4">
        <div>
          <b>Number of bags:</b> {order.quantity}
        </div>
        <div>
          <b>Spreading Service?</b>{" "}
          {order.orderType === "SPREAD" ? "Yes" : "No, delivery only"}
        </div>
        <div>
          <b>Delivery address:</b> <u>{order.streetAddress}</u> in{" "}
          <u>{order.neighborhood}</u>
        </div>
        <h4>
          <b>Total:</b> {order.quantity} bags X{" "}
          {currencyFormatter.format(order.pricePerUnit)} ={" "}
          {currencyFormatter.format(total)}
        </h4>
      </div>

      {order.status === "PENDING" ? (
        <>
          <div className="max-w-xs space-y-4">
            <Button
              type="button"
              onClick={handlePayment}
              disabled={isSubmitting}
              className="w-full py-4 text-lg"
            >
              {isSubmitting ? "Redirecting..." : "Pay Now"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              You&apos;ll be redirected to Stripe&apos;s secure checkout
            </p>
          </div>

          {error && (
            <p className="mt-2 text-red-500">{error}</p>
          )}

          <hr className="my-4" />
          <div className="mb-4">{mulchPrepContent}</div>
          <button
            type="button"
            onClick={handleCancelOrder}
            disabled={isSubmitting}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            {isSubmitting ? "Cancelling..." : "Cancel Order"}
          </button>
        </>
      ) : order.status === "CANCELLED" ? (
        <div className="font-bold text-red-500">Order Cancelled</div>
      ) : (
        <>
          <div className="font-bold text-green-500">
            Paid!! Thank you for your business. We will reach out to you
            through email to schedule the delivery{" "}
            {order.orderType === "SPREAD" ? "and spreading " : ""}service.
          </div>
          <div className="mt-4 space-y-4">
            <div className="rounded border border-gray-200 p-4 shadow">
              <p className="font-semibold">
                Important Notice Regarding Refunds:
              </p>
              <p>
                If you are dissatisfied with your order for any reason, please
                contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                before making any claims with your credit card company. We are
                committed to your satisfaction and will work with you to
                resolve any issues.
              </p>
            </div>

            <div className="rounded border border-gray-200 p-4 shadow">
              <p className="font-semibold">Delivery Notification:</p>
              <p>
                You will receive an email notification 5 days prior to your
                scheduled delivery{" "}
                {order.orderType === "SPREAD" ? "and spreading " : ""}service.
                If you do not receive this notification, please contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                to verify your order status.
              </p>
            </div>
          </div>
          <div className="mt-4">{mulchPrepContent}</div>
        </>
      )}
    </div>
  );
}

function OrderErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  const isNotFound = error.message === "Order not found";

  return (
    <div
      className="relative mb-3 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
      role="alert"
    >
      {isNotFound ? (
        "Order not found."
      ) : (
        <>An unexpected error occurred: {error.message}</>
      )}
      <br />
      <br />
      If you believe you paid for this order, please contact us at{" "}
      {CONTACT_EMAIL}
    </div>
  );
}
