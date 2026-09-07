import { family, saveFamily } from "@/lib/platform/model";
import { atomic } from "@/lib/platform/db";
import type { PlanId } from "@/config/pricing";
export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";
export type FamilyBilling = {
  status: SubscriptionStatus;
  plan: PlanId | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  source: "database";
};
export const emptyBilling: FamilyBilling = {
  status: "none",
  plan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  source: "database",
};
export function isFamilyUnlocked(b: FamilyBilling) {
  return (
    ["active", "trialing"].includes(b.status) &&
    !!b.currentPeriodEnd &&
    Date.parse(b.currentPeriodEnd) > Date.now()
  );
}
export function statusLabel(status: SubscriptionStatus) {
  return status === "none" ? "No paid membership" : status.replaceAll("_", " ");
}
export async function getFamilyBilling(id: string): Promise<FamilyBilling> {
  const b = family(id).billing;
  return b
    ? {
        status: b.status as SubscriptionStatus,
        plan: b.plan as PlanId,
        stripeCustomerId: b.customer,
        stripeSubscriptionId: b.subscription,
        currentPeriodEnd: new Date(b.periodEnd).toISOString(),
        source: "database",
      }
    : emptyBilling;
}
export async function saveFamilyBilling(
  id: string,
  b: Omit<FamilyBilling, "source">,
) {
  atomic(() => {
    const f = family(id);
    f.billing = {
      status: b.status,
      customer: b.stripeCustomerId ?? "",
      subscription: b.stripeSubscriptionId ?? "",
      periodEnd: b.currentPeriodEnd ? Date.parse(b.currentPeriodEnd) : 0,
      plan: b.plan ?? "",
    };
    f.trialUsed = true;
    saveFamily(f);
  });
}
