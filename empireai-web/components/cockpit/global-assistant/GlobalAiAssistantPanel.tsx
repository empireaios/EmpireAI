"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import type { GlobalAssistantResponse } from "@/lib/cockpit/global-assistant/types";
import { speakPillowResponse, usePillowVoice } from "@/lib/cockpit/pillow/use-pillow-voice";

function confidenceLabel(confidence: GlobalAssistantResponse["confidence"]) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  if (confidence === "low") return "Low confidence";
  return "Unavailable";
}

function ResponseBlock({ response }: { response: GlobalAssistantResponse }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-[#c8c0b0]">{response.interactionSummary}</p>
      <div>
        <p className="text-[10px] uppercase text-[#6f6a60]">Current Context</p>
        <p className="text-[#e8e0d0]">{response.currentContext}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase text-[#6f6a60]">Reason</p>
        <p className="text-[#8a847a]">{response.reason}</p>
      </div>
      {response.supportingEvidence.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase text-[#6f6a60]">Supporting Evidence</p>
          <ul className="max-h-36 space-y-1 overflow-y-auto text-xs">
            {response.supportingEvidence.map((ev) => (
              <li
                key={`${ev.source}-${ev.label}-${ev.value}`}
                className="rounded border border-gold/10 px-2 py-1"
              >
                <span className="text-[#6f6a60]">{ev.label}: </span>
                <span className="text-[#c8c0b0]">{ev.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-[10px] uppercase text-[#6f6a60]">Recommended Next Action</p>
        <p className="text-[#d4af37]">{response.recommendedNextAction}</p>
      </div>
      <p className="text-[10px] text-[#6f6a60]">
        {confidenceLabel(response.confidence)} · G4-07 {response.interactionIntent}
      </p>
    </div>
  );
}

const ACTION_BUTTONS: Array<{
  action: "ask" | "explain" | "recommend" | "summarise" | "next_action";
  label: string;
}> = [
  { action: "summarise", label: "Summarise" },
  { action: "explain", label: "Explain" },
  { action: "recommend", label: "Recommend" },
  { action: "next_action", label: "Next Action" },
];

/** V1 Activation — Persistent Pillow operating shell (canonical AI interface). */
export function GlobalAiAssistantPanel() {
  const {
    expanded,
    loading,
    context,
    lastResponse,
    activeTarget,
    queryDraft,
    conversation,
    panelWidthPx,
    voiceEnabled,
    toggle,
    collapse,
    setQueryDraft,
    setPanelWidthPx,
    setVoiceEnabled,
    runAction,
    ask,
  } = useGlobalAiAssistant();

  const voice = usePillowVoice((transcript) => {
    void ask(transcript);
  });

  useEffect(() => {
    if (voiceEnabled && lastResponse?.interactionSummary) {
      speakPillowResponse(lastResponse.interactionSummary);
    }
  }, [lastResponse, voiceEnabled]);

  const executive = context?.executiveContext;

  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
        <button
          type="button"
          aria-label="Open Pillow"
          onClick={toggle}
          className="flex items-center gap-2 rounded-full border border-gold/25 bg-[#0a0a0a]/95 px-4 py-2.5 text-sm text-[#f0d78c] shadow-lg backdrop-blur hover:border-gold/40"
        >
          <span className="text-[#d4af37]">◆</span>
          <span className="hidden sm:inline">Pillow</span>
          {executive && executive.alertCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-200">
              {executive.alertCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      className="fixed bottom-0 right-0 z-40 flex h-[min(85vh,640px)] flex-col border-l border-t border-gold/15 bg-[#0a0a0a]/98 shadow-2xl backdrop-blur-xl lg:bottom-6 lg:right-6 lg:h-[min(80vh,680px)] lg:rounded-xl lg:border"
      style={{ width: "100%", maxWidth: panelWidthPx }}
    >
      <header className="border-b border-gold/10 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
              Pillow · Operating Shell
            </p>
            <h2 className="font-display text-lg text-[#f0d78c]">
              {executive?.screenTitle ?? "Cockpit"}
            </h2>
            {executive && (
              <p className="mt-1 line-clamp-2 text-[11px] text-[#8a847a]">
                {executive.contextSummary}
              </p>
            )}
          </div>
          <button
            type="button"
            className="shrink-0 text-[#8a847a] hover:text-[#f0d78c]"
            onClick={collapse}
            aria-label="Collapse Pillow"
          >
            ✕
          </button>
        </div>
        {executive && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            {executive.engineCenterName && (
              <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#c8c0b0]">
                {executive.engineCenterName}
              </span>
            )}
            <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
              {executive.activeMissionCount} missions
            </span>
            <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
              {executive.alertCount} alerts
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {conversation.length > 0 && (
          <div className="mb-4 space-y-2 border-b border-gold/10 pb-3">
            <p className="text-[10px] uppercase text-[#6f6a60]">Conversation</p>
            <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
              {conversation.slice(-8).map((turn) => (
                <li
                  key={turn.id}
                  className={`rounded px-2 py-1.5 ${
                    turn.role === "pillow"
                      ? "border border-gold/10 bg-white/[0.02] text-[#c8c0b0]"
                      : "text-[#d4af37]"
                  }`}
                >
                  <span className="text-[10px] uppercase text-[#6f6a60]">
                    {turn.role === "pillow" ? "Pillow" : "Grand King"}
                  </span>
                  <p className="mt-0.5">{turn.content}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading && (
          <p className="text-sm text-[#8a847a]">Pillow assembling live context from Brain…</p>
        )}

        {!loading && activeTarget && (
          <p className="mb-3 rounded border border-gold/10 bg-white/[0.02] px-2 py-1.5 text-xs text-[#8a847a]">
            Target: {activeTarget.label}
          </p>
        )}

        {!loading && lastResponse && <ResponseBlock response={lastResponse} />}

        {!loading && !lastResponse && context && (
          <div className="space-y-3 text-sm">
            <p className="text-[#8a847a]">{context.pageInsightSummary}</p>
            {executive?.nextExecutiveAction && (
              <p className="text-xs text-[#d4af37]">
                Next: {executive.nextExecutiveAction}
              </p>
            )}
          </div>
        )}

        {!loading && context && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Suggested</p>
            <div className="flex flex-wrap gap-1.5">
              {context.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-gold/15 px-2.5 py-1 text-[11px] text-[#c8c0b0] hover:border-gold/30"
                  onClick={() => {
                    if (prompt.toLowerCase().includes("summarise")) {
                      void runAction("summarise");
                    } else if (
                      prompt.toLowerCase().includes("recommend") ||
                      prompt.toLowerCase().includes("next")
                    ) {
                      void runAction("next_action");
                    } else if (prompt.toLowerCase().includes("alert")) {
                      void runAction("explain", { targetType: "alert", label: prompt });
                    } else {
                      void runAction("explain", { targetType: "page", label: prompt });
                    }
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && lastResponse && lastResponse.suggestedFollowUps.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-[#d4af37]">
            {lastResponse.suggestedFollowUps.map((f) => (
              <li key={f}>→ {f}</li>
            ))}
          </ul>
        )}
      </div>

      <footer className="space-y-2 border-t border-gold/10 px-4 py-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (queryDraft.trim()) {
              void ask(queryDraft.trim());
            }
          }}
        >
          <input
            type="text"
            id="pillow-query"
            aria-label="Ask Pillow"
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            placeholder="Ask Pillow about this screen…"
            className="flex-1 rounded-lg border border-gold/15 bg-black/40 px-3 py-2 text-sm text-[#e8e0d0] placeholder:text-[#6f6a60] focus:border-gold/30 focus:outline-none"
          />
          {voice.supported && (
            <button
              type="button"
              aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
              onClick={voice.toggle}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                voice.listening
                  ? "bg-red-500/20 text-red-200"
                  : "border border-gold/15 text-[#d4af37] hover:bg-gold/10"
              }`}
            >
              {voice.listening ? "Stop" : "Mic"}
            </button>
          )}
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-gold/15 px-3 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/25"
          >
            Ask
          </button>
        </form>
        <div className="flex items-center justify-between gap-2 text-[10px] text-[#6f6a60]">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            Spoken summaries
          </label>
          <input
            type="range"
            min={320}
            max={720}
            value={panelWidthPx}
            onChange={(e) => setPanelWidthPx(Number(e.target.value))}
            aria-label="Pillow panel width"
            className="w-24"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ACTION_BUTTONS.map(({ action, label }) => (
            <button
              key={action}
              type="button"
              className="rounded-lg border border-gold/15 px-2 py-1.5 text-[11px] text-[#c8c0b0] hover:border-gold/30 hover:text-[#f0d78c]"
              onClick={() =>
                void runAction(
                  action,
                  action === "explain"
                    ? { targetType: "page", label: "Explain this page" }
                    : undefined,
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
        {executive?.topAlertLabel && (
          <Link
            href="/cockpit#executive-alerts"
            className="block text-center text-[10px] text-[#8a847a] hover:text-[#d4af37]"
          >
            Top alert: {executive.topAlertLabel.slice(0, 48)}…
          </Link>
        )}
        <p className="text-center text-[10px] text-[#6f6a60]">
          Pillow · Brain · Registry · EKLS · live application context
        </p>
      </footer>
    </aside>
  );
}
