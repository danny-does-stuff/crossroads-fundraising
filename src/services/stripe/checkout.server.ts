import type Stripe from "stripe";
import { stripe } from "./stripe.server";
import { wardConfig } from "~/config";

export interface DonationCheckoutParams {
  amount: number;
  donorEmail?: string | null;
  donorGivenName?: string | null;
  donorSurname?: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface OrderCheckoutParams {
  orderId: string;
  quantity: number;
  pricePerUnit: number;
  color: string;
  orderType: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout session for a donation.
 */
export async function createDonationCheckoutSession({
  amount,
  donorEmail,
  donorGivenName,
  donorSurname,
  successUrl,
  cancelUrl,
}: DonationCheckoutParams): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    // Ensure a Stripe Customer is created so we can persist `stripeCustomerId`
    // even for "guest" checkouts.
    customer_creation: "always",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100), // Convert to cents
          product_data: {
            name: `${wardConfig.wardName} Youth Fundraiser Donation`,
            description: "Thank you for supporting our youth program!",
          },
        },
        quantity: 1,
      },
    ],
    customer_email: donorEmail || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: "donation",
      donorEmail: donorEmail || "",
      donorGivenName: donorGivenName || "",
      donorSurname: donorSurname || "",
    },
  });
}

/**
 * Creates a Stripe Checkout session for a mulch order.
 */
export async function createOrderCheckoutSession({
  orderId,
  quantity,
  pricePerUnit,
  color,
  orderType,
  customerEmail,
  successUrl,
  cancelUrl,
}: OrderCheckoutParams): Promise<Stripe.Checkout.Session> {
  const colorLabel = color[0] + color.slice(1).toLowerCase();
  const serviceDescription =
    orderType === "SPREAD"
      ? "plus mulch spreading service"
      : "delivered to your house, no spreading service";

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    // Ensure a Stripe Customer is created so we can persist `stripeCustomerId`.
    customer_creation: "always",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(pricePerUnit * 100), // Convert to cents
          product_data: {
            name: "Bag o' Mulch",
            description: `${colorLabel} mulch ${serviceDescription}`,
          },
        },
        quantity,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: "order",
      orderId,
    },
  });
}

/**
 * Retrieves a Stripe Checkout session by ID.
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer_details", "payment_intent"],
  });
}

/**
 * Verifies a checkout session payment status.
 * Returns the session if payment is complete, null otherwise.
 */
export async function verifyCheckoutSessionPayment(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  try {
    const session = await getCheckoutSession(sessionId);
    if (session.payment_status === "paid") {
      return session;
    }
    return null;
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    return null;
  }
}
