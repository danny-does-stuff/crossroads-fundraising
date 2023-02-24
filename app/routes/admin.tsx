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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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

  const paidOrders = orders.filter((o) => o.status === "PAID");

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:[&>*]:flex-1">
        <RoundedBorder>
          <span className="text-5xl sm:text-6xl">
            {currencyFormatter.format(getTotalGrossIncome(orders))}
          </span>
          <h2 className="text-2xl sm:text-4xl">Gross Income</h2>
        </RoundedBorder>
        <RoundedBorder className="text-2xl sm:text-4xl [&>hr]:my-2 [&>span]:float-right">
          Total Orders: <span>{orders.length}</span>
          <hr />
          Total Paid Orders: <span>{paidOrders.length}</span>
          <hr />
          Total Bags:{" "}
          <span>
            {orders.reduce((total, order) => total + order.quantity, 0)}
          </span>
          <hr />
          Avg. Paid Order:{" "}
          <span>
            {currencyFormatter.format(
              paidOrders.length
                ? getTotalGrossIncome(orders) / paidOrders.length
                : 0
            )}
          </span>
        </RoundedBorder>
      </div>
      <h2>All Orders</h2>
    </div>
  );
}

function RoundedBorder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md border-gray-200 p-4 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
