"use client";

import { useState } from "react";
import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  Panel,
  PlatformPageHeader,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";

type CeoView = {
  briefing: {
    headline: string;
    summary: string;
    priorities: Array<{ title: string; impact: string; status: string }>;
    decisions: Array<{ id: string; title: string }>;
  };
};

export function AiCeoModule() {
  const { data, loading, error, reload } = useBrainModule<CeoView>("ai-ceo");
  const { execute, loading: acting } = useBrainAction();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleApprove(decisionId: string) {
    setActionError(null);
    try {
      await execute({
        module: "ai-ceo",
        action: "approve",
        payload: { decisionId },
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed");
    }
  }

  async function handleApproveAll() {
    setActionError(null);
    try {
      await execute({
        module: "ai-ceo",
        action: "approve_all",
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approve all failed");
    }
  }

  return (
    <BrainModuleShell
      loading={loading}
      error={error}
      onRetry={reload}
      actionError={actionError}
    >
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Executive Intelligence"
            title="AI CEO"
            description="Victoria orchestrates portfolio strategy, manufacturing decisions, and capital allocation across your empire."
            actions={<ActionButton>Request briefing</ActionButton>}
          />

          <div className="mb-8 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-display text-2xl text-[#d4af37]">
                ♛
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                  Executive Briefing · Brain sync
                </p>
                <h2 className="mt-2 font-display text-2xl text-[#f0d78c] sm:text-3xl">
                  {data.briefing.headline}
                </h2>
                <p className="mt-4 leading-relaxed text-[#a8a095]">
                  {data.briefing.summary}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Strategic Priorities" subtitle="Ranked by impact">
              <ul className="space-y-4">
                {data.briefing.priorities.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-center justify-between rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#f0d78c]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#6f6a60]">
                        Impact: {item.impact}
                      </p>
                    </div>
                    <Badge variant="gold">{item.status}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel
              title="Pending Decisions"
              subtitle="Awaiting founder approval"
              action={
                <ActionButton
                  variant="secondary"
                  disabled={acting || data.briefing.decisions.length === 0}
                  onClick={() => void handleApproveAll()}
                >
                  {acting ? "Approving…" : "Approve all"}
                </ActionButton>
              }
            >
              <ul className="space-y-3">
                {data.briefing.decisions.length === 0 ? (
                  <li className="rounded-lg border border-gold/10 px-4 py-3 text-sm text-[#6f6a60]">
                    No pending decisions — portfolio is fully authorized.
                  </li>
                ) : (
                  data.briefing.decisions.map((decision) => (
                    <li
                      key={decision.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-gold/10 px-4 py-3"
                    >
                      <p className="text-sm text-[#c8c0b0]">{decision.title}</p>
                      <div className="flex shrink-0 gap-2">
                        <ActionButton variant="ghost">Deny</ActionButton>
                        <ActionButton
                          disabled={acting}
                          onClick={() => void handleApprove(decision.id)}
                        >
                          Approve
                        </ActionButton>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </BrainModuleShell>
  );
}
