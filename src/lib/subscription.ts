import { clerkClient } from "@clerk/nextjs/server";
import { isDevUnlockEnabled } from "@/lib/env";
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
  source: "clerk" | "dev";
};

export const emptyBilling: FamilyBilling = {
  status: "none",
  plan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  source: "clerk",
};

export function isFamilyUnlocked(billing: FamilyBilling) {
  return (
    billing.status === "active" ||
    billing.status === "trialing" ||
    billing.status === "past_due"
  );
}

export function statusLabel(status: SubscriptionStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trialing";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "incomplete":
      return "Incomplete";
    default:
      return "Not subscribed";
  }
}

function asPlan(value: unknown): PlanId | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

function asStatus(value: unknown): SubscriptionStatus {
  switch (value) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
      return value;
    default:
      return "none";
  }
}

export async function getFamilyBilling(userId: string): Promise<FamilyBilling> {
  if (isDevUnlockEnabled() && userId === "dev-parent") {
    return {
      status: "active",
      plan: "yearly",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      source: "dev",
    };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata;

  return {
    status: asStatus(meta.subscriptionStatus),
    plan: asPlan(meta.plan),
    stripeCustomerId:
      typeof meta.stripeCustomerId === "string" ? meta.stripeCustomerId : null,
    stripeSubscriptionId:
      typeof meta.stripeSubscriptionId === "string"
        ? meta.stripeSubscriptionId
        : null,
    currentPeriodEnd:
      typeof meta.currentPeriodEnd === "string" ? meta.currentPeriodEnd : null,
    source: "clerk",
  };
}

export async function saveFamilyBilling(
  userId: string,
  billing: Omit<FamilyBilling, "source">,
) {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      subscriptionStatus: billing.status,
      plan: billing.plan,
      stripeCustomerId: billing.stripeCustomerId,
      stripeSubscriptionId: billing.stripeSubscriptionId,
      currentPeriodEnd: billing.currentPeriodEnd,
    },
  });
}

export async function findClerkUserId(options: {
  userId?: string | null;
  email?: string | null;
}) {
  if (options.userId) return options.userId;
  if (!options.email) return null;

  const client = await clerkClient();
  const result = await client.users.getUserList({
    emailAddress: [options.email],
    limit: 1,
  });
  return result.data[0]?.id ?? null;
}
