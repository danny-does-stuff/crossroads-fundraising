import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useTable, useGlobalFilter, useSortBy } from "react-table";
import type { MulchOrder } from "@prisma/client";
import { z } from "zod";

import {
  type CompleteOrder,
  getAllOrdersForYear,
} from "~/models/mulchOrder.server";
import { requireUser } from "~/session.server";
import { prisma } from "~/db.server";
import {
  ReferralSource,
  REFERRAL_SOURCE_LABELS,
  Neighborhood,
  CONTACT_EMAIL,
} from "~/constants";

// Server function to load admin data
const loadAdminData = createServerFn()
  .inputValidator((data: { year?: number }) => data)
  .handler(async ({ data }) => {
    const year = data.year || new Date().getFullYear();
    const orders: CompleteOrder[] = await getAllOrdersForYear(year);
    return { orders, year };
  });

// Server function to update order status
const updateOrderStatus = createServerFn()
  .inputValidator((data: unknown) =>
    z.object({ orderId: z.string(), status: z.string() }).parse(data)
  )
  .handler(async ({ data }) => {
    const { orderId, status } = data;

    await prisma.mulchOrder.update({
      where: { id: orderId },
      data: { status },
    });

    const year = new Date().getFullYear();
    const orders = await getAllOrdersForYear(year);

    return { orders, success: true };
  });

// Server function to check admin auth
const checkAdminAuth = createServerFn().handler(async () => {
  const user = await requireUser();
  if (!user || !user.roles.some(({ role }) => role.name === "ADMIN")) {
    throw redirect({ to: "/login" });
  }
  return { user };
});

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  beforeLoad: async () => {
    await checkAdminAuth();
  },
  loaderDeps: ({ search }) => ({
    year: (search as { year?: number }).year,
  }),
  loader: async ({ deps }) => {
    return loadAdminData({ data: { year: deps.year } });
  },
});

