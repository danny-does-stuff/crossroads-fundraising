# Setup Overview - Crossroads Fundraising Platform

This document explains how new wards get set up on the platform.

## For Ward Members (Non-Technical)

**See: [`WARD_STRIPE_SETUP.md`](./WARD_STRIPE_SETUP.md)**

This simple guide walks you through:
1. Creating a Stripe account
2. Getting your API keys
3. Providing fundraiser details to the admin

**Time required:** 15-20 minutes  
**No technical knowledge needed**

---

## For Platform Admin (You)

**See: [`ADMIN_SETUP_GUIDE.md`](./ADMIN_SETUP_GUIDE.md)**

Complete guide for deploying a new ward, including:
- Prerequisites (Fly CLI setup)
- Using the deployment script
- Configuration and testing
- Ongoing management

**Time required:** 5-10 minutes per ward

### Quick Start (Admin)

```bash
# 1. Get ward info (use WARD_STRIPE_SETUP.md form)
# 2. Run deployment script
./scripts/deploy-new-ward.sh <ward-name>

# 3. Edit ward config
vim wards/<ward-name>/fly.toml  # Update [env] section

# 4. Add to GitHub Actions
vim .github/workflows/deploy.yml  # Add ward to matrix (2 places)

# 5. Deploy
git add wards/<ward-name>/ .github/workflows/deploy.yml
git commit -m "Add <ward-name> ward"
git push origin main

# 6. Set up webhook (after first deploy)
# Ward creates webhook in Stripe, you add the secret:
flyctl secrets set STRIPE_WEBHOOK_SECRET='whsec_...' --app <ward-name>-mulch
```

---

## Architecture Overview

### Option 2: White-Glove Setup (Current Approach)

**How it works:**
- You manage all wards on YOUR Fly.io account
- Each ward = separate Fly.io app with isolated database
- Wards only provide Stripe keys and fundraiser details
- You handle all technical deployment and management

**Benefits:**
- Zero technical burden on wards
- You control all infrastructure
- Easy to support and troubleshoot
- Wards pay you (or you include cost in setup fee)

**Structure:**
```
Your Fly.io Account
├── crossroads-mulch (App 1)
│   ├── Volume: data (1GB)
│   ├── Database: SQLite
│   └── URL: crossroads-mulch.fly.dev
│
├── oakridge-mulch (App 2)
│   ├── Volume: data (1GB)
│   ├── Database: SQLite
│   └── URL: oakridge-mulch.fly.dev
│
└── ... (more wards)
```

### GitHub Actions Auto-Deployment

Every push to `main` automatically deploys all wards in parallel:

```yaml
# .github/workflows/deploy.yml
matrix:
  ward: [crossroads, oakridge, ...]
```

Each ward gets:
- Docker build
- Deployment to their Fly.io app
- Database migrations
- Health checks

---

## Project Structure

```
crossroads-fundraising/
├── wards/
│   ├── crossroads/
│   │   └── fly.toml           # Crossroads ward config
│   ├── oakridge/
│   │   └── fly.toml           # Oak Ridge ward config
│   └── README.md
│
├── scripts/
│   ├── deploy-new-ward.sh     # Automated ward setup
│   └── README.md
│
├── ADMIN_SETUP_GUIDE.md       # For you (admin)
├── WARD_STRIPE_SETUP.md       # For wards (non-technical)
├── SETUP_OVERVIEW.md          # This file
│
├── src/                       # Application code (shared by all wards)
├── prisma/                    # Database schema
├── public/                    # Static assets
└── .github/workflows/         # CI/CD pipelines
```

---

## Cost Breakdown

### Per Ward (Monthly)

- Shared CPU: ~$2
- 1GB Volume: ~$0.15
- Bandwidth: Usually free tier
- **Total: ~$2-5/month**

### Billing Options

1. **Build into setup fee** (one-time charge covers first year)
2. **Annual billing** ($20-50/year per ward)
3. **Pass-through** (forward Fly.io invoices)
4. **Free** (if you're subsidizing)

---

## Security & Isolation

### Per Ward:
- ✅ Separate Fly.io app
- ✅ Isolated SQLite database (volume per app)
- ✅ Own Stripe account (completely independent payments)
- ✅ Own secrets (keys never shared between wards)
- ✅ Own domain (can add custom domains)

### Shared:
- Application code (from GitHub repo)
- Docker images
- Deployment pipeline

---

## Support & Maintenance

### When Wards Have Issues:

**Payment not showing:**
```bash
# Check webhook deliveries in Stripe
# Verify STRIPE_WEBHOOK_SECRET is set
flyctl secrets list --app <ward>-mulch
```

**Site down:**
```bash
# Check status and logs
flyctl status --app <ward>-mulch
flyctl logs --app <ward>-mulch
```

**Need to update config:**
```bash
# Edit fly.toml, commit, push
vim wards/<ward>/fly.toml
git add wards/<ward>/fly.toml
git commit -m "Update <ward> config"
git push origin main  # Auto-deploys
```

---

## Scaling Considerations

### Current Setup Handles:
- 10-20 wards easily
- ~1,000 orders per ward per year
- Typical fundraiser traffic patterns

### If You Grow Beyond This:

Consider refactoring to **multi-tenant architecture**:
- Single app serves all wards
- Shared infrastructure
- Ward-scoped database queries
- Subdomain routing (`oakridge.crossroadsfundraising.com`)
- Lower costs at scale
- More complex codebase

---

## Quick Reference

### Fly CLI Commands

```bash
# List all ward apps
flyctl apps list | grep mulch

# Deploy specific ward
flyctl deploy --ha=false --config wards/<ward>/fly.toml --app <ward>-mulch

# View logs
flyctl logs --app <ward>-mulch

# Check status
flyctl status --app <ward>-mulch

# Update secret
flyctl secrets set SECRET_NAME='value' --app <ward>-mulch

# SSH into app
flyctl ssh console --app <ward>-mulch

# Access database
flyctl ssh console --app <ward>-mulch -C database-cli
```

### GitHub Actions

```bash
# Trigger deployment (all wards)
git push origin main

# View deployment status
# Go to: https://github.com/<user>/<repo>/actions
```

---

## Documentation Index

| Document | Audience | Purpose |
|----------|----------|---------|
| [`WARD_STRIPE_SETUP.md`](./WARD_STRIPE_SETUP.md) | Ward members | Simple Stripe setup + info form |
| [`ADMIN_SETUP_GUIDE.md`](./ADMIN_SETUP_GUIDE.md) | You (admin) | Complete deployment guide |
| [`SETUP_OVERVIEW.md`](./SETUP_OVERVIEW.md) | Both | Architecture & process overview |
| [`wards/README.md`](./wards/README.md) | Admin | Ward configuration reference |
| [`scripts/README.md`](./scripts/README.md) | Admin | Deployment script usage |

---

## Next Steps

### For New Wards:
1. Send them [`WARD_STRIPE_SETUP.md`](./WARD_STRIPE_SETUP.md)
2. Wait for completed form
3. Follow [`ADMIN_SETUP_GUIDE.md`](./ADMIN_SETUP_GUIDE.md)

### For Improving the Platform:
- Add admin dashboard (view all wards, orders, stats)
- Self-service portal for wards to update config
- Automated testing per ward
- Multi-tenant refactor (if scaling to many wards)
- Custom branding per ward
- Email notifications
- Analytics and reporting
