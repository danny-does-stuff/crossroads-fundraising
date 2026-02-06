# Ward Integration Setup (Stripe + Fly.io + Optional Custom Domain)

This guide is written for a ward (non-technical is OK). If you complete everything here, you’ll be set up to run your fundraiser on the Crossroads Fundraising platform.

- You will do everything through **Stripe** and **Fly.io** websites.
- At the end, you’ll send a few details to the platform admin so they can turn on your ward’s deployment.

## What you’ll need (before you start)

- **A person who can manage Stripe** for your ward fundraiser (usually a clerk, presidency member, or fundraiser lead).
- **A person who can manage Fly.io** billing and app settings (can be the same person as Stripe).
- A ward email address to receive questions (example: `ward.youth.fundraising@gmail.com`).
- Optional (only if you want a custom domain): access to your domain’s DNS settings (wherever you bought your domain).

Time estimate: 20–40 minutes.

---

## Part 1 — Set up Stripe (payments)

### 1. Create / access your Stripe account

1. Go to Stripe: `https://stripe.com`
2. Sign in or create an account.
3. In the Stripe Dashboard, find the **Test mode / Live mode** toggle (usually near the top).

You can start in **Test mode** first, then switch to **Live mode** when ready to accept real payments.

### 2. Get your API keys (two values)

1. In Stripe Dashboard, go to **Developers → API keys**
2. Copy these two values (you’ll use them later in Fly.io secrets):
   - **Publishable key** (starts with `pk_...`)
   - **Secret key** (starts with `sk_...`)

Tip: Make sure you are in the mode you intend to use (Test vs Live) when you copy these.

### 3. Payment notifications (Stripe “webhooks”) — do this later

A **webhook** is Stripe’s way of automatically notifying your website that a payment finished successfully. This fundraiser site needs that notification so it can mark an order/donation as paid.

Don’t set this up yet. You’ll do it **after** your hosting is created (Part 2), because you need a working website address (URL) first.

If you want a **custom domain**, wait to set up this webhook until **after** the custom domain is working (Part 3). That way the webhook URL is correct the first time.

---

## Part 2 — Set up Fly.io (hosting)

Fly.io runs your ward’s fundraiser website and stores your ward’s data (orders/donations) in its own database volume.

### 1. Create / access your Fly.io account

1. Go to: `https://fly.io/app/sign-up`
2. Create an account and verify your email.
3. Add a credit card (Fly requires billing info even for small apps).

Typical cost is modest (fly.io does not charge bills less than $5/month. The original ward has yet to be charged for hosting on fly.io) but it depends on usage.

### 2. Create your Fly app (the site)

1. Go to the Fly dashboard: `https://fly.io/dashboard`
2. Click **Create App**
3. **App name**: choose something like `{ward-name}-mulch`
   - Examples: `oakridge-mulch`, `springhill-mulch`
4. **Region**: choose **Dallas, Texas (DFW)** (this is what the platform is configured for by default)
5. Click **Create App**

Write down your **Fly App Name** — you’ll use it multiple times.

### 3. Create the Fly “Volume” (where the database lives)

1. Go to your app in Fly dashboard (it will look like `https://fly.io/apps/YOUR-FLY-APP-NAME`)
2. In the left sidebar, click **Volumes**
3. Click **Create Volume**
4. Settings:
   - **Name**: `data`
   - **Region**: **Dallas, Texas (DFW)**
   - **Size**: **1 GB**
5. Click **Create**

### 4. Add required secrets in Fly (copy/paste values)

These are private keys. You will enter them into Fly; do not publish them publicly.

1. Go to your Fly app page
2. Click **Secrets** in the left sidebar
3. Click **New Secret** for each item below

Add these **exact secret names**:

| Secret name              | What to paste as the value                    | Where you got it               |
| ------------------------ | --------------------------------------------- | ------------------------------ |
| `SESSION_SECRET`         | A long random string (at least 32 characters) | You generate it (see below)    |
| `STRIPE_SECRET_KEY`      | `sk_...`                                      | Stripe → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_...`                                      | Stripe → Developers → API keys |

Don’t add `STRIPE_WEBHOOK_SECRET` yet. You’ll create the webhook endpoint (and get the `whsec_...` value) in Part 4, then come back and add it as a Fly secret.
`STRIPE_WEBHOOK_SECRET` is just the “password-like” value Stripe gives you for that payment notification setup.

How to generate `SESSION_SECRET` (no technical tools needed):

- Go to this random string generator: `https://www.random.org/strings/?num=10&len=32&digits=on&upperalpha=on&loweralpha=on&unique=off&format=html&rnd=new`
- Select one of the random strings and copy it.
- Paste that as `SESSION_SECRET`

---

## Part 3 — (Optional) Set up a custom domain

If you don’t do this, your site will work fine at:

`https://YOUR-FLY-APP-NAME.fly.dev`

If you _do_ want a custom domain (example: `mulch.yourward.org`), do this after Part 2.

### 1. Decide on the domain name

This can be anything you like! Some ideas:

- `yourwardfundraiser.org`
- `mulch.yourward.org`
- `fundraiser.yourward.org`
- `yourwardyouth.fun`

The possibilities are endless!

### 2. Add the domain to Fly and follow Fly’s DNS instructions