function getOrderGrossIncome(order: CompleteOrder) {
  return order.pricePerUnit * order.quantity;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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

function getEmailContent(orderId: string) {
  const orderUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/fundraisers/mulch/orders/${orderId}`;

  return `Hello!

We noticed you started your mulch order but didn't get a chance to finish—there's still time, but orders are closing soon!

Secure your high-quality mulch for $7 a bag, with optional spreading for just $1 more. The delivery and spreading service will be done by our hardworking youth on March 16 or March 23. Your purchase directly supports youth summer camps and service opportunities for our youth!

Click here to complete your order: ${orderUrl}

Thank you for your support! If you have any questions, feel free to reach out at ${CONTACT_EMAIL}.

Have a wonderful day!
Crossroads Ward Youth Program`;
}

function getConfirmationEmailContent(order: CompleteOrder) {
  return `Hello ${order.customer.name},

Thank you for your order! We're excited to deliver your mulch and appreciate your support of our youth fundraiser. Below are the details of your order:

Number of Bags: ${order.quantity}
Mulch Color: ${order.color}
Spreading Service: ${order.orderType === "SPREAD" ? "Yes" : "No"}
Delivery ${order.orderType === "SPREAD" ? "& Spreading " : ""}Date: March DATE

You can find the complete details of your order here: ${
    typeof window !== "undefined"
      ? `${window.location.origin}/fundraisers/mulch/orders/${order.id}`
      : ""
  }

If you have any questions, please reply to this email or contact us at ${CONTACT_EMAIL}.

Thanks again for supporting our youth—your purchase makes a difference!

Crossroads Ward Youth Program`;
}

function AdminPage() {
  const { orders: initialOrders, year } = Route.useLoaderData();
  const [orders, setOrders] = useState(initialOrders);

  const paidOrders = orders.filter(
    (o) => o.status === "PAID" || o.status === "FULFILLED"
  );

  const neighborhoodStats = (() => {
    const statsMap = orders.reduce(
      (acc, order) => {
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
      },
      {} as Record<
        string,
        {
          totalOrders: number;
          totalBags: number;
          totalRevenue: number;
          spreadBags: number;
        }
      >
    );

    return Object.values(Neighborhood).map((neighborhood) => ({
      neighborhood,
      totalOrders: statsMap[neighborhood]?.totalOrders || 0,
      totalBags: statsMap[neighborhood]?.totalBags || 0,
      totalRevenue: statsMap[neighborhood]?.totalRevenue || 0,
      spreadBags: statsMap[neighborhood]?.spreadBags || 0,
    }));
  })();

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
          Orders:
          <span>{paidOrders.length}</span>
          <hr />
          Bags:
          <span>
            {paidOrders.reduce((total, order) => total + order.quantity, 0)}
          </span>
          <hr />
          Bags to Spread:
          <span>
            {paidOrders.reduce(
              (total, order) =>
                total + (order.orderType === "SPREAD" ? order.quantity : 0),
              0
            )}
          </span>
          <hr />
          Avg. Order:
          <span>
            {currencyFormatter.format(
              paidOrders.length
                ? getTotalGrossIncome(paidOrders) / paidOrders.length
                : 0
            )}
          </span>
        </RoundedBorder>
      </div>

      <div className="mb-4 mt-6">
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
      <OrdersTable orders={orders} onOrdersUpdate={setOrders} />
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

function OrdersTable({
  orders,
  onOrdersUpdate,
}: {
  orders: CompleteOrder[];
  onOrdersUpdate: (orders: CompleteOrder[]) => void;
}) {
  const columns = useMemo(
    () => [
      {
        Header: "View",
        accessor: "id",
        Cell: ({ value }: { value: string }) => (
          <Link
            to="/fundraisers/mulch/orders/$orderId"
            params={{ orderId: value }}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            View
          </Link>
        ),
      },
      {
        Header: "Date",
        accessor: "createdAt",
        Cell: ({ value }: { value: Date }) =>
          new Date(value).toLocaleDateString(),
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
        Cell: (props: StatusCellProps) => (
          <StatusCell {...props} onOrdersUpdate={onOrdersUpdate} />
        ),
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
    [onOrdersUpdate]
  );

  const data = useMemo(() => orders, [orders]);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable(
      {
        // @ts-expect-error - there's something weird with the type around "customer"
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
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
              {headerGroup.headers.map((column) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={column.id}
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
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id}>
                {row.cells.map((cell) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      key={cell.column.id}
                      className="border px-4 py-2"
                    >
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

type StatusCellProps = {
  value: string;
  row: { original: CompleteOrder };
  onOrdersUpdate: (orders: CompleteOrder[]) => void;
};

function StatusCell({ value, row, onOrdersUpdate }: StatusCellProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const order = row.original;
  const updateStatus = useServerFn(updateOrderStatus);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsUpdating(true);
    try {
      const result = await updateStatus({
        data: {
          orderId: order.id,
          status: e.target.value,
        },
      });
      if (result.orders) {
        onOrdersUpdate(result.orders);
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={value}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className="rounded bg-transparent px-2 py-1 text-sm hover:bg-gray-50 focus:ring-1 focus:ring-gray-300"
      >
        <option value="PENDING">PENDING</option>
        <option value="PAID">PAID</option>
        <option value="FULFILLED">FULFILLED</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="REFUNDED">REFUNDED</option>
      </select>
      {value === "PENDING" && (
        <a
          href={`mailto:${
            order.customer?.email
          }?subject=Complete Your Mulch Order&body=${encodeURIComponent(
            getEmailContent(order.id)
          )}`}
          title="Send reminder email"
          className="rounded p-1 hover:bg-gray-200"
        >
          ✉️
        </a>
      )}
      {(value === "PAID" || value === "FULFILLED") && (
        <a
          href={`mailto:${
            order.customer?.email
          }?subject=Your Mulch Order Confirmation – Thank You!&body=${encodeURIComponent(
            getConfirmationEmailContent(order)
          )}`}
          title="Send confirmation email"
          className="rounded p-1 hover:bg-gray-200"
        >
          📧
        </a>
      )}
    </div>
  );
}

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
    typeof window !== "undefined"
      ? `${window.location.origin}/fundraisers/mulch/orders/${order.id}`
      : "",
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
