# Quick Reference - Ward Deployment

## 🚀 Deploy a New Ward (5 minutes)

### 1. Get Ward Info
Send ward [`WARD_STRIPE_SETUP.md`](./WARD_STRIPE_SETUP.md). Get back:
- Stripe keys (`sk_...` and `pk_...`)
- Ward details (name, email, neighborhoods, pricing, dates)

### 2. Run Script
```bash
./scripts/deploy-new-ward.sh <ward-name>
```

**Prompts you for:**
- Stripe Secret Key
- Stripe Publishable Key
- (Webhook secret can be added later)

**Creates:**
- Fly.io app: `<ward-name>-mulch`
- Volume: `data` (1GB in Dallas)
- Ward config: `wards/<ward-name>/fly.toml`

### 3. Edit Config
```bash
vim wards/<ward-name>/fly.toml
```

Update `[env]` section with ward details.

### 4. Update Workflow
```bash
vim .github/workflows/deploy.yml
```

Add ward to matrix (2 places: lines ~141 and ~211):
```yaml
ward: [crossroads, oakridge, ...]  # Add your ward
```

### 5. Deploy
```bash
git add wards/<ward-name>/ .github/workflows/deploy.yml
git commit -m "Add <ward-name> ward"
git push origin main
```

### 6. Set Webhook
After deployment, ward creates webhook in Stripe:
- URL: `https://<ward-name>-mulch.fly.dev/api/stripe-webhook`
- Event: `checkout.session.completed`

Then you add the secret:
```bash
flyctl secrets set STRIPE_WEBHOOK_SECRET='whsec_...' --app <ward-name>-mulch
```

---

## 🛠️ Common Commands

### View All Wards
```bash
flyctl apps list | grep mulch
```

### Deploy Specific Ward
```bash
# Via GitHub (automatic)
git push origin main

# Manually
flyctl deploy --ha=false --config wards/<ward>/fly.toml --app <ward>-mulch
```

### Check Status
```bash
flyctl status --app <ward>-mulch
```

### View Logs
```bash
flyctl logs --app <ward>-mulch
```

### Update Secrets
```bash
flyctl secrets list --app <ward>-mulch
flyctl secrets set SECRET_NAME='value' --app <ward>-mulch
```

### SSH Into App
```bash
flyctl ssh console --app <ward>-mulch
```

### Access Database
```bash
flyctl ssh console --app <ward>-mulch -C database-cli
```

---

## 🐛 Troubleshooting

### Payment Not Showing
1. Check Stripe webhook deliveries
2. Verify webhook URL is correct
3. Check webhook secret is set:
   ```bash
   flyctl secrets list --app <ward>-mulch | grep WEBHOOK
   ```

### Site Down
```bash
# Check status
flyctl status --app <ward>-mulch

# View logs
flyctl logs --app <ward>-mulch

# Restart app
flyctl restart --app <ward>-mulch
```

### Wrong Config
```bash
# Edit config
vim wards/<ward>/fly.toml

# Commit and push (auto-deploys)
git add wards/<ward>/fly.toml
git commit -m "Update <ward> config"
git push origin main
```

### Missing Secret
```bash
# View current secrets
flyctl secrets list --app <ward>-mulch

# Add missing secret
flyctl secrets set SECRET_NAME='value' --app <ward>-mulch
```

---

## 📋 Ward Config Template

```toml
[env]
WARD_NAME = "Ward Name"
WARD_CONTACT_EMAIL = "email@example.com"
WARD_NEIGHBORHOODS = "Area1,Area2,Area3"
MULCH_PRICE_DELIVERY = "7"
MULCH_PRICE_SPREAD = "8"
MULCH_DELIVERY_DATE_1 = "March 14"
MULCH_DELIVERY_DATE_2 = "March 21"
MULCH_ORDERS_START_DATE = "February 1, 2026"
ACCEPTING_MULCH_ORDERS = "true"

# Images (use defaults or customize)
HOME_HERO_IMAGE = "/assets/crossroads/youth_with_mulch_bags.png"
HOME_HERO_IMAGE_ALT = "Youth Prepared to Spread Mulch"
OG_IMAGE = "/assets/crossroads/mulch_wagon.jpg"
ORDER_CONFIRMATION_IMAGE = "/assets/crossroads/youth_jumping.png"
ORDER_CONFIRMATION_IMAGE_ALT = "Youth Jumping for Joy"
ORDER_FORM_IMAGE = "/assets/crossroads/youth_with_completed_mulch.png"
ORDER_FORM_IMAGE_ALT = "Youth with Beautifully Spread Mulch"
```

---

## 🔐 Required Secrets

Set via `flyctl secrets set` (NOT in fly.toml):

| Secret | Value | When to Set |
|--------|-------|-------------|
| `SESSION_SECRET` | Random 64-char hex | During setup (auto-generated) |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | During setup (from ward) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | During setup (from ward) |
| `ADMIN_INVITE_CODE` | Any string (e.g. from `openssl rand -hex 8`) | During setup - wards use `/join?code=YOUR_CODE` to create admin account |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | After first deployment |

---

## 📊 Cost Per Ward

- Shared CPU: ~$2/month
- 1GB Volume: ~$0.15/month
- Bandwidth: Free tier
- **Total: ~$2-5/month**

**Fly.io only charges if total > $5/month**

---

## 🔗 Helpful Links

- **Your Apps:** https://fly.io/dashboard
- **GitHub Actions:** https://github.com/{user}/{repo}/actions
- **Stripe Dashboard:** https://dashboard.stripe.com

---

## 📱 Ward URLs

Format: `https://<ward-name>-mulch.fly.dev`

Examples:
- https://crossroads-mulch.fly.dev
- https://oakridge-mulch.fly.dev
- https://springhill-mulch.fly.dev

---

## 📚 Full Documentation

For detailed guides:
- **Ward Setup:** [`WARD_STRIPE_SETUP.md`](./WARD_STRIPE_SETUP.md)
- **Admin Guide:** [`ADMIN_SETUP_GUIDE.md`](./ADMIN_SETUP_GUIDE.md)
- **Overview:** [`SETUP_OVERVIEW.md`](./SETUP_OVERVIEW.md)
