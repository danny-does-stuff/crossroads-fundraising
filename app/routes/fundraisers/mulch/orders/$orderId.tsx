import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useCatch, useFetcher, useLoaderData } from "@remix-run/react";
import { useRef } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { CONTACT_EMAIL } from "~/constants";

import { updateOrderById, getOrder } from "~/models/mulchOrder.server";
import { useMatchesData } from "~/utils";
import { useMulchPrepContent } from "../orders";

export async function loader({ request, params }: LoaderArgs) {
  // TODO: use a short lived session to verify that the user is the one who created the order
  invariant(params.orderId, "orderId not found");

  const order = await getOrder({ id: params.orderId });
  if (!order) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ order });
}

export async function action({ request, params }: ActionArgs) {
  invariant(params.orderId, "orderId not found");

  const body = await request.formData();
  const orderUpdateInfo = z
    .union([
      z.object({
        paypalOrderId: z.string(),
        paypalPayerId: z.string(),
        paypalPaymentSource: z.string(),
        status: z.literal("PAID"),
      }),
      z.object({ status: z.literal("CANCELLED") }),
    ])
    .safeParse({
      paypalOrderId: body.get("paypalOrderId"),
      paypalPayerId: body.get("paypalPayerId"),
      paypalPaymentSource: body.get("paypalPaymentSource"),
      status: body.get("status"),
    });

  if (!orderUpdateInfo.success) {
    throw json({ errors: orderUpdateInfo.error.format() }, { status: 400 });
  }

  const order = await updateOrderById(params.orderId, orderUpdateInfo.data);

  return json({ order });
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function OrderDetailsPage() {
  const updateData = useRef<{
    paypalOrderId: string;
    paypalPaymentSource: string;
  }>();
  const { order } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
  const data = useMatchesData("root");

  const mulchPrepContent = useMulchPrepContent();

  const total = order.pricePerUnit * order.quantity;

  return (
    <PayPalScriptProvider
      options={{
        // @ts-expect-error - we add the global ENV variable in the root.tsx file
        "client-id": data?.ENV.PAYPAL_CLIENT_ID,
        components: "buttons",
        currency: "USD",
        "disable-funding": "credit",
        "enable-funding": "venmo",
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
            <PayPalButtons
              disabled={fetcher.state === "submitting"}
              createOrder={async ({ paymentSource }, actions) => {
                const orderId = await actions.order.create({
                  purchase_units: [
                    {
                      amount: {
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
                          description: `${
                            order.color[0] + order.color.slice(1).toLowerCase()
                          } mulch${
                            order.orderType === "SPREAD"
                              ? " plus mulch spreading service"
                              : " delivered to your house, no spreading service"
                          }`,
                          unit_amount: {
                            value: String(order.pricePerUnit),
                            currency_code: "USD",
                          },
                          quantity: String(order.quantity),
                        },
                      ],
                    },
                  ],
                });

                updateData.current = {
                  paypalPaymentSource: paymentSource,
                  paypalOrderId: orderId,
                };
                return orderId;
              }}
              onApprove={async (data, actions) => {
                const details = await actions.order?.capture();
                if (!updateData.current) {
                  return;
                }
                if (
                  details &&
                  updateData.current &&
                  details.id === updateData.current?.paypalOrderId
                ) {
                  const update: {
                    paypalOrderId: string;
                    paypalPaymentSource: string;
                    status: "PAID";
                    paypalPayerId?: string;
                  } = {
                    ...updateData.current,
                    status: "PAID",
                  };
                  if (details.payer.payer_id) {
                    update.paypalPayerId = details.payer.payer_id;
                  }
                  await fetcher.submit(update, { method: "put" });
                } else {
                  console.log("payment not captured");
                }
              }}
            />
            <hr className="my-4" />
            <div className="mb-4">{mulchPrepContent}</div>
            <Form method="put">
              <input type="hidden" name="status" value="CANCELLED" />
              <button
                type="submit"
                className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
              >
                Cancel Order
              </button>
            </Form>
          </>
        ) : order.status === "CANCELLED" ? (
          <div className="font-bold text-red-500">Order Cancelled</div>
        ) : (
          <>
            <div className="font-bold text-green-500">
              Paid!! Thank you for your business.
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

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <div
      className="relative mb-3 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
      role="alert"
    >
      {caught.status === 404 ? (
        "Order not found."
      ) : caught.status === 400 && caught.data ? (
        <>
          There was an error processing your order:
          {Object.keys(caught.data.errors).map((errorKey) =>
            errorKey === "_errors" ? null : (
              <div key={errorKey}>
                <b>{errorKey}:</b> {caught.data.errors[errorKey]._errors[0]}
              </div>
            )
          )}
        </>
      ) : (
        `An unexpected error occurred: ${caught.status}`
      )}
      <br />
      <br />
      If you believe you paid for this order, please contact us at{" "}
      {CONTACT_EMAIL}
    </div>
  );
}
