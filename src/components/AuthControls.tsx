import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/env";

const navLink =
  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-pine hover:bg-parchment/80";

export function AuthControls() {
  if (!isClerkConfigured()) {
    return (
      <Link href="/sign-in" className={navLink}>
        Parent sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Show when="signed-out">
        <Link href="/sign-in" className={navLink}>
          Parent sign in
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/library" className={navLink}>
          Library
        </Link>
        <Link href="/dashboard" className={navLink}>
          Family
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: "h-9 w-9" },
          }}
        />
      </Show>
    </div>
  );
}
