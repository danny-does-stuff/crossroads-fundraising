import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { MulchOrder } from "../../prisma/generated/prisma/client";
import z from "zod";

import {
  type CompleteOrder,
  getAllOrdersForYear,
} from "~/models/mulchOrder.server";
import { requireUser } from "~/session.server";
import { prisma } from "~/db.server";
import { ReferralSource, REFERRAL_SOURCE_LABELS } from "~/constants";
import type { ClientConfig } from "~/config";

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
  .inputValidator(z.object({ orderId: z.string(), status: z.string() }))
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
  validateSearch: (search): { year?: number } => {
    const searchYear = search.year ? Number(search.year) : undefined;
    if (searchYear && isNaN(searchYear)) {
      throw redirect({ to: "/admin", search: { year: undefined } });
    }
    return { year: searchYear };
  },
  loaderDeps: ({ search }) => ({
    year: search.year,
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

function getEmailContent(
  orderId: string,
  config: {
    contactEmail: string;
    wardName: string;
    deliveryDate1: string;
    deliveryDate2: string;
    mulchPriceDelivery: number;
    mulchPriceSpread: number;
  }
) {
  const orderUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/fundraisers/mulch/orders/${orderId}`;

  const spreadPriceDiff = config.mulchPriceSpread - config.mulchPriceDelivery;

  return `Hello!

We noticed you started your mulch order but didn't get a chance to finish—there's still time, but orders are closing soon!

Secure your high-quality mulch for $${config.mulchPriceDelivery} a bag, with optional spreading for just $${spreadPriceDiff} more. The delivery and spreading service will be done by our hardworking youth on ${config.deliveryDate1} or ${config.deliveryDate2}. Your purchase directly supports youth summer camps and service opportunities for our youth!

Click here to complete your order: ${orderUrl}

Thank you for your support! If you have any questions, feel free to reach out at ${config.contactEmail}.

Have a wonderful day!
${config.wardName} Youth Program`;
}

function getConfirmationEmailContent(
  order: CompleteOrder,
  config: { contactEmail: string; wardName: string, deliveryDate1: string, deliveryDate2: string }
) {
  return `Hello ${order.customer.name},

Thank you for your order! We're excited to deliver your mulch and appreciate your support of our youth fundraiser. Below are the details of your order:

Number of Bags: ${order.quantity}
Mulch Color: ${order.color}
Spreading Service: ${order.orderType === "SPREAD" ? "Yes" : "No"}
Delivery ${order.orderType === "SPREAD" ? "& Spreading " : ""}Date: ${config.deliveryDate1} or ${config.deliveryDate2}

You can find the complete details of your order here: ${
    typeof window !== "undefined"
      ? `${window.location.origin}/fundraisers/mulch/orders/${order.id}`
      : ""
  }

If you have any questions, please reply to this email or contact us at ${
    config.contactEmail
  }.

Thanks again for supporting our youth—your purchase makes a difference!

${config.wardName} Youth Program`;
}

function AdminPage() {
  const { orders: initialOrders, year } = Route.useLoaderData();
  const { wardConfig } = Route.useRouteContext();
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

    return wardConfig.neighborhoods.map((neighborhood) => ({
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
      <OrdersTable
        orders={orders}
        onOrdersUpdate={setOrders}
        wardConfig={wardConfig}
      />
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
  wardConfig,
}: {
  orders: CompleteOrder[];
  onOrdersUpdate: (orders: CompleteOrder[]) => void;
  wardConfig: ClientConfig;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<CompleteOrder>[]>(
    () => [
      {
        header: "View",
        accessorKey: "id",
        cell: ({ getValue }) => {
          const id = getValue<string>();
          return (
            <Link
              to="/fundraisers/mulch/orders/$orderId"
              params={{ orderId: id }}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              View
            </Link>
          );
        },
      },
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: ({ getValue }) => {
          const date = getValue<Date>();
          return new Date(date).toLocaleDateString();
        },
      },
      {
        header: "Address",
        accessorKey: "streetAddress",
      },
      {
        header: "Neighborhood",
        accessorKey: "neighborhood",
      },
      {
        header: "Quantity",
        accessorKey: "quantity",
      },
      {
        header: "Spread",
        accessorKey: "orderType",
        cell: ({ getValue }) => {
          const orderType = getValue<MulchOrder["orderType"]>();
          return orderType === "SPREAD" ? "Yes" : "No";
        },
      },
      {
        header: "Color",
        accessorKey: "color",
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue, row }) => (
          <StatusCell
            value={getValue<string>()}
            row={row}
            onOrdersUpdate={onOrdersUpdate}
            wardConfig={wardConfig}
          />
        ),
      },
      {
        header: "Payment",
        cell: ({ row }) => {
          const stripeSessionId = row.original.stripeSessionId;
          const paypalOrderId = row.original.paypalOrderId;

          if (stripeSessionId) {
            return (
              <div className="whitespace-nowrap">
                <div className="font-medium">Stripe</div>
                <div className="text-xs text-gray-700">
                  {stripeSessionId.slice(0, 18)}…
                </div>
              </div>
            );
          }

          if (paypalOrderId) {
            return (
              <div className="whitespace-nowrap">
                <div className="font-medium">PayPal</div>
                <div className="text-xs text-gray-700">
                  {paypalOrderId.slice(0, 18)}…
                </div>
              </div>
            );
          }

          return <span className="text-gray-400">—</span>;
        },
      },
      {
        header: "Total",
        cell: ({ row }) => {
          return currencyFormatter.format(getOrderGrossIncome(row.original));
        },
      },
      {
        header: "Customer",
        accessorKey: "customer",
        cell: ({ getValue }) => {
          const customer = getValue<CompleteOrder["customer"]>();
          return (
            <>
              {customer.email}
              <br />
              {customer.phone}
            </>
          );
        },
      },
      {
        header: "Source",
        cell: ({ row }) => {
          return formatReferralSource(
            row.original.referralSource,
            row.original.referralSourceDetails
          );
        },
      },
      {
        header: "Note",
        accessorKey: "note",
      },
    ],
    [onOrdersUpdate, wardConfig]
  );

  const data = useMemo(() => orders, [orders]);

  // eslint-disable-next-line react-hooks/incompatible-library -- functions returned from react-table are not memoized
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="relative max-h-[95vh] overflow-x-auto rounded shadow-inner">
      <table className="">
        <thead className="sticky top-0 bg-gray-300">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className="border px-4 py-2"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span>
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? ""}
                      </span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type StatusCellProps = {
  value: string;
  row: { original: CompleteOrder };
  onOrdersUpdate: (orders: CompleteOrder[]) => void;
  wardConfig: ClientConfig;
};

function StatusCell({
  value,
  row,
  onOrdersUpdate,
  wardConfig,
}: StatusCellProps) {
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
            getEmailContent(order.id, wardConfig)
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
            getConfirmationEmailContent(order, wardConfig)
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
