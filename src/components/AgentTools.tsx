"use client";
import { useEffect } from "react";
export function AgentTools() {
  useEffect(() => {
    type Registry = {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: () => Promise<unknown>;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const registry = (document as unknown as { modelContext?: Registry })
      .modelContext;
    if (!registry) return;
    const controller = new AbortController();
    void Promise.resolve(
      registry.registerTool(
        {
          name: "read_family_learning_plans",
          title: "Read family learning plans",
          description:
            "Read the current family’s profiles and question-bank catalog. Requires an already unlocked parent session. Does not unlock parent controls.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async () => {
            const r = await fetch("/api/family/state", { cache: "no-store" });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            return {
              children: d.family.children,
              banks: d.banks.map(
                (b: { id: string; title: string; subject: string }) => ({
                  id: b.id,
                  title: b.title,
                  subject: b.subject,
                }),
              ),
            };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  return null;
}
