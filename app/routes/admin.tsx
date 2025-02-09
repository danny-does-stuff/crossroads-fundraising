import { useMemo } from "react";
import { ActionArgs, LoaderArgs } from "@remix-run/node";
import {
  typedjson,
  useTypedLoaderData,
  redirect,
  useTypedFetcher,
} from "remix-typedjson";
import {
  type CompleteOrder,
  getAllOrdersForYear,
} from "~/models/mulchOrder.server";
import { requireUser } from "~/session.server";
import { useTable, useGlobalFilter, useSortBy } from "react-table";
import type { MulchOrder } from "@prisma/client";
import { prisma } from "~/db.server";

/**
 * Handles admin actions for updating order statuses.
 * Validates admin permissions and updates order status in the database.
 * Returns refreshed orders data to update the UI.
 *
 * @param {ActionFunctionArgs} args - Contains the request object with form data
 * @returns {Promise<Response>} JSON response with updated orders or error
 * @throws {Response} Redirects to login if user lacks admin permissions
 */
export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);
  if (!user?.roles.some(({ role }) => role.name === "ADMIN")) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const orderId = formData.get("orderId") as string;
  const newStatus = formData.get("status") as string;

  if (!orderId || !newStatus) {
    return typedjson({ error: "Missing required fields" }, { status: 400 });
  }

  await prisma.mulchOrder.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  // Get the current year to fetch updated orders
  const year = new Date().getFullYear();
  const orders = await getAllOrdersForYear(year);

  return typedjson({ orders, success: true });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (!user || !user.roles.some(({ role }) => role.name === "ADMIN")) {
    return redirect("/login");
  }

  const year =
    Number(new URL(request.url).searchParams.get("year")) ||
    new Date().getFullYear();

  const orders: CompleteOrder[] = await getAllOrdersForYear(year);

  return typedjson({ orders, year });
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
  const { orders, year } = useTypedLoaderData<typeof loader>();

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
      <h2 className="mb-2 mt-4 text-4xl font-semibold">All Orders ({year})</h2>
      <OrdersTable orders={orders} />
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

// A react component that takes an array of CompleteOrder and renders a table using react-table.
// The columns should be sortable and filterable.
// The table should be paginated.
export function OrdersTable({ orders }: { orders: CompleteOrder[] }) {
  const columns = useMemo(
    () => [
      {
        Header: "Date",
        accessor: "createdAt",
        Cell: ({ value }: { value: Date }) => value.toLocaleDateString(),
      },
      {
        Header: "Address",
        accessor: "streetAddress",
      },
      {
        Header: "Neighborhood",
        accessor: "neighborhood",
      },
      {
        Header: "Quantity",
        accessor: "quantity",
      },
      {
        Header: "Spread",
        accessor: "orderType",
        Cell: ({ value }: { value: MulchOrder["orderType"] }) =>
          value === "SPREAD" ? "Yes" : "No",
      },
      {
        Header: "Color",
        accessor: "color",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: StatusCell,
      },
      {
        Header: "Total",
        Cell: ({ row }: { row: { original: CompleteOrder } }) => {
          const { original } = row;
          return currencyFormatter.format(getOrderGrossIncome(original));
        },
      },
      {
        Header: "Customer",
        accessor: "customer",
        Cell: ({ value }: { value: CompleteOrder["customer"] }) => {
          return (
            <>
              {value.email}
              <br />
              {value.phone}
            </>
          );
        },
      },
      {
        Header: "Note",
        accessor: "note",
      },
    ],
    []
  );

  const data = useMemo(() => orders, [orders]);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable(
      {
        // @ts-ignore - there's something weird with the type around "customer"
        columns,
        data,
      },
      useGlobalFilter,
      useSortBy
    );

  return (
    <div className="relative max-h-[95vh] overflow-x-auto rounded shadow-inner">
      <table {...getTableProps()} className="">
        <thead className="sticky top-0 bg-gray-300">
          {headerGroups.map((headerGroup) => (
            // eslint-disable-next-line react/jsx-key
            <tr {...headerGroup.getHeaderGroupProps()} className="">
              {headerGroup.headers.map((column) => (
                // eslint-disable-next-line react/jsx-key
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className="border px-4 py-2"
                >
                  {column.render("Header")}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              // eslint-disable-next-line react/jsx-key
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    // eslint-disable-next-line react/jsx-key
                    <td {...cell.getCellProps()} className="border px-4 py-2">
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Status cell component for the orders table.
 * Uses Remix Form for proper revalidation of page data after status changes.
 *
 * @param {Object} props
 * @param {string} props.value - The current status of the order
 * @param {Object} props.row - The row data from react-table
 * @param {CompleteOrder} props.row.original - The original order data
 */
function StatusCell({
  value,
  row,
}: {
  value: string;
  row: { original: CompleteOrder };
}) {
  const fetcher = useTypedFetcher();
  const isUpdating = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="orderId" value={row.original.id} />
      <select
        name="status"
        defaultValue={value}
        onChange={(e) => fetcher.submit(e.target.form)}
        disabled={isUpdating}
        className="rounded bg-transparent px-2 py-1 text-sm hover:bg-gray-50 focus:ring-1 focus:ring-gray-300"
      >
        <option value="PENDING">PENDING</option>
        <option value="PAID">PAID</option>
        <option value="FULFILLED">FULFILLED</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="REFUNDED">REFUNDED</option>
      </select>
    </fetcher.Form>
  );
}
