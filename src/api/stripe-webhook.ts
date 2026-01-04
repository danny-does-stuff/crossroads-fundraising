import {
  constructWebhookEvent,
  handleStripeWebhook,
} from "~/services/stripe/webhook.server";

export async function POST({ request }: { request: Request }) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const event = constructWebhookEvent(rawBody, signature);

    await handleStripeWebhook(event);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown webhook error";

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
