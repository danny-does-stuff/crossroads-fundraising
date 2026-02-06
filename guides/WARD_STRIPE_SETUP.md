# Ward Setup Guide - Stripe Configuration

**Welcome!** This guide will help you set up your ward's fundraiser on the Crossroads Fundraising platform.

**Time required:** 15-20 minutes  
**Technical knowledge:** None needed - we'll guide you through everything

---

## What You'll Do

You'll set up a Stripe account to accept payments, then send us a few details so we can deploy your fundraiser site.

**You do NOT need to:**
- Install any software
- Create hosting accounts
- Manage servers
- Write any code

We handle all the technical parts!

---

## Part 1: Set Up Stripe (Payment Processing)

Stripe is the service that processes credit card payments for your fundraiser.

### Step 1: Create Your Stripe Account

1. Go to: `https://stripe.com`
2. Click "Sign up"
3. Fill in your information:
   - Email address (use ward email if available)
   - Password
   - Your ward/organization name
4. Verify your email (check inbox for Stripe email)

### Step 2: Complete Your Stripe Profile

1. Log in to Stripe Dashboard
2. Fill in required information:
   - Organization details
   - Bank account (where funds will be deposited)
   - Tax information

**Note:** You can start in **Test mode** to try everything first, then switch to **Live mode** when ready for real payments.

### Step 3: Get Your API Keys

These are like "passwords" that allow your website to communicate with Stripe.

1. In Stripe Dashboard, go to **Developers → API keys**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret key** (starts with `sk_test_...` or `sk_live_...`)
3. Click the copy icon to copy each key
4. **Save both keys somewhere safe** - you'll send them to the admin

**Important:** 
- If using Test mode, copy the TEST keys (start with `pk_test_` and `sk_test_`)
- If using Live mode, copy the LIVE keys (start with `pk_live_` and `sk_live_`)
- Keep these keys private - treat them like passwords

---

## Part 2: Send Information to Admin

Copy the form below, fill it out, and email it to the platform admin.

### Ward Information Form

```
================================================
CROSSROADS FUNDRAISING - NEW WARD SETUP
================================================

STRIPE INFORMATION (from Part 1):
----------------------------------
Stripe Mode (Test or Live): _______________

Publishable Key (starts with pk_):
_______________________________________________

Secret Key (starts with sk_):
_______________________________________________

Note: Webhook secret will be provided after initial deployment


WARD DETAILS:
----------------------------------
Ward Name: _________________________________

Contact Email: _____________________________
(Where customers can reach you with questions)

Neighborhoods Served: ______________________
(Comma-separated. Example: Northbrook, Southgate, Riverside)


PRICING:
----------------------------------
Mulch Delivery Only: $_____  (per bag)

Mulch Delivery + Spreading: $_____  (per bag)


SCHEDULE:
----------------------------------
Delivery Date Option 1: ____________________
(Example: March 14, 2026)

Delivery Date Option 2: ____________________
(Example: March 21, 2026)

Orders Open Date: __________________________
(Example: February 1, 2026)

Currently Accepting Orders? (Yes/No): ______


OPTIONAL:
----------------------------------
Custom Domain? (If yes, what domain?):
_______________________________________________
(Example: mulch.yourward.org)

Custom Images? (If yes, I'll provide separately): Yes / No
(Or use default images)

================================================
```

---

## Part 3: After Admin Sets Up Your Site

### You'll Receive:

1. **Your fundraiser URL:**  
   `https://<your-ward>-mulch.fly.dev`

2. **Webhook URL** (for next step)

### Step 4: Set Up Stripe Webhook

This allows Stripe to notify your website when a payment completes.

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Paste the webhook URL the admin sent you:
   ```
   https://<your-ward>-mulch.fly.dev/api/stripe-webhook
   ```
4. For **"Events to send"**, select:
   - ☑ `checkout.session.completed`
5. Click **"Add endpoint"**
6. On the endpoint details page, find **"Signing secret"**
7. Click **"Reveal"** and copy the value (starts with `whsec_...`)
8. **Send this signing secret to the admin**

The admin will add this to your configuration.

---

## Testing Your Site

### If Using Test Mode:

1. Visit your fundraiser URL
2. Try placing an order
3. Use Stripe's test card number:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/28`)
   - CVC: Any 3 digits (e.g., `123`)
4. Complete the order
5. Check your Stripe Dashboard → **Payments** to confirm it appears

### If Using Live Mode:

1. Visit your fundraiser URL
2. Try placing a small test order with a real card
3. Verify the payment appears in Stripe Dashboard
4. Verify the order appears on your site's admin panel

---

## Switching from Test to Live Mode

When you're ready to accept real payments:

1. In Stripe Dashboard, toggle to **Live mode** (top right)
2. Get your **Live** API keys (Developers → API keys)
3. Create a new webhook endpoint with the **Live** mode webhook URL
4. Send the admin:
   - New Live publishable key (`pk_live_...`)
   - New Live secret key (`sk_live_...`)
   - New webhook signing secret (`whsec_...`)

The admin will update your configuration.

---

## Common Questions

**Q: How much does Stripe charge?**  
A: Stripe charges 2.9% + $0.30 per successful card charge. This is automatically deducted from each payment.

**Q: When do I receive the money?**  
A: Stripe typically deposits funds to your bank account within 2 business days.

**Q: Can I see all orders/donations?**  
A: Yes! Your fundraiser site has an admin panel where you can view all orders. You can also see payments in the Stripe Dashboard.

**Q: How much does hosting cost?**  
A: The platform admin manages hosting. They'll let you know if there's a fee (typically $20-50/year or included in a setup fee).

**Q: What if something breaks?**  
A: Contact the platform admin. They manage all the technical aspects.

**Q: Can I customize the site (colors, images, text)?**  
A: Yes! Let the admin know what you'd like to customize. You can provide custom images and adjust most text.

**Q: Do I need to keep test and live modes separate?**  
A: Yes. Test mode uses fake money and cards. Live mode uses real money. Never mix the keys between modes.

---

## Troubleshooting

### "Payment succeeded but order doesn't show on the site"

This usually means the webhook isn't configured correctly.

1. Check Stripe Dashboard → Developers → Webhooks
2. Click on your endpoint
3. Look at **Recent deliveries**
4. If you see errors, contact the admin with a screenshot

### "The Stripe keys don't work"

Make sure:
1. You copied the ENTIRE key (they're long!)
2. You're using keys from the correct mode (Test vs Live)
3. You copied from the "Developers → API keys" page

### "I don't see payments in Stripe"

1. Make sure you're in the correct mode (Test vs Live)
2. Check if the payment actually completed (user may have abandoned checkout)
3. Look under "Payments" in the Stripe Dashboard left sidebar

---

## Contact

If you have any questions or run into issues, contact the platform admin:

**[Admin contact info will be provided]**

---

## Next Steps After Setup

Once your site is live:

1. ✅ Test the order flow thoroughly
2. ✅ Share the URL with ward members
3. ✅ Monitor orders in the admin panel
4. ✅ Check Stripe Dashboard for payments
5. ✅ Promote your fundraiser!

**Good luck with your fundraiser!** 🎉
