import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/config/brand";

export function Providers({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return children;
  }

  return <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>;
}
