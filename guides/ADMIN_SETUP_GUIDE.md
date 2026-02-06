# Admin Setup Guide - Adding New Wards

This guide is for YOU (the platform admin) to set up a new ward on the Crossroads Fundraising platform.

**Overview:** You manage all ward deployments on YOUR Fly.io account. Wards just provide Stripe keys and basic info.

---

## Prerequisites

### One-time Setup (If You Haven't Already)

1. **Install Fly CLI**
   ```bash
   # macOS
   brew install flyctl
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   # Download from: https://fly.io/docs/flyctl/install/
   ```

2. **Login to Fly.io**
   ```bash
   flyctl auth login
   ```

3. **Verify you're logged in**
   ```bash
   flyctl auth whoami
   ```

---

## Adding a New Ward (5-10 minutes)

### Step 1: Get Ward Information

Send the ward the simplified setup guide (`WARD_STRIPE_SETUP.md`) and ask them to provide:

1. **Stripe Information:**
   - `STRIPE_SECRET_KEY` (starts with `sk_test_...` or `sk_live_...`)
   - `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_...` or `pk_live_...`)
   - Mode they're using (Test or Live)

2. **Ward Details:**
   - Ward name (e.g., "Oak Ridge Ward")
   - Contact email
   - Neighborhoods served (comma-separated)
   - Mulch pricing (delivery only, delivery + spreading)
   - Delivery dates (2 dates)
   - Orders open date
   - Currently accepting orders? (yes/no)

3. **Optional:**
   - Custom images (or they can use defaults)

---

### Step 2: Run the Deployment Script

The script handles everything: app creation, volume, secrets, config.

```bash
# From project root
./scripts/deploy-new-ward.sh <ward-name-lowercase>

# Example
./scripts/deploy-new-ward.sh oakridge
```

The script will:
1. ✅ Create Fly.io app (`oakridge-mulch`)
2. ✅ Create 1GB volume in Dallas
3. ✅ Set secrets (prompts you for Stripe keys)
4. ✅ Create ward configuration folder
5. ✅ Copy template `fly.toml`

**You'll need:**
- The ward's Stripe keys (from Step 1)
- Webhook secret can be added later

---

### Step 3: Update Ward Configuration

Edit `wards/<ward-name>/fly.toml` in the `[env]` section:

```toml
[env]
WARD_NAME = "Oak Ridge Ward"
WARD_CONTACT_EMAIL = "oakridge.youth@gmail.com"
WARD_NEIGHBORHOODS = "Northbrook,Southgate,Riverside"
MULCH_PRICE_DELIVERY = "7"
MULCH_PRICE_SPREAD = "8"
MULCH_DELIVERY_DATE_1 = "March 14"
MULCH_DELIVERY_DATE_2 = "March 21"
MULCH_ORDERS_START_DATE = "February 1, 2026"
ACCEPTING_MULCH_ORDERS = "true"

# Use default images or customize
HOME_HERO_IMAGE = "/assets/crossroads/youth_with_mulch_bags.png"
HOME_HERO_IMAGE_ALT = "Youth Prepared to Spread Mulch"
OG_IMAGE = "/assets/crossroads/mulch_wagon.jpg"
ORDER_CONFIRMATION_IMAGE = "/assets/crossroads/youth_jumping.png"
ORDER_CONFIRMATION_IMAGE_ALT = "Youth Jumping for Joy"
ORDER_FORM_IMAGE = "/assets/crossroads/youth_with_completed_mulch.png"
ORDER_FORM_IMAGE_ALT = "Youth with Beautifully Spread Mulch"
```

---

### Step 4: Update GitHub Actions Workflow

Edit `.github/workflows/deploy.yml` to add the new ward to the deployment matrix.

**Line ~141 (build job):**
```yaml
matrix:
  ward: [crossroads, oakridge]  # Add new ward here
```

**Line ~211 (deploy job):**
```yaml
matrix:
  ward: [crossroads, oakridge]  # Add new ward here (same list)
```

---

### Step 5: Deploy Manually (First Time)

```bash
# Deploy from your machine
flyctl deploy --ha=false --config wards/<ward-name>/fly.toml --app <ward-name>-mulch

# Example
flyctl deploy --ha=false --config wards/oakridge/fly.toml --app oakridge-mulch
```

This first deployment:
- Builds the Docker image
- Runs database migrations
- Starts the app

**Check the deployment:**
```bash
# View logs
flyctl logs --app oakridge-mulch

# Check status
flyctl status --app oakridge-mulch

# Open in browser
flyctl open --app oakridge-mulch
```

---

### Step 6: Set Up Stripe Webhook

Now that the app is deployed, configure Stripe to send payment notifications.

1. **Get the webhook URL:**
   ```
   https://<ward-name>-mulch.fly.dev/api/stripe-webhook
   
   Example: https://oakridge-mulch.fly.dev/api/stripe-webhook
   ```

2. **Create webhook in Stripe:**
   - Go to ward's Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Paste webhook URL
   - Select event: `checkout.session.completed`
   - Click "Add endpoint"
   - Copy the **Signing secret** (starts with `whsec_...`)

3. **Add webhook secret to Fly:**
   ```bash
   flyctl secrets set STRIPE_WEBHOOK_SECRET='whsec_...' --app oakridge-mulch
   ```

---

### Step 7: Commit and Enable Auto-Deployment

