import Link from "next/link";
import { CheckoutButtons } from "@/components/CheckoutButtons";
import { getViewer } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { family, entitlement } from "@/lib/platform/model";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "One family membership · six learners",
  description:
    "Explore all four K–5 learning games with a 14-day family trial. Monthly and discounted annual memberships include up to six children.",
  path: "/unlock",
});
export default async function Page() {
  const v = await getViewer();
  const access = v ? entitlement(family(v.userId)) : null;
  return (
    <div className="workspace" style={{ maxWidth: 900 }}>
      <p className="eyebrow">One membership. Their whole world.</p>
      <h1>Room for every learner.</h1>
      <p style={{ marginBottom: 24 }}>
        All four games, up to six children, shared learning plans, custom
        question banks, saved adventures, and special island rewards.
      </p>
      <section className="panel">
        <h2>Start with 14 days to explore.</h2>
        <p>
          Your trial begins when you first open your family account. No card is
          needed to try the games. After the trial, keep a small practice
          selection free or choose a family membership.
        </p>
        <div className="actions">
          <Link className="action" href={v ? "/dashboard" : "/sign-up"}>
            {v ? "Open parent space" : "Start your family trial"}
          </Link>
          {access && <span className="badge">{access.label}</span>}
        </div>
      </section>
      <CheckoutButtons signedIn={!!v} />
      <p className="muted" style={{ marginTop: 20 }}>
        The annual plan gives you 12 months for the price of 10. Manage or
        cancel your subscription in parent space. Checkout shows your exact
        first payment date; if fewer than 48 trial hours remain, membership
        billing starts at checkout.
      </p>
    </div>
  );
}
