import type {
  Customer,
  MulchOrder as Order,
} from "../../prisma/generated/prisma/client";

import { prisma } from "~/db.server";

export type { Order };

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

type OrderPaymentUpdateFields = Partial<
  Pick<
    Order,
    | "status"
    // PayPal fields (legacy)
    | "paypalOrderId"
    | "paypalPayerId"
    | "paypalPaymentSource"
    // Stripe fields
    | "stripeSessionId"
    | "stripePaymentIntentId"
    | "stripeCustomerId"
  >
>;

export function updateOrderById(
  orderId: Order["id"],
  order: OrderPaymentUpdateFields,
): Promise<Order> {
  return prisma.mulchOrder.update({
    where: { id: orderId },
    data: order,
  });
}

/**
 * Updates an order by its Stripe session ID.
 * Useful for webhook handlers that only have the session ID.
 */
export function updateOrderByStripeSession(
  stripeSessionId: string,
  order: Omit<OrderPaymentUpdateFields, "stripeSessionId">,
): Promise<Order> {
  return prisma.mulchOrder.update({
    where: { stripeSessionId },
    data: order,
  });
}

export type CompleteOrder = Order & {
  customer: Customer;
};

export function getAllOrders(): Promise<CompleteOrder[]> {
  return prisma.mulchOrder.findMany({
    orderBy: { createdAt: "asc" },
    include: { customer: true },
  });
}

/**
 * Gets all the orders for a given year.
 * @param year
 */
export function getAllOrdersForYear(year: number): Promise<CompleteOrder[]> {
  return prisma.mulchOrder.findMany({
    where: {
      createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    orderBy: { createdAt: "asc" },
    include: { customer: true },
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
  | "referralSource"
  | "referralSourceDetails"
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
        ...(existingCustomer ?
          { connect: { id: existingCustomer.id } }
        : { create: customer }),
      },
    },
  });
}
