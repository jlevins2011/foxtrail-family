export type PlanId = "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  label: string;
  priceLabel: string;
  cadence: string;
  amountCents: number;
  highlight?: string;
  envPriceId: "STRIPE_PRICE_MONTHLY" | "STRIPE_PRICE_YEARLY";
};

export const plans: Plan[] = [
  {
    id: "monthly",
    label: "Monthly",
    priceLabel: "$9.99",
    cadence: "per month after trial",
    amountCents: 999,
    envPriceId: "STRIPE_PRICE_MONTHLY",
  },
  {
    id: "yearly",
    label: "Yearly",
    priceLabel: "$99.90",
    cadence: "per year after trial",
    amountCents: 9990,
    highlight: "Best for a school year",
    envPriceId: "STRIPE_PRICE_YEARLY",
  },
];

export const familySku = {
  productName: "Foxtrail Family",
  statementDescriptor: "FOXTRAIL FAMILY",
  description:
    "14-day full-family trial, then one subscription unlocking Sumtrail, Camp Compass, Keytrail, and Lumen Isles.",
  trialDays: 14,
  maxChildren: 6,
} as const;

export const monetizationCopy = {
  trialHeadline: "14 days with the full family library",
  trialBody:
    "Demos stay free. Start a 14-day full-family trial, then continue at $9.99 a month or $99.90 a year. The library is not free forever.",
  demoAlwaysFree: "Demos stay free — no account needed.",
  afterTrial: "After the trial, one family key keeps the library open.",
} as const;

export function getPlan(id: string): Plan | undefined {
  return plans.find((plan) => plan.id === id);
}
