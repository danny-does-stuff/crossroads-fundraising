import type { Customer, MulchOrder as Order } from "@prisma/client";

import { prisma } from "~/db.server";

export type { MulchOrder as Order } from "@prisma/client";

export function getOrder({ id }: Pick<Order, "id">) {
  return prisma.mulchOrder.findFirst({
    select: {
      id: true,
      quantity: true,
      pricePerUnit: true,
      orderType: true,
      streetAddress: true,
      neighborhood: true,
      status: true,
      note: true,
      createdAt: true,
      color: true,
      customer: true,
    },
    where: { id },
  });
}

export function updateOrderById(
  orderId: Order["id"],
  order: Partial<
    Pick<
      Order,
      "status" | "paypalOrderId" | "paypalPayerId" | "paypalPaymentSource"
    >
  >
): Promise<Order> {
  return prisma.mulchOrder.update({
    where: { id: orderId },
    data: order,
  });
}

export function getOrderListItems({
  customerId,
}: {
  customerId: Customer["id"];
}) {
  return prisma.mulchOrder.findMany({
    where: { customerId },
    select: {
      id: true,
      quantity: true,
      pricePerUnit: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createOrder({
  customer,
  ...order
}: Pick<
  Order,
  | "quantity"
  | "pricePerUnit"
  | "orderType"
  | "note"
  | "color"
  | "neighborhood"
  | "streetAddress"
> & {
  customer: Pick<Customer, "name" | "email" | "phone">;
}) {
  // Only connect the order to an existing customer if the customer's name, email, and phone match
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      email: customer.email,
      phone: customer.phone,
      name: customer.name,
    },
    select: { id: true },
  });

  return prisma.mulchOrder.create({
    data: {
      ...order,
      customer: {
        ...(existingCustomer
          ? { connect: { id: existingCustomer.id } }
          : { create: customer }),
      },
    },
  });
}
