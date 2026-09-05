import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/config/brand";
import { isClerkConfigured } from "@/lib/env";

export function Providers({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) {
    return children;
  }

  return (
    <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
  );
}
