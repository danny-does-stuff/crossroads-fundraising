import { useMemo } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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
import {
  ReferralSource,
  REFERRAL_SOURCE_LABELS,
  Neighborhood,
} from "~/constants";
import { Link } from "@remix-run/react";

/**
 * Handles admin actions for updating order statuses.
 * Validates admin permissions and updates order status in the database.
 * Returns refreshed orders data to update the UI.
 *
 * @param {ActionFunctionArgs} args - Contains the request object with form data
 * @returns {Promise<Response>} JSON response with updated orders or error
 * @throws {Response} Redirects to login if user lacks admin permissions
 */
export async function action({ request }: ActionFunctionArgs) {
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

/**
 * Calculates the total gross income from orders.
 * Includes orders with status PAID or FULFILLED.
 *
 * @param {CompleteOrder[]} orders - Array of orders to calculate total from
 * @param {boolean} [onlyPaidOrFulfilled=true] - When true, only includes PAID or FULFILLED orders
 * @returns {number} Total gross income
 */
function getTotalGrossIncome(
  orders: CompleteOrder[],
  onlyPaidOrFulfilled: boolean = true
) {
  return orders.reduce(
    (total, order) =>
      total +
      (!onlyPaidOrFulfilled ||
      order.status === "PAID" ||
      order.status === "FULFILLED"
        ? getOrderGrossIncome(order)
        : 0),
    0
  );
}

/**
 * Formats the referral source for display, using the source details if "Other" was selected
 *
 * @param {string | null} referralSource - The referral source type
 * @param {string | null} referralSourceDetails - Additional details for "Other" source
 * @returns {string} Formatted referral source for display
 */
function formatReferralSource(
  referralSource: string | null,
  referralSourceDetails: string | null
): string {
  if (referralSource === ReferralSource.Other) {
    return (
      referralSourceDetails || REFERRAL_SOURCE_LABELS[ReferralSource.Other]
    );
  }
  return referralSource
    ? REFERRAL_SOURCE_LABELS[referralSource as ReferralSource]
    : "";
}

export default function Admin() {
  const { orders, year } = useTypedLoaderData<typeof loader>();

  const paidOrders = orders.filter(
    (o) => o.status === "PAID" || o.status === "FULFILLED"
  );

  // Calculate neighborhood stats
  const neighborhoodStats = useMemo(() => {
    const statsMap = orders.reduce((acc, order) => {
      if (order.status !== "PAID" && order.status !== "FULFILLED") {
        return acc;
      }

      if (!acc[order.neighborhood]) {
        acc[order.neighborhood] = {
          totalOrders: 0,
          totalBags: 0,
          totalRevenue: 0,
          spreadBags: 0,
        };
      }
      acc[order.neighborhood].totalOrders += 1;
      acc[order.neighborhood].totalBags += order.quantity;
      acc[order.neighborhood].totalRevenue += getOrderGrossIncome(order);
      if (order.orderType === "SPREAD") {
        acc[order.neighborhood].spreadBags += order.quantity;
      }
      return acc;
    }, {} as Record<string, { totalOrders: number; totalBags: number; totalRevenue: number; spreadBags: number }>);

    // Ensure all neighborhoods from constants are included
    return Object.values(Neighborhood).map((neighborhood) => ({
      neighborhood,
      totalOrders: statsMap[neighborhood]?.totalOrders || 0,
      totalBags: statsMap[neighborhood]?.totalBags || 0,
      totalRevenue: statsMap[neighborhood]?.totalRevenue || 0,
      spreadBags: statsMap[neighborhood]?.spreadBags || 0,
    }));
  }, [orders]);

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

      {/* Updated Neighborhood Summary */}
      <div className="mb-4 mt-6">
        <h2 className="mb-2 text-2xl font-semibold">Neighborhood Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {neighborhoodStats.map((stats) => (
            <div
              key={stats.neighborhood}
              className="rounded-md border border-gray-200 p-4 shadow-lg"
            >
              <h3 className="mb-2 text-lg font-semibold">
                {stats.neighborhood}
              </h3>
              <div className="space-y-1 text-sm">
                <div>
                  Orders:{" "}
                  <span className="font-medium">{stats.totalOrders}</span>
                </div>
                <div>
                  Bags: <span className="font-medium">{stats.totalBags}</span> -
                  Spread:{" "}
                  <span className="font-medium">{stats.spreadBags}</span>
                </div>
                <div>
                  Revenue:{" "}
                  <span className="font-medium">
                    {currencyFormatter.format(stats.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-2 mt-4 flex items-center justify-between">
        <h2 className="text-4xl font-semibold">All Orders ({year})</h2>
        <button
          onClick={() => downloadOrdersCsv(orders)}
          className="rounded bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
        >
          Download CSV
        </button>
      </div>
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
        Header: "View",
        accessor: "id",
        Cell: ({ value }: { value: string }) => (
          <Link
            to={`/fundraisers/mulch/orders/${value}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            View
          </Link>
        ),
      },
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
        Header: "Source",
        Cell: ({ row }: { row: { original: CompleteOrder } }) => {
          return formatReferralSource(
            row.original.referralSource,
            row.original.referralSourceDetails
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

/**
 * Downloads order data as a CSV file
 * @param {CompleteOrder[]} orders - Array of orders to include in CSV
 */
function downloadOrdersCsv(orders: CompleteOrder[]) {
  const headers = [
    "Date",
    "Address",
    "Neighborhood",
    "Quantity",
    "Spread",
    "Color",
    "Status",
    "Total",
    "Customer Email",
    "Customer Phone",
    "Source",
    "Note",
    "Link",
  ];

  const rows = orders.map((order) => [
    new Date(order.createdAt).toLocaleDateString(),
    order.streetAddress,
    order.neighborhood,
    order.quantity,
    order.orderType === "SPREAD" ? "Yes" : "No",
    order.color,
    order.status,
    `$${(order.pricePerUnit * order.quantity).toFixed(2)}`,
    order.customer.email,
    order.customer.phone,
    formatReferralSource(order.referralSource, order.referralSourceDetails),
    order.note || "",
    `${window.location.origin}/fundraisers/mulch/orders/${order.id}`,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute(
    "download",
    `mulch-orders-${
      new URL(window.location.href).searchParams.get("year") ||
      new Date().getFullYear()
    }.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
