import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Section } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { isClerkConfigured, isDevUnlockEnabled } from "@/lib/env";
import { listQuestionBanks } from "@/lib/question-banks/store";
import { questionBankKinds } from "@/lib/question-banks/types";

export const metadata: Metadata = {
  title: "Question banks",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function QuestionBanksPage() {
  const viewer = await getViewer();

  if (!viewer) {
    if (!isClerkConfigured() && !isDevUnlockEnabled()) {
      return (
        <Section className="max-w-3xl">
          <ComingSoon />
        </Section>
      );
    }
    redirect("/sign-in?redirect_url=/dashboard/question-banks");
  }

  const banks = await listQuestionBanks(viewer.userId);

  return (
    <Section className="max-w-3xl">
      <ComingSoon />
      <p className="mt-6 text-sm text-mist">
        Family key: {viewer.email ?? viewer.userId}. Banks stored for this
        family: {banks.length}.
      </p>
    </Section>
  );
}

function ComingSoon() {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
        Grown-ups only
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine">
        Question banks — coming soon
      </h1>
      <p className="mt-4 text-lg leading-8 text-bark/80">
        One family list, reused later by any game that opts in — spelling,
        Latin, math facts, or a custom bank. Not a separate database per game.
        Game adapters are not built yet.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {questionBankKinds.map((item) => (
          <li
            key={item.kind}
            className="rounded-2xl border border-pine/10 bg-snow p-4"
          >
            <p className="font-display text-xl text-pine">{item.label}</p>
            <p className="mt-1 text-sm text-mist">{item.example}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-2xl bg-parchment/80 px-4 py-3 text-sm leading-6 text-bark/80">
        Create, edit, and opt-in controls will land here. This page is a
        read-only placeholder so the shape is visible. See{" "}
        <code>docs/question-banks.md</code>.
      </p>
      <div className="mt-8">
        <ButtonLink href="/dashboard" variant="secondary">
          Back to the dashboard
        </ButtonLink>
      </div>
    </>
  );
}
