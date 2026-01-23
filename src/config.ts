/**
 * Server-side configuration for ward-specific values.
 * These are read from environment variables at runtime.
 *
 * For client-side access, use the router context (see __root.tsx).
 * The root route's beforeLoad passes this config to both server and client.
 */

import { createServerFn } from "@tanstack/react-start";

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string): number {
  const value = getEnv(key);
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(
      `Environment variable ${key} must be a valid number, got: ${value}`
    );
  }
  return parsed;
}

function getEnvBoolean(key: string): boolean {
  const value = getEnv(key);
  const lowercase = value.toLowerCase();
  if (lowercase !== "true" && lowercase !== "false") {
    throw new Error(
      `Environment variable ${key} must be 'true' or 'false', got: ${value}`
    );
  }
  return lowercase === "true";
}

/**
 * Get ward configuration from environment variables.
 * This function should ONLY be called on the server (in server functions or loaders).
 *
 * @returns Ward configuration object
 */
export const getWardConfig = createServerFn().handler(() => {
  return {
    wardName: getEnv("WARD_NAME"),
    contactEmail: getEnv("WARD_CONTACT_EMAIL"),
    neighborhoods: getEnv("WARD_NEIGHBORHOODS")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean),
    mulchPriceDelivery: getEnvNumber("MULCH_PRICE_DELIVERY"),
    mulchPriceSpread: getEnvNumber("MULCH_PRICE_SPREAD"),
    deliveryDate1: getEnv("MULCH_DELIVERY_DATE_1"),
    deliveryDate2: getEnv("MULCH_DELIVERY_DATE_2"),
    ordersStartDate: getEnv("MULCH_ORDERS_START_DATE"),
    acceptingMulchOrders: getEnvBoolean("ACCEPTING_MULCH_ORDERS"),
    homeHeroImage: getEnv("HOME_HERO_IMAGE"),
    homeHeroImageAlt: getEnv("HOME_HERO_IMAGE_ALT"),
    ogImage: getEnv("OG_IMAGE"),
    orderConfirmationImage: getEnv("ORDER_CONFIRMATION_IMAGE"),
    orderConfirmationImageAlt: getEnv("ORDER_CONFIRMATION_IMAGE_ALT"),
    orderFormImage: getEnv("ORDER_FORM_IMAGE"),
    orderFormImageAlt: getEnv("ORDER_FORM_IMAGE_ALT"),
  };
});

export type WardConfig = ReturnType<typeof getWardConfig>;
