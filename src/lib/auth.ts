import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/env";
export type Viewer = {
  userId: string;
  email: string | null;
  emailVerified: boolean;
  isDevPreview: boolean;
};
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.FOXTRAIL_TEST_MODE === "true"
  ) {
    const { session } = await import("@/lib/platform/security");
    const s = await session("test");
    if (s)
      return {
        userId: s.family,
        email: "Local testing family",
        emailVerified: true,
        isDevPreview: true,
      };
  }
  if (!isClerkConfigured()) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  return {
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    emailVerified: user?.primaryEmailAddress?.verification?.status === "verified",
    isDevPreview: false,
  };
});
export async function requireViewer() {
  const v = await getViewer();
  if (!v) throw new Error("Unauthorized");
  return v;
}
