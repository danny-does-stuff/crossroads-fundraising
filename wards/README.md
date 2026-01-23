# Ward Configurations

Each ward has its own folder containing a `fly.toml` with their configuration.

## Structure

```
wards/
  crossroads/
    fly.toml    # Fly config + [env] section with ward config
  oakridge/
    fly.toml
  ...
```

## Automated Deployment

Deployments happen automatically via GitHub Actions when code is pushed to `main`.

Each ward in the matrix (`.github/workflows/deploy.yml`) gets deployed in parallel.

---

## Adding a New Ward

### Part 1: Ward Setup (Ward does this once - 15-20 min)

The ward needs to set up their Fly.io infrastructure and send you their deploy token.

#### 1. Create Fly.io Account

- Go to https://fly.io/app/sign-up
- Sign up with email or GitHub
- Verify your email
- Add a credit card (required, but ward only pays for what they use - typically ~$5-10/month)

#### 2. Create Application

**Via Fly.io Dashboard (Recommended):**
- Go to https://fly.io/dashboard
- Click **"Create App"**
- Choose a name: `{ward-name}-mulch` (e.g., `oakridge-mulch`)
- Select region: **Dallas, Texas (DFW)**
- Click **"Create App"**

**Via CLI (Alternative):**
```bash
# Install Fly CLI first: https://fly.io/docs/flyctl/install/
fly apps create {ward-name}-mulch
```

#### 3. Create Database Volume

**Via Fly.io Dashboard (Recommended):**
- Go to your app: `https://fly.io/apps/{ward-name}-mulch`
- Click **"Volumes"** in the left sidebar
- Click **"Create Volume"**
- Name: `data`
- Region: **Dallas, Texas (DFW)**
- Size: **1 GB**
- Click **"Create"**

**Via CLI (Alternative):**
```bash
fly volumes create data --app {ward-name}-mulch --region dfw --size 1
```

#### 4. Set Secrets

**Via Fly.io Dashboard (Recommended):**
- Go to your app: `https://fly.io/apps/{ward-name}-mulch`
- Click **"Secrets"** in the left sidebar
- Click **"New Secret"** and add each of these:

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `SESSION_SECRET` | Random 64-char hex string | Generate at https://www.random.org/strings/ or use: `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | From https://dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | From https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From https://dashboard.stripe.com/webhooks (create endpoint first) |

**Via CLI (Alternative):**
```bash
fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app {ward-name}-mulch
fly secrets set STRIPE_SECRET_KEY="sk_live_..." --app {ward-name}-mulch
fly secrets set STRIPE_PUBLISHABLE_KEY="pk_live_..." --app {ward-name}-mulch
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..." --app {ward-name}-mulch
```

#### 5. Generate Deploy Token