```bash
# Add new ward files
git add wards/<ward-name>/ .github/workflows/deploy.yml

# Commit
git commit -m "Add <ward-name> ward configuration"

# Push to trigger deployment
git push origin main
```

GitHub Actions will now automatically deploy this ward on every push to `main`.

---

## Testing the New Ward

### 1. Visit the Site

```
https://<ward-name>-mulch.fly.dev
```

### 2. Test Order Flow

Use Stripe test mode:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### 3. Verify Webhook

In Stripe Dashboard → Developers → Webhooks:
- Check "Recent deliveries"
- Should see successful deliveries with `200` status

### 4. Check Fly Logs

```bash
flyctl logs --app oakridge-mulch
```

Look for:
- ✅ "Stripe webhook received"
- ✅ "Payment completed"
- ❌ No errors

---

## Managing Wards

### View All Apps

```bash
flyctl apps list
```

### View App Details

```bash
flyctl status --app <ward-name>-mulch
flyctl volumes list --app <ward-name>-mulch
flyctl secrets list --app <ward-name>-mulch
```

### Update Secrets

```bash
flyctl secrets set SECRET_NAME='value' --app <ward-name>-mulch
```

### View Logs

```bash
# Tail logs in real-time
flyctl logs --app <ward-name>-mulch

# View recent logs
flyctl logs --app <ward-name>-mulch --lines 100
```

### SSH into App

```bash
flyctl ssh console --app <ward-name>-mulch

# Access database
database-cli
```

### Manually Deploy Updates

```bash
flyctl deploy --ha=false --config wards/<ward-name>/fly.toml --app <ward-name>-mulch
```

---

## Cost Management

### View Billing

```bash
flyctl billing show
```

**Typical costs per ward:**
- Shared CPU: ~$2/month
- 1GB volume: ~$0.15/month
- Bandwidth: Usually free tier
- **Total: ~$2-5/month per ward**

### Billing Wards

You can:
1. Build hosting cost into fundraiser setup fee
2. Bill quarterly (e.g., $20/year per ward)
3. Pass through Fly.io charges directly

---

## Troubleshooting

### App Won't Start

```bash
# Check logs
flyctl logs --app <ward-name>-mulch

# Common issues:
# - Missing secrets (especially STRIPE_WEBHOOK_SECRET can be added later)
# - Database migration failed
# - Volume not mounted
```

### Webhook Failures

1. Check webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe
3. Check Stripe dashboard → Webhooks → Recent deliveries

### Database Issues

```bash
# SSH into app
flyctl ssh console --app <ward-name>-mulch

# Access database
database-cli

# View tables
.tables

# Query data
SELECT * FROM MulchOrder;
```

### Deployment Stuck

```bash
# Cancel deployment
flyctl deploy cancel --app <ward-name>-mulch

# Scale down and back up
flyctl scale count 0 --app <ward-name>-mulch
flyctl scale count 1 --app <ward-name>-mulch
```

---

## Quick Reference

### Common Commands

```bash
# List all ward apps
flyctl apps list | grep mulch

# Deploy all wards (via GitHub Actions)
git push origin main

# Deploy single ward manually
flyctl deploy --ha=false --config wards/<ward>/fly.toml --app <ward>-mulch

# View logs for all wards
for ward in crossroads oakridge; do
  echo "=== $ward ==="
  flyctl logs --app ${ward}-mulch --lines 5
done

# Check status of all wards
flyctl apps list | grep mulch | awk '{print $1}' | xargs -I {} flyctl status --app {}
```

---

## Adding Custom Domains (Optional)

If a ward wants their own domain (e.g., `mulch.oakridgeward.org`):

### 1. Add Certificate in Fly

```bash
flyctl certs add mulch.oakridgeward.org --app oakridge-mulch
```

### 2. Get DNS Instructions

```bash
flyctl certs show mulch.oakridgeward.org --app oakridge-mulch
```

### 3. Ward Updates DNS

Ward goes to their domain provider and adds the DNS records shown.

### 4. Verify Certificate

```bash
# Check certificate status (wait 5-30 min)
flyctl certs check mulch.oakridgeward.org --app oakridge-mulch
```

### 5. Update Webhook URL

Ward updates Stripe webhook to use new domain:
```
https://mulch.oakridgeward.org/api/stripe-webhook
```

---

## Security Notes

1. **Never commit secrets to git** (Stripe keys, tokens, etc.)
2. **Use Fly secrets** for all sensitive data
3. **Each ward has isolated database** (SQLite volume per app)
4. **Webhook signatures verified** (prevents fake payment notifications)
5. **HTTPS enforced** (all traffic redirected to HTTPS)

---

## Support

When wards have issues:

1. **Check logs first:**
   ```bash
   flyctl logs --app <ward>-mulch
   ```

2. **Common ward issues:**
   - Payments not showing: Check webhook in Stripe
   - Site down: Check Fly status
   - Wrong pricing: Edit `fly.toml` [env] section and redeploy

3. **Quick fixes:**
   ```bash
   # Restart app
   flyctl restart --app <ward>-mulch
   
   # Redeploy
   git push origin main  # (if changes committed)
   # OR
   flyctl deploy --ha=false --config wards/<ward>/fly.toml --app <ward>-mulch
   ```

---

## Future Improvements

Consider building:
- Admin dashboard to manage all wards
- Automated billing/invoicing
- Self-service portal for wards to update config
- Multi-tenant architecture (single app, multiple wards)
