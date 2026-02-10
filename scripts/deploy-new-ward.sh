#!/bin/bash

# ============================================================================
# Deploy New Ward Script
# ============================================================================
# This script creates a complete Fly.io setup for a new ward.
# You manage everything on YOUR Fly.io account.
#
# Usage:
#   ./scripts/deploy-new-ward.sh <ward-name>
#
# Example:
#   ./scripts/deploy-new-ward.sh oakridge
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show command and ask for confirmation
run_command() {
    local description="$1"
    local command="$2"
    local auto_confirm="${3:-false}"
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${description}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Command to run:${NC}"
    echo -e "${CYAN}${command}${NC}"
    echo ""
    
    if [ "$auto_confirm" = "false" ]; then
        read -p "$(echo -e ${GREEN}Continue? [Y/n]: ${NC})" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            echo -e "${YELLOW}Skipped.${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}Running...${NC}"
    echo ""
    eval "$command"
    return 0
}

# Function to confirm a step
confirm_step() {
    local message="$1"
    echo ""
    echo -e "${BLUE}${message}${NC}"
    read -p "$(echo -e ${GREEN}Continue? [Y/n]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
    fi
}

# Check if ward name provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Ward name required${NC}"
    echo ""
    echo "Usage: ./scripts/deploy-new-ward.sh <ward-name>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy-new-ward.sh oakridge"
    echo "  ./scripts/deploy-new-ward.sh \"Oak Ridge\""
    echo "  ./scripts/deploy-new-ward.sh \"Spring Hill Ward\""
    echo ""
    echo "Note: Spaces and capitals are OK - will be converted to kebab-case"
    exit 1
fi

WARD_NAME_INPUT="$1"
ORG_DISPLAY_NAME="${WARD_NAME_INPUT}"  # Original name for Fly.io org display name

# Convert ward name to kebab-case for app/folder names
# - Convert to lowercase
# - Replace spaces with hyphens
# - Remove special characters except hyphens
# - Remove duplicate hyphens
WARD_SLUG=$(echo "${WARD_NAME_INPUT}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

APP_NAME="${WARD_SLUG}-mulch"
REGION="dfw"  # Dallas, Texas
ORG_SLUG=""  # Will be set after org creation

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Ward Name Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Display Name:   ${ORG_DISPLAY_NAME}"
echo "  Folder/App:     ${WARD_SLUG}"
echo ""
if [ "${WARD_NAME_INPUT}" != "${WARD_SLUG}" ]; then
    echo -e "${YELLOW}Note: App and folder names use kebab-case for compatibility${NC}"
    confirm_step "Is this correct?"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploy New Ward: ${ORG_DISPLAY_NAME}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}Error: flyctl is not installed${NC}"
    echo "Install it from: https://fly.io/docs/flyctl/install/"
    exit 1
fi

# Check if logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Fly.io${NC}"
    echo "Please run: flyctl auth login"
    exit 1
fi

echo -e "${GREEN}✓${NC} Fly CLI installed and authenticated"
echo ""
echo -e "${BLUE}Logged in as:${NC} $(flyctl auth whoami | grep Email || flyctl auth whoami)"

