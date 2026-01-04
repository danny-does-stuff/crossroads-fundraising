import type { Donation } from "@prisma/client";
import { prisma } from "~/db.server";

type DonationPaymentFields =
  | {
      // PayPal payment fields (legacy)
      paypalOrderId: string;
      paypalPaymentSource: string;
      paypalPayerId: string | null;
    }
  | {
      // Stripe payment fields
      stripeSessionId: string;
      stripePaymentIntentId: string | null;
      stripeCustomerId: string | null;
    };

type CreateDonationInput = Pick<
  Donation,
  "amount" | "donorGivenName" | "donorSurname" | "donorEmail"
> &
  DonationPaymentFields;

export async function createDonation(data: CreateDonationInput) {
  return prisma.donation.create({
    data,
  });
}

export async function getDonations() {
  return prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
  });
}
