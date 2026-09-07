import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/env";
import { LOCAL_TEST } from "@/lib/platform/security";
import { TestLogin } from "@/components/TestLogin";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <div className="workspace" style={{ maxWidth: 580 }}>
      <h1>Parent sign-in</h1>
      {LOCAL_TEST() ? (
        <TestLogin />
      ) : isClerkConfigured() ? (
        <SignIn forceRedirectUrl="/dashboard" />
      ) : (
        <section className="panel">
          <h2>We’re getting ready.</h2>
          <p>
            Family sign-in will open when the site owner connects the sign-in
            service.
          </p>
        </section>
      )}
    </div>
  );
}
