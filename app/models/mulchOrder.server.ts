import type { User, Address, MulchOrder as Order } from "@prisma/client";

import { prisma } from "~/db.server";

export type { MulchOrder as Order } from "@prisma/client";

export function getOrder({
  id,
  userId,
}: Pick<Order, "id"> & {
  userId: User["id"];
}) {
  return prisma.mulchOrder.findFirst({
    select: {
      id: true,
      quantity: true,
      pricePerUnit: true,
      orderType: true,
      paid: true,
      deliveryAddress: true,
      note: true,
      createdAt: true,
    },
    where: { id, userId },
  });
}

export function getOrderListItems({ userId }: { userId: User["id"] }) {
  return prisma.mulchOrder.findMany({
    where: { userId },
    select: { id: true, quantity: true, pricePerUnit: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createOrder({
  userId,
  deliveryAddressId,
  ...order
}: Pick<Order, "quantity" | "pricePerUnit" | "orderType" | "paid" | "note"> & {
  userId: User["id"];
  deliveryAddressId: Address["id"];
}) {
  return prisma.mulchOrder.create({
    data: {
      ...order,
      user: { connect: { id: userId } },
      deliveryAddress: { connect: { id: deliveryAddressId } },
    },
  });
}

export function deleteOrder({
  id,
  userId,
}: Pick<Order, "id"> & { userId: User["id"] }) {
  return prisma.mulchOrder.deleteMany({
    where: { id, userId },
  });
}
