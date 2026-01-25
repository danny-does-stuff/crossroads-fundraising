import type Stripe from "stripe";
import { stripe } from "./stripe.server";
import { createDonation } from "~/models/donation.server";
import { updateOrderById } from "~/models/mulchOrder.server";

/**
 * Verifies and constructs a Stripe webhook event from the raw body and signature.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

/**
 * Handles the checkout.session.completed event.
 * This is the source of truth for payment completion.
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const { type, orderId, donorEmail, donorGivenName, donorSurname } =
    session.metadata ?? {};

  if (type === "donation") {
    // Create donation record with Stripe payment details
    await createDonation({
      amount: (session.amount_total ?? 0) / 100,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ?
          session.payment_intent
        : (session.payment_intent?.id ?? null),
      stripeCustomerId:
        typeof session.customer === "string" ?
          session.customer
        : (session.customer?.id ?? null),
      donorEmail: session.customer_email || donorEmail || null,
      donorGivenName:
        session.customer_details?.name?.split(" ")[0] || donorGivenName || null,
      donorSurname:
        session.customer_details?.name?.split(" ").slice(1).join(" ") ||
        donorSurname ||
        null,
    });
  } else if (type === "order" && orderId) {
    // Update existing order with Stripe payment details
    await updateOrderById(orderId, {
      status: "PAID",
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ?
          session.payment_intent
        : (session.payment_intent?.id ?? null),
      stripeCustomerId:
        typeof session.customer === "string" ?
          session.customer
        : (session.customer?.id ?? null),
    });
  } else {
    console.warn("Unknown checkout session type:", type);
  }
}

/**
 * Main webhook event handler. Routes events to appropriate handlers.
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    // Add more event handlers as needed (e.g., refunds, disputes)
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
}
