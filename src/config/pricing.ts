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
    cadence: "per month",
    amountCents: 999,
    envPriceId: "STRIPE_PRICE_MONTHLY",
  },
  {
    id: "yearly",
    label: "Yearly",
    priceLabel: "$79",
    cadence: "per year",
    amountCents: 7900,
    highlight: "Best for a school year",
    envPriceId: "STRIPE_PRICE_YEARLY",
  },
];

export const familySku = {
  productName: "Foxtrail Family",
  statementDescriptor: "FOXTRAIL FAMILY",
  description: "One family subscription unlocking Camp Compass, Keytrail, and Lumen Isles.",
} as const;

export function getPlan(id: string): Plan | undefined {
  return plans.find((plan) => plan.id === id);
}
