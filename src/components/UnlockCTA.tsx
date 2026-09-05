import { brand } from "@/config/brand";
import { familySku, monetizationCopy, plans } from "@/config/pricing";
import { ButtonLink } from "@/components/ui";

export function UnlockCTA({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-3xl border border-lantern/40 bg-gradient-to-br from-snow to-parchment p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember">
        Family key
      </p>
      <h2 className="mt-2 font-display text-3xl text-pine sm:text-4xl">
        {monetizationCopy.trialHeadline}
      </h2>
      {!compact && (
        <p className="mt-3 max-w-2xl text-base leading-7 text-bark/80">
          {monetizationCopy.trialBody} One parent email. Camp Compass, Keytrail,
          and Lumen Isles stay together under {brand.name}.
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-pine">
        {plans.map((plan) => (
          <span
            key={plan.id}
            className="rounded-full bg-white/80 px-4 py-2 ring-1 ring-pine/10"
          >
            {plan.priceLabel} {plan.cadence}
            {plan.highlight ? ` · ${plan.highlight}` : ""}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/unlock" variant="lantern">
          Start the {familySku.trialDays}-day trial
        </ButtonLink>
        <ButtonLink href="/sign-in" variant="secondary">
          Parent sign in
        </ButtonLink>
      </div>
    </div>
  );
}
