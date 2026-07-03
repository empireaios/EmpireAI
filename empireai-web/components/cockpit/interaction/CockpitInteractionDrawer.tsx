"use client";

import { useCockpitInteraction } from "@/lib/cockpit/interaction/CockpitInteractionProvider";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import type { AiInsightContract } from "@/lib/cockpit/interaction/types";

function confidenceLabel(confidence: AiInsightContract["confidence"]) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  if (confidence === "low") return "Low confidence";
  return "Unavailable";
}

function InsightBlock({ insight, title }: { insight: AiInsightContract; title?: string }) {
  return (
    <div className="space-y-4 text-sm">
      {title && <p className="font-display text-lg text-[#f0d78c]">{title}</p>}
      <div>
        <p className="text-[10px] uppercase text-[#6f6a60]">Current AI Insight</p>
        <p className="text-[#e8e0d0]">{insight.currentInsight}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase text-[#6f6a60]">Recommended Action</p>
        <p className="text-[#d4af37]">{insight.recommendedAction}</p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[#8a847a]">
        <span>{confidenceLabel(insight.confidence)}</span>
        {insight.confidenceScore !== null && <span>Score: {insight.confidenceScore}%</span>}
        <span>Source: {insight.reasoningSource}</span>
      </div>
      {insight.supportingEvidence.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Supporting Evidence</p>
          <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs">
            {insight.supportingEvidence.map((ev) => (
              <li key={`${ev.source}-${ev.label}-${ev.value}`} className="rounded border border-gold/10 px-2 py-1.5">
                <span className="text-[#6f6a60]">{ev.label}: </span>
                <span className="text-[#c8c0b0]">{ev.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** G4-07 — Global AI interaction drawer (every Cockpit page). */
export function CockpitInteractionDrawer() {
  const {
    open,
    closeDrawer,
    loading,
    context,
    lastResponse,
    activeTarget,
    ask,
    recommendNextAction,
  } = useCockpitInteraction();

  if (!open) return null;

  const insight = lastResponse?.insight ?? context?.pageInsight;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close AI interaction"
        onClick={closeDrawer}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-gold/15 bg-[#0a0a0a] shadow-2xl">
        <header className="border-b border-gold/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37]">
                AI Interaction Layer · G4-07
              </p>
              <h2 className="font-display text-xl text-[#f0d78c]">
                {context?.screen.screenTitle ?? "Cockpit"}
              </h2>
              <p className="mt-1 text-xs text-[#6f6a60]">
                {context?.screen.screenId} · Brain bridge · framework only
              </p>
            </div>
            <button type="button" className="text-[#8a847a] hover:text-[#f0d78c]" onClick={closeDrawer}>
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-[#8a847a]">Assembling insight from Brain…</p>}

          {!loading && activeTarget && (
            <p className="mb-4 rounded-lg border border-gold/10 bg-white/[0.02] px-3 py-2 text-xs text-[#8a847a]">
              Target: {activeTarget.label}
              {activeTarget.value ? ` · ${activeTarget.value}` : ""}
            </p>
          )}

          {!loading && lastResponse && (
            <p className="mb-4 text-sm text-[#c8c0b0]">{lastResponse.summary}</p>
          )}

          {!loading && insight && <InsightBlock insight={insight} />}

          {!loading && context && (
            <div className="mt-6 space-y-2">
              <p className="text-[10px] uppercase text-[#6f6a60]">Suggested prompts</p>
              <div className="flex flex-wrap gap-2">
                {context.suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-gold/15 px-3 py-1 text-xs text-[#c8c0b0] hover:border-gold/30 hover:text-[#f0d78c]"
                    onClick={() =>
                      void ask(
                        prompt.toLowerCase().includes("recommend")
                          ? "recommend_next_action"
                          : prompt.toLowerCase().includes("alert")
                            ? "explain_alert"
                            : prompt.toLowerCase().includes("health")
                              ? "explain_engine_health"
                              : "explain_panel",
                        { targetType: "page", label: prompt },
                      )
                    }
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && lastResponse && lastResponse.suggestedFollowUps.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Follow-up</p>
              <ul className="space-y-1 text-xs text-[#d4af37]">
                {lastResponse.suggestedFollowUps.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="border-t border-gold/10 px-5 py-4">
          <button
            type="button"
            className="w-full rounded-lg bg-gradient-to-r from-[#d4af37] to-[#9a7b1a] px-4 py-2.5 text-sm font-semibold text-[#1a1408]"
            onClick={() => void recommendNextAction()}
          >
            Recommend next action
          </button>
          <p className="mt-2 text-center text-[10px] text-[#6f6a60]">
            Pillow NL · voice · proactive AI — future channels
          </p>
        </footer>
      </aside>
    </div>
  );
}

/** G4-07 — Engine Center AI insight panel (five-field contract). */
export function EngineCenterAiInsightPanel({
  insight,
  engineName,
}: {
  insight: AiInsightContract;
  engineName: string;
}) {
  return (
    <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
        Current AI Insight · {engineName}
      </p>
      <InsightBlock insight={insight} />
    </div>
  );
}

/** Compact explain affordance for widgets and panels. */
export function CockpitExplainButton({
  label,
  targetId,
  value,
  className = "",
}: {
  label: string;
  targetId?: string;
  value?: string;
  className?: string;
}) {
  const { explain } = useGlobalAiAssistant();

  return (
    <button
      type="button"
      className={`text-[10px] uppercase tracking-wider text-[#d4af37] hover:underline ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void explain(label, targetId, value);
      }}
    >
      Explain
    </button>
  );
}
