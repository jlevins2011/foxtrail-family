import { missingSetup } from "@/lib/env";

export function SetupBanner() {
  const missing = missingSetup();
  if (missing.length === 0) return null;

  return (
    <div className="border-b border-lantern/40 bg-lantern/15 px-5 py-3 text-center text-sm leading-6 text-bark">
      Local preview: {missing.join(" and ")} are not set yet. The public hub
      still works. See the README for Clerk magic-link and Stripe test-mode
      setup.
    </div>
  );
}