**Via Fly.io Dashboard (Recommended):**
- Go to https://fly.io/user/personal_access_tokens
- Click **"Create Token"**
- Name: `{ward-name}-mulch-deploy`
- Organization: Select your personal organization (or ward's org if created)
- Expiry: **Never** (or set a long expiry like 1 year)
- Click **"Create Token"**
- **Copy the token** (you won't see it again!)

**Via CLI (Alternative):**
```bash
fly tokens create deploy --app {ward-name}-mulch
```

#### 6. Fill Out Ward Information Form

Send the following to the admin:

- **Deploy Token:** (from step 5)
- **Fly App Name:** `{ward-name}-mulch`
- **Ward Name:** "Oak Ridge Ward"
- **Contact Email:** ward.contact@example.com
- **Neighborhoods:** (comma-separated list)
- **Mulch Pricing:**
  - Delivery only: $7
  - With spreading: $8
- **Delivery Dates:**
  - Date 1: "March 14"
  - Date 2: "March 21"
- **Orders Open Date:** "February 1, 2026"
- **Currently Accepting Orders:** true/false
- **Images:** (optional) Upload custom images or use defaults

---

### Part 2: Admin Setup (You do this once per ward - 10-15 min)

Once you receive the ward's information:

#### 1. Create Ward Folder

```bash
cp -r wards/crossroads wards/{ward-name}
```

#### 2. Edit Ward's fly.toml

Edit `wards/{ward-name}/fly.toml`:

- Update line 4: `app = "{ward-fly-app-name}"`
- Update the `[env]` section (lines 21-37) with ward's config:
  ```toml
  [env]
  WARD_NAME = "Oak Ridge Ward"
  WARD_CONTACT_EMAIL = "oakridge@example.com"
  WARD_NEIGHBORHOODS = "Neighborhood1,Neighborhood2,Neighborhood3"
  MULCH_PRICE_DELIVERY = "7"
  MULCH_PRICE_SPREAD = "8"
  MULCH_DELIVERY_DATE_1 = "March 14"
  MULCH_DELIVERY_DATE_2 = "March 21"
  MULCH_ORDERS_START_DATE = "February 1, 2026"
  ACCEPTING_MULCH_ORDERS = "true"
  # Images - customize or use shared defaults
  HOME_HERO_IMAGE = "/assets/crossroads/youth_with_mulch_bags.png"
  HOME_HERO_IMAGE_ALT = "Youth Prepared to Spread Mulch"
  OG_IMAGE = "/assets/crossroads/mulch_wagon.jpg"
  ORDER_CONFIRMATION_IMAGE = "/assets/crossroads/youth_jumping.png"
  ORDER_CONFIRMATION_IMAGE_ALT = "Youth Jumping for Joy"
  ORDER_FORM_IMAGE = "/assets/crossroads/youth_with_completed_mulch.png"
  ORDER_FORM_IMAGE_ALT = "Youth with Beautifully Spread Mulch"
  ```

#### 3. Add GitHub Secret

- Go to: https://github.com/{your-username}/{repo-name}/settings/secrets/actions
- Click **"New repository secret"**
- Name: `FLY_TOKEN_{WARD}` (uppercase ward name, e.g., `FLY_TOKEN_OAKRIDGE`)
- Value: Ward's deploy token (from Part 1, Step 5)
- Click **"Add secret"**

#### 4. Add Ward to Deploy Matrix

Edit `.github/workflows/deploy.yml` (around line 141):

```yaml
matrix:
  # Add new wards here as they onboard
  ward: [crossroads, oakridge]  # Add new ward to this list
```

And again around line 211 (same change).

#### 5. Commit and Push

```bash
git add wards/{ward-name}/ .github/workflows/deploy.yml
git commit -m "Add {ward-name} ward configuration"
git push origin main
```

GitHub Actions will automatically build and deploy the new ward! 🚀

Check the deployment at: https://github.com/{your-username}/{repo-name}/actions

---

## Ward fly.toml Format Reference

```toml
app = "ward-app-name"           # Fly app name
primary_region = "dfw"          # Dallas region
# ... Fly infrastructure config ...

[env]
# Ward identity
WARD_NAME = "Ward Name"
WARD_CONTACT_EMAIL = "email@example.com"
WARD_NEIGHBORHOODS = "Neighborhood1,Neighborhood2,Neighborhood3"

# Pricing (in dollars)
MULCH_PRICE_DELIVERY = "7"     # Delivery only
MULCH_PRICE_SPREAD = "8"       # With spreading

# Schedule
MULCH_DELIVERY_DATE_1 = "March 14"
MULCH_DELIVERY_DATE_2 = "March 21"
MULCH_ORDERS_START_DATE = "February 1, 2026"
ACCEPTING_MULCH_ORDERS = "true"  # "true" or "false"

# Images (paths relative to public/)
HOME_HERO_IMAGE = "/assets/crossroads/youth_with_mulch_bags.png"
HOME_HERO_IMAGE_ALT = "Youth Prepared to Spread Mulch"
OG_IMAGE = "/assets/crossroads/mulch_wagon.jpg"
ORDER_CONFIRMATION_IMAGE = "/assets/crossroads/youth_jumping.png"
ORDER_CONFIRMATION_IMAGE_ALT = "Youth Jumping for Joy"
ORDER_FORM_IMAGE = "/assets/crossroads/youth_with_completed_mulch.png"
ORDER_FORM_IMAGE_ALT = "Youth with Beautifully Spread Mulch"

# ... rest of Fly config (services, ports, health checks) ...
```

---

## Notes

- **Secrets** (Stripe keys, session secret) are set by the ward in Fly dashboard - **NOT** in fly.toml
- **Config** (ward name, pricing, images) goes in the `[env]` section of fly.toml
- **Images** can be shared (use `/assets/crossroads/...`) or custom per ward
- **Database** is isolated per ward (SQLite in Fly volume)
- **Hosting costs** are paid directly by each ward to Fly.io (~$5-10/month)
- **Deployments** happen automatically on every push to `main` branch
