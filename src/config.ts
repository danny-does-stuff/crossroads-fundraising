/**
 * Server-side configuration for ward-specific values.
 * These are read from environment variables at runtime.
 *
 * For client-side access, use the router context (see __root.tsx).
 */

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumberOrDefault(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBooleanOrDefault(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  console.log(`[CONFIG] getEnvBooleanOrDefault('${key}'):`, {
    rawValue: value,
    valueType: typeof value,
    isDefined: value !== undefined,
    lowercase: value?.toLowerCase(),
    willReturn: !value ? defaultValue : value.toLowerCase() === "true",
  });
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

/**
 * Ward-specific configuration loaded from environment variables.
 */
console.log('[CONFIG] Initializing wardConfig, process.env.ACCEPTING_MULCH_ORDERS:', process.env.ACCEPTING_MULCH_ORDERS);
console.log('[CONFIG] All MULCH/WARD env vars:', Object.keys(process.env).filter(k => k.includes('MULCH') || k.includes('WARD')));

export const wardConfig = {
  /** Ward display name (e.g., "Crossroads Ward") */
  name: getEnvOrDefault("WARD_NAME", "Crossroads Ward"),

  /** Contact email for inquiries */
  contactEmail: getEnvOrDefault(
    "WARD_CONTACT_EMAIL",
    "cr.youth.fundraising@gmail.com"
  ),

  /** Comma-separated list of neighborhoods served */
  neighborhoods: getEnvOrDefault(
    "WARD_NEIGHBORHOODS",
    "Arrowbrooke,Del Webb,Glenbrooke,Sandbrock Ranch,Savannah,Union Park,Winn Ridge"
  )
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean),

  /** Price per bag for delivery only */
  mulchPriceDelivery: getEnvNumberOrDefault("MULCH_PRICE_DELIVERY", 7),

  /** Price per bag with spreading service */
  mulchPriceSpread: getEnvNumberOrDefault("MULCH_PRICE_SPREAD", 8),

  /** First delivery date (e.g., "March 14") */
  deliveryDate1: getEnvOrDefault("MULCH_DELIVERY_DATE_1", "March 14"),

  /** Second delivery date (e.g., "March 21") */
  deliveryDate2: getEnvOrDefault("MULCH_DELIVERY_DATE_2", "March 21"),

  /** When mulch orders open (e.g., "February 1, 2026") */
  ordersStartDate: getEnvOrDefault(
    "MULCH_ORDERS_START_DATE",
    "February 1, 2026"
  ),

  /** Whether the site is currently accepting mulch orders */
  acceptingMulchOrders: getEnvBooleanOrDefault("ACCEPTING_MULCH_ORDERS", false),

  /** Image paths - wards can customize or use shared defaults */
  homeHeroImage: getEnvOrDefault(
    "HOME_HERO_IMAGE",
    "/assets/crossroads/youth_with_mulch_bags.png"
  ),
  homeHeroImageAlt: getEnvOrDefault(
    "HOME_HERO_IMAGE_ALT",
    "Youth Prepared to Spread Mulch"
  ),
  ogImage: getEnvOrDefault("OG_IMAGE", "/assets/crossroads/mulch_wagon.jpg"),
  orderConfirmationImage: getEnvOrDefault(
    "ORDER_CONFIRMATION_IMAGE",
    "/assets/crossroads/youth_jumping.png"
  ),
  orderConfirmationImageAlt: getEnvOrDefault(
    "ORDER_CONFIRMATION_IMAGE_ALT",
    "Youth Jumping for Joy"
  ),
  orderFormImage: getEnvOrDefault(
    "ORDER_FORM_IMAGE",
    "/assets/crossroads/youth_with_completed_mulch.png"
  ),
  orderFormImageAlt: getEnvOrDefault(
    "ORDER_FORM_IMAGE_ALT",
    "Youth with Beautifully Spread Mulch"
  ),
} as const;

/**
 * Configuration that needs to be available on the client side.
 * This is passed through the router context.
 */
export function getClientConfig() {
  console.log('[CONFIG] getClientConfig() called, wardConfig.acceptingMulchOrders:', wardConfig.acceptingMulchOrders);
  const clientConfig = {
    wardName: wardConfig.name,
    contactEmail: wardConfig.contactEmail,
    neighborhoods: wardConfig.neighborhoods,
    mulchPriceDelivery: wardConfig.mulchPriceDelivery,
    mulchPriceSpread: wardConfig.mulchPriceSpread,
    deliveryDate1: wardConfig.deliveryDate1,
    deliveryDate2: wardConfig.deliveryDate2,
    ordersStartDate: wardConfig.ordersStartDate,
    acceptingMulchOrders: wardConfig.acceptingMulchOrders,
    homeHeroImage: wardConfig.homeHeroImage,
    homeHeroImageAlt: wardConfig.homeHeroImageAlt,
    ogImage: wardConfig.ogImage,
    orderConfirmationImage: wardConfig.orderConfirmationImage,
    orderConfirmationImageAlt: wardConfig.orderConfirmationImageAlt,
    orderFormImage: wardConfig.orderFormImage,
    orderFormImageAlt: wardConfig.orderFormImageAlt,
  };
  console.log('[CONFIG] getClientConfig() returning, acceptingMulchOrders:', clientConfig.acceptingMulchOrders);
  return clientConfig;
}

export type ClientConfig = ReturnType<typeof getClientConfig>;
