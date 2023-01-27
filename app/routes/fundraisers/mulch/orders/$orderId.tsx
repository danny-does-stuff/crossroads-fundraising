import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteOrder, getOrder } from "~/models/mulchOrder.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  invariant(params.orderId, "orderId not found");

  const order = await getOrder({ userId, id: params.orderId });
  if (!order) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ order });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.orderId, "orderId not found");

  await deleteOrder({ userId, id: params.orderId });

  return redirect("/fundraisers/mulch/orders");
}

export default function OrderDetailsPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h3 className="text-2xl font-bold">
        {data.order.deliveryAddress.neighborhood}
      </h3>
      <p className="py-6">{data.order.createdAt}</p>
      <hr className="my-4" />
      <Form method="post">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Order not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
