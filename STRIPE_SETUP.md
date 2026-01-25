# Stripe Setup and Testing Guide

This guide will walk you through setting up Stripe and testing the payment integration.

## 1. Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and sign up for an account
2. Complete the account setup (you can use test mode initially)

## 2. Get Your API Keys

### Test Mode Keys (for development)

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in the top right)
3. Go to **Developers** → **API keys**
4. You'll see:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - click "Reveal test key"

### Production Keys (for live site)

1. Switch to **Live mode** in the dashboard
2. Go to **Developers** → **API keys**
3. Get your live keys (starts with `pk_live_...` and `sk_live_...`)

## 3. Set Up Environment Variables

Create or update your `.env` file in the project root:

```bash
# Stripe API Keys (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (see step 4)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important:** Never commit your `.env` file to git! It should already be in `.gitignore`.

## 4. Set Up Webhooks

Webhooks are how Stripe notifies your app when payments are completed. You need to set this up for payments to work correctly.

### Option A: Using Stripe CLI (Recommended for Local Development)

1. **Install Stripe CLI:**

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI:**

   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

   This will output a webhook signing secret that starts with `whsec_...`. Copy this to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

4. **Keep the CLI running** in a separate terminal while testing

### Option B: Using Stripe Dashboard (For Production/Staging)

1. Go to **Developers** → **Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL:
   - **Local testing:** Use Stripe CLI (Option A above)
   - **Production:** `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed` (required)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`) to your `.env` file

## 5. Router Context

The router context automatically reads `STRIPE_PUBLISHABLE_KEY` from your environment variables. The publishable key is safe to expose to the client (it's used in the browser), so it's included in the router context and made available via `window.ENV` in the browser.

## 6. Test the Integration

### Test Cards

Stripe provides test card numbers you can use:

**Successful Payment:**

- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment:**

- Card: `4000 0000 0000 0002`
- Use same expiry/CVC/ZIP as above

**Requires Authentication (3D Secure):**

- Card: `4000 0025 0000 3155`
- Use same expiry/CVC/ZIP as above

### Testing Steps

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Start Stripe CLI webhook forwarding** (in another terminal):

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

3. **Test Donation Flow:**
   - Navigate to `/fundraisers/mulch/donate`
   - Select an amount or enter a custom amount
   - Click "Donate $X.XX"
   - You should be redirected to Stripe Checkout
   - Use test card `4242 4242 4242 4242`
   - Complete the payment
   - You should be redirected back to the thank-you page
   - Check your database - a donation record should be created with Stripe fields populated

4. **Test Order Payment Flow:**
   - Create a new mulch order at `/fundraisers/mulch/orders/new`
   - Fill out the form and submit
   - You'll be redirected to the order details page
   - Click "Pay Now"
   - Complete payment with test card
   - Check that the order status updates to "PAID" in the database

5. **Verify Webhook Events:**
   - In the Stripe CLI terminal, you should see webhook events being received
   - Check your database to confirm records are created/updated
   - In Stripe Dashboard → **Developers** → **Events**, you can see all webhook events

## 7. Monitor Webhook Events

### In Stripe Dashboard:

- Go to **Developers** → **Events** to see all webhook events
- Click on an event to see details and payload
- Check for any failed deliveries

### In Your App:

- Check your server logs for webhook processing
- Verify database records are created/updated correctly
- The webhook handler logs errors to console

## 8. Common Issues and Solutions

### Issue: "STRIPE_SECRET_KEY environment variable is required"

**Solution:** Make sure your `.env` file has `STRIPE_SECRET_KEY` set

### Issue: Webhook signature verification fails

**Solution:**

- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe CLI or Dashboard
- If using Stripe CLI, restart it and update your `.env` with the new secret

### Issue: Payment completes but database isn't updated

**Solution:**

- Check that webhooks are being received (check Stripe CLI or Dashboard)
- Check server logs for webhook processing errors
- Verify the webhook endpoint is accessible at `/api/stripe-webhook`

### Issue: Redirect URLs are incorrect

**Solution:**

- Check that `returnUrl` in checkout session creation uses the correct domain
- For local testing, use `http://localhost:3000` (or your dev port)
- For production, use your actual domain

## 9. Going to Production

1. **Switch to Live Mode:**
   - Update `.env` with live keys (`pk_live_...` and `sk_live_...`)
   - Set up webhook endpoint in Stripe Dashboard pointing to your production URL
   - Update `STRIPE_WEBHOOK_SECRET` with the production webhook secret

2. **Test in Production:**
   - Use a real card with a small amount first
   - Verify webhooks are received
   - Check database records

3. **Security Checklist:**
   - ✅ Never commit `.env` file
   - ✅ Use environment variables in production (Fly secrets, etc.)
   - ✅ Webhook signature verification is enabled (already implemented)
   - ✅ HTTPS is required for webhooks in production

## 10. Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
