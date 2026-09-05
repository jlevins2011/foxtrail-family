import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured, isDevUnlockEnabled } from "@/lib/env";

export type Viewer = {
  userId: string;
  email: string | null;
  isDevPreview: boolean;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (isDevUnlockEnabled() && !isClerkConfigured()) {
    return {
      userId: "dev-parent",
      email: "dev@localhost",
      isDevPreview: true,
    };
  }

  if (!isClerkConfigured()) {
    return null;
  }

  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return null;
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;

  return { userId, email, isDevPreview: false };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    throw new Error("Unauthorized");
  }
  return viewer;
}