# Check if ward folder already exists
if [ -d "wards/${WARD_SLUG}" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Warning: wards/${WARD_SLUG} already exists${NC}"
    confirm_step "This may overwrite existing configuration. Continue anyway?"
fi

# Show summary of what will be created
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Setup Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Ward Name:      ${ORG_DISPLAY_NAME}"
echo "  App Name:       ${APP_NAME}"
echo "  Folder:         wards/${WARD_SLUG}/"
echo "  Region:         ${REGION} (Dallas, Texas)"
echo "  Volume Size:    1GB"
echo ""
echo "This script will:"
echo "  1. Create Fly.io organization"
echo "  2. Create Fly.io app in that organization"
echo "  3. Create deploy token for GitHub Actions"
echo "  4. Create 1GB volume for database"
echo "  5. Set required secrets (will prompt for Stripe keys)"
echo "  6. Create ward configuration folder"
echo "  7. Edit ward configuration"
echo "  8. Update GitHub Actions workflow"
echo "  9. Optionally deploy the app"
echo ""
confirm_step "Ready to begin setup?"

# ============================================================================
# Step 1: Create Fly.io Organization
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/8: Create Fly.io Organization${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if organization already exists by listing and parsing
# Use plain text output which is more reliable
EXISTING_ORG_SLUG=$(flyctl orgs list 2>/dev/null | tail -n +3 | awk -v name="${ORG_DISPLAY_NAME}" '$1 == name {print $2}' | head -n 1)

if [ -n "$EXISTING_ORG_SLUG" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Organization '${ORG_DISPLAY_NAME}' already exists${NC}"
    echo -e "${YELLOW}Slug: ${EXISTING_ORG_SLUG}${NC}"
    echo -e "${YELLOW}Using existing organization.${NC}"
    ORG_SLUG="${EXISTING_ORG_SLUG}"
    
    # Remind about billing
    echo ""
    echo -e "${BLUE}Make sure payment info is set up:${NC}"
    echo -e "${CYAN}https://fly.io/dashboard/${ORG_SLUG}/billing${NC}"
    echo ""
    confirm_step "Ready to continue?"
else
    echo ""
    echo -e "${YELLOW}Creating a new Fly.io organization for this ward${NC}"
    echo -e "${YELLOW}Display Name: ${ORG_DISPLAY_NAME}${NC}"
    echo ""
    
    # Create org with JSON output and parse the slug
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Create Fly.io organization '${ORG_DISPLAY_NAME}'${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Command to run:${NC}"
    echo -e "${CYAN}flyctl orgs create \"${ORG_DISPLAY_NAME}\" --json${NC}"
    echo ""
    read -p "$(echo -e ${GREEN}Continue? [Y/n]: ${NC})" -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${GREEN}Running...${NC}"
        echo ""
        
        # Create org with JSON output
        ORG_CREATE_OUTPUT=$(mktemp)
        flyctl orgs create "${ORG_DISPLAY_NAME}" --json > "$ORG_CREATE_OUTPUT" 2>&1
        ORG_EXIT_CODE=$?
        
        if [ $ORG_EXIT_CODE -eq 0 ]; then
            # The output has text lines followed by JSON
            # Extract only the JSON part (starts with '{')
            if command -v jq >/dev/null 2>&1; then
                # Use sed to extract from first { to end, then parse with jq
                ORG_SLUG=$(sed -n '/^{/,$ p' "$ORG_CREATE_OUTPUT" | jq -r '.Slug // empty' 2>/dev/null)
            else
                # Fallback without jq - extract Slug field from the JSON part
                ORG_SLUG=$(sed -n '/^{/,$ p' "$ORG_CREATE_OUTPUT" | grep '"Slug"' | head -n 1 | sed 's/.*"Slug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
            fi
            
            # If JSON parsing failed, try to find the org in the list
            if [ -z "$ORG_SLUG" ]; then
                echo -e "${YELLOW}Could not parse slug from JSON, searching org list...${NC}"
                sleep 2
                ORG_SLUG=$(flyctl orgs list 2>/dev/null | tail -n +3 | awk -v name="${ORG_DISPLAY_NAME}" '$1 == name {print $2}' | head -n 1)
            fi
            
            if [ -n "$ORG_SLUG" ]; then
                echo -e "${GREEN}✓ Organization created${NC}"
                echo -e "${GREEN}  Name: ${ORG_DISPLAY_NAME}${NC}"
                echo -e "${GREEN}  Slug: ${ORG_SLUG}${NC}"
                
                # Prompt to set up billing
                echo ""
                echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${YELLOW}⚠  IMPORTANT: Set Up Payment Information${NC}"
                echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo ""
                echo -e "${BLUE}Before continuing, you need to add payment information${NC}"
                echo -e "${BLUE}to the new organization.${NC}"
                echo ""
                echo -e "${CYAN}1. Open this URL in your browser:${NC}"
                echo -e "${CYAN}   https://fly.io/dashboard/${ORG_SLUG}/billing${NC}"
                echo ""
                echo -e "${CYAN}2. Add a credit card${NC}"
                echo ""
                echo -e "${YELLOW}Note: Fly.io requires payment info even for small apps.${NC}"
                echo -e "${YELLOW}      Typical cost: ~\$2-5/month per ward${NC}"
                echo ""
                read -p "$(echo -e "${GREEN}Press Enter when billing is set up and you're ready to continue...${NC}")"
            else
                echo -e "${RED}Failed to determine organization slug${NC}"
                echo -e "${YELLOW}Output:${NC}"
                cat "$ORG_CREATE_OUTPUT"
                echo ""
                echo -e "${YELLOW}Listing all organizations:${NC}"
                flyctl orgs list
                echo ""
                echo -e "${BLUE}Please enter the organization slug manually:${NC}"
                read -r MANUAL_ORG_SLUG
                if [ -n "$MANUAL_ORG_SLUG" ]; then
                    ORG_SLUG="$MANUAL_ORG_SLUG"
                    echo -e "${GREEN}✓ Using organization: ${ORG_SLUG}${NC}"
                else
                    confirm_step "Continue with personal organization instead?"
                    ORG_SLUG="personal"
                fi
            fi
        else
            echo -e "${RED}Failed to create organization${NC}"
            cat "$ORG_CREATE_OUTPUT"
            confirm_step "Continue with personal organization instead?"
            ORG_SLUG="personal"
        fi
        
        rm -f "$ORG_CREATE_OUTPUT"
    else
        echo -e "${YELLOW}Skipped organization creation${NC}"
        confirm_step "Continue with personal organization instead?"
        ORG_SLUG="personal"
    fi
fi

# ============================================================================
# Step 2: Create Fly.io App
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/8: Create Fly.io App${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if flyctl apps list --org "${ORG_SLUG}" 2>/dev/null | grep -q "^${APP_NAME}"; then
    echo ""
    echo -e "${YELLOW}⚠ App ${APP_NAME} already exists${NC}"
    echo -e "${YELLOW}Skipping app creation.${NC}"
else
    if run_command \
        "Create Fly.io app '${APP_NAME}' in organization '${ORG_SLUG}'" \
        "flyctl apps create \"${APP_NAME}\" --org \"${ORG_SLUG}\""; then
        echo ""
        echo -e "${GREEN}✓ App created: ${APP_NAME}${NC}"
        echo -e "${GREEN}✓ Organization: ${ORG_SLUG}${NC}"
        echo -e "${GREEN}✓ URL: https://${APP_NAME}.fly.dev${NC}"
    else
        echo -e "${RED}Failed to create app${NC}"
        exit 1
    fi
fi

# ============================================================================
# Step 3: Create Deploy Token
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/9: Create Deploy Token for GitHub Actions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This creates a token for automatic deployments via GitHub Actions${NC}"
echo ""

# Convert ward slug to uppercase with underscores for GitHub secret name
GITHUB_SECRET_NAME="FLY_API_TOKEN_$(echo "${WARD_SLUG}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')"

if run_command \
    "Create organization deploy token for '${ORG_SLUG}'" \
    "flyctl tokens create org --name \"GitHub Actions Deploy Token\" --org \"${ORG_SLUG}\""; then
    
    echo ""
    echo -e "${GREEN}✓ Deploy token created${NC}"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠  IMPORTANT: Save This Token to GitHub Secrets${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}The token above needs to be added to GitHub Secrets:${NC}"
    echo ""
    echo -e "${CYAN}1. Copy the token (starts with 'fo1_...')${NC}"
    echo ""
    echo -e "${CYAN}2. Go to GitHub repository settings:${NC}"
    echo -e "   ${CYAN}https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions${NC}"
    echo ""
    echo -e "${CYAN}3. Click 'New repository secret'${NC}"
    echo ""
    echo -e "${CYAN}4. Name: ${GITHUB_SECRET_NAME}${NC}"
    echo ""
    echo -e "${CYAN}5. Value: Paste the token${NC}"
    echo ""
    echo -e "${CYAN}6. Click 'Add secret'${NC}"
    echo ""
    echo -e "${YELLOW}Without this token, automatic deployments will not work!${NC}"
    echo ""
    read -p "$(echo -e "${GREEN}Press Enter when you've added the token to GitHub...${NC}")"
else
    echo -e "${RED}Failed to create deploy token${NC}"
    echo -e "${YELLOW}You can create it manually later with:${NC}"
    echo -e "${CYAN}  flyctl tokens create org --name \"GitHub Actions Deploy Token\" --org \"${ORG_SLUG}\"${NC}"
    echo -e "${YELLOW}Then add it to GitHub secrets as: ${GITHUB_SECRET_NAME}${NC}"
    confirm_step "Continue anyway?"
fi

# ============================================================================
# Step 4: Create Volume
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4/9: Create Database Volume${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if flyctl volumes list --app "${APP_NAME}" 2>/dev/null | grep -q "data"; then
    echo ""
    echo -e "${YELLOW}⚠ Volume 'data' already exists${NC}"
    echo -e "${YELLOW}Skipping volume creation.${NC}"
else
    if run_command \
        "Create 1GB volume named 'data' in ${REGION} for SQLite database" \
        "flyctl volumes create data --app \"${APP_NAME}\" --region \"${REGION}\" --size 1"; then
        echo ""
        echo -e "${GREEN}✓ Volume created: data${NC}"
        echo -e "${GREEN}✓ Size: 1GB${NC}"
        echo -e "${GREEN}✓ Region: ${REGION}${NC}"
    else
        echo -e "${RED}Failed to create volume${NC}"
        exit 1
    fi
fi

# ============================================================================
# Step 5: Set Secrets (Interactive)
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5/9: Set Application Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Secrets are sensitive values stored encrypted in Fly.io${NC}"
echo -e "${YELLOW}You'll need the ward's Stripe API keys for this step${NC}"
echo ""
confirm_step "Ready to set secrets?"

# Check if secrets already exist
EXISTING_SECRETS=$(flyctl secrets list --app "${APP_NAME}" 2>/dev/null || echo "")

# SESSION_SECRET
echo ""
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
echo -e "${BLUE}Secret 1/5: SESSION_SECRET${NC}"
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
if echo "$EXISTING_SECRETS" | grep -q "SESSION_SECRET"; then
    echo -e "${YELLOW}⚠ SESSION_SECRET already exists, skipping${NC}"
else
    SESSION_SECRET=$(openssl rand -hex 32)
    echo ""
    echo -e "${YELLOW}Generated random session secret (64 characters)${NC}"
    echo -e "${CYAN}Value: ${SESSION_SECRET}${NC}"
    echo ""
    if run_command \
        "Set SESSION_SECRET (random 64-char hex for encrypting cookies)" \
        "flyctl secrets set SESSION_SECRET=\"${SESSION_SECRET}\" --app \"${APP_NAME}\""; then
        echo -e "${GREEN}✓ SESSION_SECRET set${NC}"
    fi
fi

# STRIPE_SECRET_KEY
echo ""
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
echo -e "${BLUE}Secret 2/5: STRIPE_SECRET_KEY${NC}"
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
if echo "$EXISTING_SECRETS" | grep -q "STRIPE_SECRET_KEY"; then
    echo -e "${YELLOW}⚠ STRIPE_SECRET_KEY already exists, skipping${NC}"
else
    echo ""
    echo -e "${YELLOW}This key allows the app to process payments${NC}"
    echo -e "${YELLOW}Should start with: sk_test_... (test mode) or sk_live_... (live mode)${NC}"
    echo ""
    echo -e "${BLUE}Enter STRIPE_SECRET_KEY:${NC}"
    read -r STRIPE_SECRET_KEY
    
    # Validate format
    if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
        echo -e "${RED}Warning: Key doesn't start with sk_test_ or sk_live_${NC}"
        echo -e "${RED}Make sure you copied the correct key from Stripe Dashboard${NC}"
        confirm_step "Continue anyway?"
    fi
    
    echo ""
    if run_command \
        "Set STRIPE_SECRET_KEY (for processing payments)" \
        "flyctl secrets set STRIPE_SECRET_KEY=\"${STRIPE_SECRET_KEY}\" --app \"${APP_NAME}\""; then
        echo -e "${GREEN}✓ STRIPE_SECRET_KEY set${NC}"
    fi
fi

# STRIPE_PUBLISHABLE_KEY
echo ""
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
echo -e "${BLUE}Secret 3/5: STRIPE_PUBLISHABLE_KEY${NC}"
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
if echo "$EXISTING_SECRETS" | grep -q "STRIPE_PUBLISHABLE_KEY"; then
    echo -e "${YELLOW}⚠ STRIPE_PUBLISHABLE_KEY already exists, skipping${NC}"
else
    echo ""
    echo -e "${YELLOW}This key is used on the frontend to create checkout sessions${NC}"
    echo -e "${YELLOW}Should start with: pk_test_... (test mode) or pk_live_... (live mode)${NC}"
    echo ""
    echo -e "${BLUE}Enter STRIPE_PUBLISHABLE_KEY:${NC}"
    read -r STRIPE_PUBLISHABLE_KEY
    
    # Validate format
    if [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(test|live)_ ]]; then
        echo -e "${RED}Warning: Key doesn't start with pk_test_ or pk_live_${NC}"
        echo -e "${RED}Make sure you copied the correct key from Stripe Dashboard${NC}"
        confirm_step "Continue anyway?"
    fi
    
    # Check if mode matches
    if [[ "$STRIPE_SECRET_KEY" =~ ^sk_test && ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_test ]]; then
        echo -e "${RED}Warning: Mismatched Stripe modes!${NC}"
        echo -e "${RED}Secret key is TEST but Publishable key is not TEST${NC}"
        confirm_step "Continue anyway?"
    fi
    if [[ "$STRIPE_SECRET_KEY" =~ ^sk_live && ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_live ]]; then
        echo -e "${RED}Warning: Mismatched Stripe modes!${NC}"
        echo -e "${RED}Secret key is LIVE but Publishable key is not LIVE${NC}"
        confirm_step "Continue anyway?"
    fi
    
    echo ""
    if run_command \
        "Set STRIPE_PUBLISHABLE_KEY (for frontend checkout)" \
        "flyctl secrets set STRIPE_PUBLISHABLE_KEY=\"${STRIPE_PUBLISHABLE_KEY}\" --app \"${APP_NAME}\""; then
        echo -e "${GREEN}✓ STRIPE_PUBLISHABLE_KEY set${NC}"
    fi
fi

# ADMIN_INVITE_CODE (for ward admin signup)
echo ""
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
echo -e "${BLUE}Secret 4/5: ADMIN_INVITE_CODE (Recommended)${NC}"
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
if echo "$EXISTING_SECRETS" | grep -q "ADMIN_INVITE_CODE"; then
    echo -e "${YELLOW}⚠ ADMIN_INVITE_CODE already exists, skipping${NC}"
else
    echo ""
    echo -e "${YELLOW}Ward admins use this code to create their account at:${NC}"
    echo -e "${CYAN}  https://${APP_NAME}.fly.dev/join?code=YOUR_CODE${NC}"
    echo ""
    echo -e "${YELLOW}Generate a random code (e.g. openssl rand -hex 8) or use a simple phrase${NC}"
    echo ""
    echo -e "${BLUE}Enter ADMIN_INVITE_CODE (or press Enter to skip):${NC}"
    read -r ADMIN_INVITE_CODE
    
    if [ -n "$ADMIN_INVITE_CODE" ]; then
        echo ""
        if run_command \
            "Set ADMIN_INVITE_CODE (for ward admin signup at /join?code=...)" \
            "flyctl secrets set ADMIN_INVITE_CODE=\"${ADMIN_INVITE_CODE}\" --app \"${APP_NAME}\""; then
            echo -e "${GREEN}✓ ADMIN_INVITE_CODE set${NC}"
            echo -e "${YELLOW}Give the ward this URL: https://${APP_NAME}.fly.dev/join?code=${ADMIN_INVITE_CODE}${NC}"
        fi
    else
        echo ""
        echo -e "${YELLOW}⚠ Skipping ADMIN_INVITE_CODE${NC}"
        echo -e "${YELLOW}Ward won't be able to create admin accounts until you set it:${NC}"
        echo -e "${CYAN}  flyctl secrets set ADMIN_INVITE_CODE='your-code' --app ${APP_NAME}${NC}"
    fi
fi

# STRIPE_WEBHOOK_SECRET (can be added later)
echo ""
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
echo -e "${BLUE}Secret 5/5: STRIPE_WEBHOOK_SECRET (Optional)${NC}"
echo -e "${CYAN}─────────────────────────────────────────────${NC}"
if echo "$EXISTING_SECRETS" | grep -q "STRIPE_WEBHOOK_SECRET"; then
    echo -e "${YELLOW}⚠ STRIPE_WEBHOOK_SECRET already exists${NC}"
else
    echo ""
    echo -e "${YELLOW}This secret verifies webhook notifications from Stripe${NC}"
    echo -e "${YELLOW}You'll get this AFTER creating the webhook endpoint in Stripe${NC}"
    echo -e "${YELLOW}(Usually done after first deployment when you have the app URL)${NC}"
    echo ""
    read -p "$(echo -e ${BLUE}Do you have the webhook secret now? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}Enter STRIPE_WEBHOOK_SECRET (starts with whsec_):${NC}"
        read -r STRIPE_WEBHOOK_SECRET
        
        # Validate format
        if [[ ! "$STRIPE_WEBHOOK_SECRET" =~ ^whsec_ ]]; then
            echo -e "${RED}Warning: Key doesn't start with whsec_${NC}"
            confirm_step "Continue anyway?"
        fi
        
        echo ""
        if run_command \
            "Set STRIPE_WEBHOOK_SECRET (for verifying webhook notifications)" \
            "flyctl secrets set STRIPE_WEBHOOK_SECRET=\"${STRIPE_WEBHOOK_SECRET}\" --app \"${APP_NAME}\""; then
            echo -e "${GREEN}✓ STRIPE_WEBHOOK_SECRET set${NC}"
        fi
    else
        echo ""
        echo -e "${YELLOW}⚠ Skipping STRIPE_WEBHOOK_SECRET${NC}"
        echo -e "${YELLOW}Remember to set it after deployment:${NC}"
        echo -e "${CYAN}  flyctl secrets set STRIPE_WEBHOOK_SECRET='whsec_...' --app ${APP_NAME}${NC}"
    fi
fi

# ============================================================================
# Step 6: Create Ward Configuration
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 6/9: Create Ward Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This creates a configuration folder at wards/${WARD_SLUG}/${NC}"
echo ""

# Check if template exists
if [ ! -f "wards/crossroads/fly.toml" ]; then
    echo -e "${RED}Error: Template not found at wards/crossroads/fly.toml${NC}"
    exit 1
fi

# Create ward folder
if run_command \
    "Create ward configuration folder" \
    "mkdir -p \"wards/${WARD_SLUG}\""; then
    echo -e "${GREEN}✓ Created wards/${WARD_SLUG}/${NC}"
fi

# Copy template
echo ""
if run_command \
    "Copy fly.toml template from crossroads ward" \
    "cp \"wards/crossroads/fly.toml\" \"wards/${WARD_SLUG}/fly.toml\""; then
    echo -e "${GREEN}✓ Copied template${NC}"
fi

# Update app name in fly.toml
echo ""
echo -e "${YELLOW}Updating app name in fly.toml...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    SED_CMD="sed -i '' \"s/^app = .*/app = \\\"${APP_NAME}\\\"/\" \"wards/${WARD_SLUG}/fly.toml\""
else
    # Linux
    SED_CMD="sed -i \"s/^app = .*/app = \\\"${APP_NAME}\\\"/\" \"wards/${WARD_SLUG}/fly.toml\""
fi

if run_command \
    "Update app name to '${APP_NAME}' in fly.toml" \
    "$SED_CMD"; then
    echo -e "${GREEN}✓ Updated app name${NC}"
fi

echo ""
echo -e "${GREEN}✓ Configuration created at wards/${WARD_SLUG}/fly.toml${NC}"

# ============================================================================
# Step 7: Edit Ward Information
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 7/9: Edit Ward Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next, you need to edit the ward-specific configuration${NC}"
echo ""
echo -e "${CYAN}File to edit: wards/${WARD_SLUG}/fly.toml${NC}"
echo ""
echo -e "${YELLOW}Update the [env] section with:${NC}"
echo "  • WARD_NAME"
echo "  • WARD_CONTACT_EMAIL"
echo "  • WARD_NEIGHBORHOODS"
echo "  • MULCH_PRICE_DELIVERY"
echo "  • MULCH_PRICE_SPREAD"
echo "  • MULCH_DELIVERY_DATE_1"
echo "  • MULCH_DELIVERY_DATE_2"
echo "  • MULCH_ORDERS_START_DATE"
echo "  • ACCEPTING_MULCH_ORDERS"
echo "  • Image paths (or leave defaults)"
echo ""
echo -e "${CYAN}Command to open in editor:${NC}"
echo -e "${CYAN}  \$EDITOR wards/${WARD_SLUG}/fly.toml${NC}"
echo ""
read -p "$(echo -e ${GREEN}Press Enter when you've finished editing...${NC})"

# ============================================================================
# Step 8: Update GitHub Workflow
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 8/9: Update GitHub Actions Workflow${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}To enable automatic deployments, add '${WARD_SLUG}' to the workflow${NC}"
echo ""
echo -e "${CYAN}File to edit: .github/workflows/deploy.yml${NC}"
echo ""
echo -e "${YELLOW}Add '${WARD_SLUG}' to the matrix array in TWO places:${NC}"
echo ""
echo "  1. Build job (around line 141):"
echo -e "     ${CYAN}ward: [crossroads, ${WARD_SLUG}]${NC}"
echo ""
echo "  2. Deploy job (around line 211):"
echo -e "     ${CYAN}ward: [crossroads, ${WARD_SLUG}]${NC}"
echo ""
echo -e "${YELLOW}Example:${NC}"
echo -e "${CYAN}  strategy:${NC}"
echo -e "${CYAN}    matrix:${NC}"
echo -e "${CYAN}      ward: [crossroads, ${WARD_SLUG}]${NC}"
echo ""
echo -e "${CYAN}Command to open in editor:${NC}"
echo -e "${CYAN}  \$EDITOR .github/workflows/deploy.yml${NC}"
echo ""
read -p "$(echo -e ${GREEN}Press Enter when you've finished editing...${NC})"

# ============================================================================
# Step 9: Deploy App
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 9/9: Deploy Application${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Deploy the application to Fly.io now?${NC}"
echo ""
echo -e "${CYAN}This will:${NC}"
echo "  • Build Docker image"
echo "  • Push to Fly.io registry"
echo "  • Run database migrations"
echo "  • Start the application"
echo ""
echo -e "${YELLOW}Note: This may take 3-5 minutes${NC}"
echo ""
read -p "$(echo -e ${GREEN}Deploy now? [Y/n]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    if run_command \
        "Deploy ${ORG_DISPLAY_NAME} ward to Fly.io" \
        "flyctl deploy --ha=false --config \"wards/${WARD_SLUG}/fly.toml\" --app \"${APP_NAME}\""; then
        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        echo -e "${GREEN}App URL: https://${APP_NAME}.fly.dev${NC}"
    else
        echo ""
        echo -e "${RED}Deployment failed${NC}"
        echo -e "${YELLOW}Check logs with: flyctl logs --app ${APP_NAME}${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}Skipping deployment${NC}"
    echo ""
    echo -e "${CYAN}To deploy later, run:${NC}"
    echo -e "${CYAN}  flyctl deploy --ha=false --config wards/${WARD_SLUG}/fly.toml --app ${APP_NAME}${NC}"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Ward Details:${NC}"
echo "  • Name: ${ORG_DISPLAY_NAME}"
echo "  • Organization: ${ORG_SLUG}"
echo "  • App: ${APP_NAME}"
echo "  • URL: https://${APP_NAME}.fly.dev"
echo "  • Region: ${REGION} (Dallas)"
echo ""
echo -e "${BLUE}What was created:${NC}"
echo "  ✓ Fly.io organization (${ORG_SLUG})"
echo "  ✓ Fly.io app (${APP_NAME})"
echo "  ✓ 1GB volume for database"
echo "  ✓ Application secrets (Stripe keys, session secret)"
echo "  ✓ Ward configuration (wards/${WARD_SLUG}/fly.toml)"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Next Steps (Required)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}1. Verify Configuration${NC}"
echo "   Check that wards/${WARD_SLUG}/fly.toml has correct ward details"
echo ""
echo -e "${CYAN}2. Verify GitHub Secret${NC}"
echo "   Check that GitHub secret '${GITHUB_SECRET_NAME}' is set"
echo "   https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions"
echo ""
echo -e "${CYAN}3. Verify GitHub Workflow${NC}"
echo "   Check that .github/workflows/deploy.yml includes '${WARD_SLUG}' in matrix"
echo ""
echo -e "${CYAN}4. Commit and Push${NC}"
echo "   git add wards/${WARD_SLUG}/ .github/workflows/deploy.yml"
echo "   git commit -m \"Add ${ORG_DISPLAY_NAME} ward\""
echo "   git push origin main"
echo ""
echo -e "${CYAN}4. Set Up Stripe Webhook${NC}"
echo "   a. Go to ward's Stripe Dashboard → Developers → Webhooks"
echo "   b. Click 'Add endpoint'"
echo "   c. URL: https://${APP_NAME}.fly.dev/api/stripe-webhook"
echo "   d. Event: checkout.session.completed"
echo "   e. Copy the signing secret (whsec_...)"
echo "   f. Set the secret:"
echo "      flyctl secrets set STRIPE_WEBHOOK_SECRET='whsec_...' --app ${APP_NAME}"
echo ""
echo -e "${CYAN}6. Give Ward Admin URL (if you set ADMIN_INVITE_CODE)${NC}"
echo "   https://${APP_NAME}.fly.dev/join?code=YOUR_CODE"
echo ""
echo -e "${CYAN}7. Test the Site${NC}"
echo "   Visit: https://${APP_NAME}.fly.dev"
echo "   Try placing a test order (use Stripe test card: 4242 4242 4242 4242)"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Helpful Commands${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "View logs:"
echo "  flyctl logs --app ${APP_NAME}"
echo ""
echo "Check status:"
echo "  flyctl status --app ${APP_NAME}"
echo ""
echo "Open in browser:"
echo "  flyctl open --app ${APP_NAME}"
echo ""
echo "SSH into app:"
echo "  flyctl ssh console --app ${APP_NAME}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Done! Ward setup complete.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
