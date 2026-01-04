import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import {
  createFileRoute,
  ErrorComponent,
  useRouter,
} from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { CONTACT_EMAIL } from "~/constants";

import { updateOrderById, getOrder } from "~/models/mulchOrder.server";
import { useEnv } from "~/utils";
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

const updateOrderSchema = z.union([
  z.object({
    orderId: z.string(),
    paypalOrderId: z.string(),
    paypalPayerId: z.string().nullable(),
    paypalPaymentSource: z.string(),
    status: z.literal("PAID"),
  }),
  z.object({
    orderId: z.string(),
    status: z.literal("CANCELLED"),
  }),
]);

// Server function to update order
const updateOrderFn = createServerFn()
  .inputValidator((data: unknown) => updateOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { orderId, ...updateData } = data;
    const order = await updateOrderById(orderId, updateData);
    return { order };
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
  const updateData = useRef<{
    paypalOrderId: string;
    paypalPaymentSource: string;
  }>();
  const { order: initialOrder } = Route.useLoaderData();
  const [order, setOrder] = useState(initialOrder);
  const params = Route.useParams();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateOrder = useServerFn(updateOrderFn);

  const ENV = useEnv();
  const mulchPrepContent = useMulchPrepContent();

  const total = order.pricePerUnit * order.quantity;

  async function handleCancelOrder() {
    setIsSubmitting(true);
    try {
      const result = await updateOrder({
        data: {
          orderId: params.orderId,
          status: "CANCELLED",
        },
      });
      if (result.order) {
        setOrder(result.order);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: ENV?.PAYPAL_CLIENT_ID || "",
        components: "buttons",
        currency: "USD",
        "disable-funding": "credit,card",
      }}
    >
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
            <div className="max-w-xs">
              <PayPalButtons
                disabled={isSubmitting}
                createOrder={async ({ paymentSource }, actions) => {
                  const orderId = await actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                      {
                        amount: {
                          currency_code: "USD",
                          value: String(total),
                          breakdown: {
                            item_total: {
                              value: String(total),
                              currency_code: "USD",
                            },
                          },
                        },
                        custom_id: String(order.id),
                        items: [
                          {
                            name: "Bag o' Mulch",
                            quantity: String(order.quantity),
                            description: `${
                              order.color[0] +
                              order.color.slice(1).toLowerCase()
                            } mulch${
                              order.orderType === "SPREAD"
                                ? " plus mulch spreading service"
                                : " delivered to your house, no spreading service"
                            }`,
                            unit_amount: {
                              value: String(order.pricePerUnit),
                              currency_code: "USD",
                            },
                          },
                        ],
                      },
                    ],
                  });

                  console.log({ paymentSource, orderId });

                  updateData.current = {
                    paypalPaymentSource: paymentSource,
                    paypalOrderId: orderId,
                  };
                  return orderId;
                }}
                onApprove={async (data, actions) => {
                  console.log("onApprove", { data, actions });

                  const details = await actions.order?.capture();
                  if (!updateData.current || !details) {
                    console.log("no update data or details", {
                      data: updateData.current,
                      details,
                    });
                    return;
                  }
                  if (
                    details &&
                    updateData.current &&
                    details.id === updateData.current?.paypalOrderId
                  ) {
                    console.log("approval is valid", details);
                    setIsSubmitting(true);
                    try {
                      const result = await updateOrder({
                        data: {
                          orderId: params.orderId,
                          ...updateData.current,
                          status: "PAID",
                          paypalPayerId: details.payer?.payer_id ?? null,
                        },
                      });
                      if (result.order) {
                        setOrder(result.order);
                      }
                    } finally {
                      setIsSubmitting(false);
                    }
                  } else {
                    console.log("payment not captured", {
                      detailsId: details?.id,
                      updateData: updateData.current,
                    });
                  }
                }}
                onError={(error) => {
                  console.log("received an error", { error });
                }}
                onCancel={(cancelEvent) => {
                  console.log("payment cancelled", cancelEvent);
                }}
              />
            </div>
            <p className="mb-4 italic text-gray-500">
              To pay with credit card, select PayPal.
            </p>
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
    </PayPalScriptProvider>
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

