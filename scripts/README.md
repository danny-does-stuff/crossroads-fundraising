# Admin Scripts

Scripts for managing ward deployments.

## deploy-new-ward.sh

Automated script to set up a new ward on the Crossroads Fundraising platform.

### Prerequisites

- Fly CLI installed and authenticated
- Admin access to the Fly.io account
- Ward's Stripe keys and basic information

### Usage

```bash
./scripts/deploy-new-ward.sh <ward-name>
```

**Example:**
```bash
./scripts/deploy-new-ward.sh oakridge
```

This will:
1. Create Fly.io app (`oakridge-mulch`)
2. Create 1GB volume in Dallas
3. Prompt for and set secrets (Stripe keys, session secret)
4. Create ward configuration folder
5. Copy and configure `fly.toml`
6. Optionally deploy immediately

### What You Need

Before running the script, get from the ward:
- Stripe Secret Key (`sk_test_...` or `sk_live_...`)
- Stripe Publishable Key (`pk_test_...` or `pk_live_...`)
- Ward name, contact email, neighborhoods, pricing, dates

The webhook secret can be added after first deployment.

### After Running

1. Edit `wards/<ward-name>/fly.toml` [env] section with ward details
2. Add ward to `.github/workflows/deploy.yml` matrix (lines ~141 and ~211)
3. Commit and push to enable auto-deployment
4. Set up Stripe webhook and add `STRIPE_WEBHOOK_SECRET`

See [`ADMIN_SETUP_GUIDE.md`](../ADMIN_SETUP_GUIDE.md) for full instructions.