1. Go to your Fly app page
2. Find **Certificates** (or sometimes **Custom Domains / Certificates**) in the sidebar
3. Click **Add certificate** (or **Add hostname**)
4. Enter your hostname (example: `mulch.yourward.org`)
5. Fly will show you **exact DNS records** to create at your domain provider
6. Log into your domain provider (where you bought the domain) and add the DNS records exactly as shown
7. Wait for Fly to verify and issue the certificate (often 5–30 minutes, sometimes longer)

### 3. Important: wait to set up Stripe payment notifications until after this is working

If you’re using a custom domain, don’t create your Stripe webhook endpoint until:

- The custom domain is added in Fly, **and**
- The DNS is in place, **and**
- You can load your site successfully at `https://your-domain-here`

---

## Part 4 — Set up Stripe webhooks (after Fly.io and optional custom domain)

In this step, you’ll give Stripe a URL to call after a payment completes, and you’ll copy a Stripe “signing secret” (a value that starts with `whsec_...`) into Fly as `STRIPE_WEBHOOK_SECRET`.

### 1. Choose the webhook URL you will use

Pick one:

- If you are **not** using a custom domain, use:
  - `https://YOUR-FLY-APP-NAME.fly.dev/api/stripe-webhook`

- If you **are** using a custom domain (and it’s working), use:
  - `https://your-domain-here/api/stripe-webhook`

### 2. Create the webhook endpoint in Stripe

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Paste your chosen webhook URL from above
4. For **Events to send**, select:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. On the endpoint page, find **Signing secret** and copy it:
   - It starts with `whsec_...`

### 3. Add the webhook secret to Fly

1. Go to Fly → your app → **Secrets**
2. Click **New Secret**
3. Name: `STRIPE_WEBHOOK_SECRET`
4. Value: paste the `whsec_...` signing secret you copied from Stripe

---

## Part 5 — Send this info to the platform admin (copy/paste)

When you’ve completed Parts 1–2 (and Part 3 if desired, and Part 4), send the following to the platform admin.

### A) Required technical details

1. **Fly App Name**: `__________________________`  
   (example: `oakridge-mulch`)

2. **Fly region**: `DFW (Dallas)`

3. **Confirm the Fly Volume exists**:
   - Volume name: `data`
   - Region: `DFW`
   - Size: `1 GB`

4. **Deploy token from Fly (so the admin can deploy your app automatically)**:
   - Go to: `https://fly.io/user/personal_access_tokens`
   - Click **Create Token**
   - Name: something like `WARD-mulch-deploy`
   - Expiry: choose a long expiry (or “never” if that’s allowed)
   - Copy the token and send it to the admin

Important: Treat the deploy token like a password. Send it privately (not in a public chat).

### B) Ward fundraiser details (non-technical)

Copy/paste and fill in:

- **Ward Name**:
- **Primary Contact Email**:
- **Neighborhoods served** (comma-separated):
- **Mulch price (delivery only)**:
- **Mulch price (delivery + spreading)**:
- **Delivery date option #1** (example: “March 14”):
- **Delivery date option #2** (example: “March 21”):
- **Orders open date** (example: “February 1, 2026”):
- **Are you accepting orders right now?** (yes/no):
- **Do you want a custom domain?** (no / yes: `your-domain-here`):

---

## After the admin finishes deployment (how you verify it’s working)

### 1. Open your site

- Fly domain: `https://YOUR-FLY-APP-NAME.fly.dev`
- Custom domain (if set up): `https://your-domain-here`

### 2. Make a small test payment

Choose one:

- **Test mode (recommended first)**:
  - Ensure Stripe is in **Test mode**
  - Use Stripe’s test card number: `4242 4242 4242 4242`
  - Use any future expiration date and any 3-digit CVC

- **Live mode**:
  - Ensure Stripe is in **Live mode**
  - Use a real card with a small amount first

### 3. Confirm Stripe received the payment and delivered the webhook

In Stripe Dashboard:

- **Payments**: confirm the payment appears
- **Developers → Webhooks → your endpoint**:
  - Look for a recent delivery with **200** status

---

## Troubleshooting (common issues)

### “Payments happened, but the site didn’t update” (usually webhook-related)

1. In Stripe Dashboard → **Developers → Webhooks → your endpoint**
2. Check **Recent deliveries**
3. If you see failures:
   - Confirm the endpoint URL is exactly:
     - `https://YOUR-FLY-APP-NAME.fly.dev/api/stripe-webhook` (or your custom domain equivalent)
   - Confirm you selected the event:
     - `checkout.session.completed`
   - Confirm Fly secret `STRIPE_WEBHOOK_SECRET` matches the endpoint’s **Signing secret** (whsec\_...)

### “Webhook error: Missing stripe-signature header”

This happens if something other than Stripe is calling the webhook URL.

- Double-check the webhook URL in Stripe is correct.
- Don’t paste the webhook URL into random “uptime check” tools.

### “STRIPE_SECRET_KEY … is required” or similar missing secret errors

Go to Fly → your app → **Secrets** and confirm these exist (spelled exactly):

- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Viewing logs in Fly (if the admin asks for details)

In Fly dashboard:

- Open your app
- Find **Logs** (or **Monitoring → Logs**)
- Look for messages around “Stripe webhook received” and any errors

---

## What you do NOT need to do

- You do **not** need to install anything.
- You do **not** need to run any terminal commands.
- You do **not** need to create Stripe products manually (the app uses Stripe Checkout with on-the-fly line items).
