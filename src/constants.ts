/**
 * Static constants that don't vary by ward.
 *
 * For ward-specific configuration (ward name, neighborhoods, pricing, etc.),
 * see src/config.ts
 */

export enum ReferralSource {
  Friend = "FRIEND",
  Flyer = "FLYER",
  ReturningCustomer = "RETURNING_CUSTOMER",
  Online = "ONLINE",
  Other = "OTHER",
}

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  [ReferralSource.Friend]: "Friend",
  [ReferralSource.Flyer]: "Flyer",
  [ReferralSource.ReturningCustomer]: "Returning Customer",
  [ReferralSource.Online]: "Online/Social Media",
  [ReferralSource.Other]: "Other",
};
