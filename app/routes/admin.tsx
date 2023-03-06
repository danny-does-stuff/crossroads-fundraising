import { useMemo } from "react";
import { type LoaderArgs } from "@remix-run/node";
import { typedjson, useTypedLoaderData, redirect } from "remix-typedjson";
import { getAllOrders, type CompleteOrder } from "~/models/mulchOrder.server";
import { requireUser } from "~/session.server";
import { useTable, useGlobalFilter, useSortBy } from "react-table";
import type { MulchOrder } from "@prisma/client";

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
      <h2 className="mt-4 mb-2 text-4xl font-semibold">All Orders</h2>
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
