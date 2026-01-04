import type { Donation } from "@prisma/client";
import { prisma } from "~/db.server";

export async function createDonation({
  amount,
  paypalOrderId,
  paypalPaymentSource,
  paypalPayerId,
  donorGivenName,
  donorSurname,
  donorEmail,
}: Pick<
  Donation,
  | "amount"
  | "paypalOrderId"
  | "paypalPaymentSource"
  | "paypalPayerId"
  | "donorGivenName"
  | "donorSurname"
  | "donorEmail"
>) {
  return prisma.donation.create({
    data: {
      amount,
      paypalOrderId,
      paypalPaymentSource,
      paypalPayerId,
      donorGivenName,
      donorSurname,
      donorEmail,
    },
  });
}

export async function getDonations() {
  return prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
  });
}
