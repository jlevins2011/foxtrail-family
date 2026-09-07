import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";
import Link from "next/link";
export default function Page() {
  return (
    <div className="workspace">
      <h1>Welcome to the family.</h1>
      {isClerkConfigured() ? (
        <SignUp forceRedirectUrl="/dashboard" />
      ) : (
        <Link className="action" href="/sign-in">
          Continue to sign-in
        </Link>
      )}
    </div>
  );
}
