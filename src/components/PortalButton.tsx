"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function PortalButton({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not open the billing portal.");
      }
      window.location.assign(data.url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not open the billing portal.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        disabled={!enabled || busy}
        onClick={openPortal}
      >
        {busy ? "Opening portal…" : "Manage billing in Stripe"}
      </Button>
      {!enabled ? (
        <p className="text-sm leading-6 text-mist">
          The Stripe customer portal appears after the first successful
          checkout webhook.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
