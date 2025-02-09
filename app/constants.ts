export const CONTACT_EMAIL = "cr.youth.fundraising@gmail.com";

// When false, the mulch order form will not be available.
export const ACCEPTING_MULCH_ORDERS = true;

// The next year that mulch orders will be accepted. Only used if ACCEPTING_MULCH_ORDERS is true.
export const NEXT_MULCH_YEAR = 2026;

// The dates that mulch will be delivered.
export const MULCH_DELIVERY_DATE_1 = "March 15";
export const MULCH_DELIVERY_DATE_2 = "March 22";

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
