# Multi-Ward Mulch Fundraising Platform

A scalable web application for LDS ward youth mulch fundraisers. Single codebase supporting multiple wards with isolated deployments.

## 🎯 Overview

This platform enables multiple LDS wards to run their own mulch fundraising campaigns using a shared codebase. Each ward gets:

- **Isolated deployment** with their own Fly.io app
- **Separate database** (SQLite in Fly volume)
- **Custom configuration** (ward name, pricing, neighborhoods, images)
- **Own Stripe account** for payment processing
- **Automated deployments** via GitHub Actions

## 🚀 Quick Start

### For Developers

```bash
# Install dependencies
npm install

# Set up database
npm run setup

# Start development server
npm run dev
```

Visit http://localhost:3000

### For New Wards

See [wards/README.md](./wards/README.md) for detailed onboarding instructions.

**Quick summary:**

1. Ward creates Fly.io account and app
2. Ward sets secrets (Stripe keys, session secret)
3. Ward sends deploy token to admin
4. Admin adds ward config and GitHub secret
5. Push to main → automatic deployment

## 📁 Project Structure

```
wards/
  crossroads/        # Each ward has its own folder
    fly.toml         # Fly config + ward-specific env vars
  oakridge/
    fly.toml
  README.md          # Ward onboarding guide

src/
  config.ts          # Reads ward config from env vars
  routes/            # TanStack React Router routes
  services/          # Stripe, database services
  components/        # Reusable React components

.github/workflows/
  deploy.yml         # Multi-ward CI/CD pipeline
```

## 🛠️ Tech Stack

- **Framework:** [TanStack React Start](https://tanstack.com/start) (React 19)
- **Deployment:** [Fly.io](https://fly.io) with Docker
- **Database:** SQLite with [Prisma](https://prisma.io)
- **Payments:** [Stripe](https://stripe.com)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Testing:** Vitest, Cypress, Testing Library
- **CI/CD:** GitHub Actions

## 🔧 Configuration

Each ward's configuration is stored in `wards/{ward-name}/fly.toml`:

```toml
[env]
WARD_NAME = "Ward Name"
WARD_CONTACT_EMAIL = "email@example.com"
WARD_NEIGHBORHOODS = "Neighborhood1,Neighborhood2,Neighborhood3"
MULCH_PRICE_DELIVERY = "7"
MULCH_PRICE_SPREAD = "8"
MULCH_DELIVERY_DATE_1 = "March 14"
MULCH_DELIVERY_DATE_2 = "March 21"
MULCH_ORDERS_START_DATE = "February 1, 2026"
ACCEPTING_MULCH_ORDERS = "true"
# ... image paths ...
```

Secrets (Stripe keys, session secret) are set via Fly.io dashboard, **not** in fly.toml.

## 🚢 Deployment

**Automatic deployment on push to `main`:**

1. GitHub Actions runs tests (lint, typecheck, vitest, cypress)
2. Builds Docker image for each ward
3. Pushes to ward's Fly.io registry
4. Deploys to ward's Fly.io app

**Manual deployment:**

```bash
# Deploy specific ward
fly deploy --config wards/crossroads/fly.toml
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📚 Development

### Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

### Seed Data

The database seed creates an admin user:

- Email: `rachel@remix.run`
- Password: `racheliscool`

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required for local development:

- `DATABASE_URL` - SQLite connection string
- `SESSION_SECRET` - Random secret for cookies
- `STRIPE_*` - Stripe API keys (test mode for dev)

## 🎨 Customization

### Images

Images are stored in `public/assets/`:

```
public/assets/
  crossroads/           # Ward-specific images
    youth_with_mulch_bags.png
    youth_jumping.png
    mulch_wagon.jpg
  shared/               # Shared images (optional)
```

Wards can use shared images or provide their own by updating image paths in their `fly.toml`.

### Pricing & Schedule

Each ward can customize:

- Mulch pricing (delivery vs. spreading)
- Delivery dates
- Order start date
- Enable/disable ordering

## 🤝 Adding a New Ward

See [wards/README.md](./wards/README.md) for complete instructions.

**Admin checklist:**

1. ✅ Receive ward's deploy token and config
2. ✅ Copy `wards/crossroads` to `wards/{ward-name}`
3. ✅ Edit `wards/{ward-name}/fly.toml`
4. ✅ Add `FLY_API_TOKEN_{WARD}` to GitHub secrets
5. ✅ Add ward to `.github/workflows/deploy.yml` matrix
6. ✅ Push to main

## 🐛 Troubleshooting

### Deployment Issues

- Check GitHub Actions: https://github.com/{user}/{repo}/actions
- View Fly.io logs: `fly logs --app {ward-name}-mulch`
- Verify secrets are set: `fly secrets list --app {ward-name}-mulch`

### Database Issues

```bash
# Connect to production database
fly ssh console --app {ward-name}-mulch -C database-cli

# View database schema
npx prisma studio --schema prisma/schema.prisma
```

### Stripe Integration

- Test mode keys for development
- Production keys set via Fly.io secrets
- Webhook endpoint: `https://{ward-name}-mulch.fly.dev/api/stripe/webhook`

## 📖 Documentation

- [Ward Onboarding Guide](./wards/README.md)
- [TanStack React Start Docs](https://tanstack.com/start/latest)
- [Fly.io Docs](https://fly.io/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)

## 📝 License

MIT

## 🙏 Acknowledgments

Built with ❤️ for LDS ward youth fundraising programs.
