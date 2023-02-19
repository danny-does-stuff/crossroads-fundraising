import { type LoaderArgs } from "@remix-run/node";
import { typedjson, useTypedLoaderData, redirect } from "remix-typedjson";
import { getAllOrders, type CompleteOrder } from "~/models/mulchOrder.server";
import { requireUser } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);

  if (!user || !user.roles.some(({ role }) => role.name === "ADMIN")) {
    return redirect("/login");
  }

  const orders: CompleteOrder[] = await getAllOrders();

  return typedjson({ orders });
}

function getOrderGrossIncome(order: CompleteOrder) {
  return order.pricePerUnit * order.quantity;
}

function getTotalGrossIncome(
  orders: CompleteOrder[],
  onlyPaid: boolean = true
) {
  return orders.reduce(
    (total, order) =>
      total +
      (!onlyPaid || order.status === "PAID" ? getOrderGrossIncome(order) : 0),
    0
  );
}

export default function Admin() {
  const { orders } = useTypedLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <div className="flex">
        <RoundedBorder>
          <h2>${getTotalGrossIncome(orders)}</h2>
          Gross Income
        </RoundedBorder>
        <RoundedBorder>
          Total Orders: {orders.length}
          <hr />
          Total Bags:{" "}
          {orders.reduce((total, order) => total + order.quantity, 0)}
          <hr />
          Avg. Order: ${getTotalGrossIncome(orders, false) / orders.length}
        </RoundedBorder>
      </div>
      <h2>All Orders</h2>
    </div>
  );
}

function RoundedBorder({ children }: { children: React.ReactNode }) {
  return <div className="rounded border border-gray-300 p-4">{children}</div>;
}
