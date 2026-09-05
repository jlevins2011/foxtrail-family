import { brand } from "@/config/brand";
import { plans } from "@/config/pricing";
import { ButtonLink } from "@/components/ui";

export function UnlockCTA({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-3xl border border-lantern/40 bg-gradient-to-br from-snow to-parchment p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember">
        Family key
      </p>
      <h2 className="mt-2 font-display text-3xl text-pine sm:text-4xl">
        Unlock all games for this family
      </h2>
      {!compact && (
        <p className="mt-3 max-w-2xl text-base leading-7 text-bark/80">
          One parent email. One subscription. Camp Compass, Keytrail, and Lumen
          Isles stay together under {brand.name}. After unlock, add the hub to
          an iPad home screen so kids open camp — not a browser tab.
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
          Unlock all games
        </ButtonLink>
        <ButtonLink href="/sign-in" variant="secondary">
          Parent sign in
        </ButtonLink>
      </div>
    </div>
  );
}
