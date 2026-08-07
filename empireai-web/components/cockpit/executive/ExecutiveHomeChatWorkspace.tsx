"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { speakPillowResponse, usePillowVoice } from "@/lib/cockpit/pillow/use-pillow-voice";
import { ExecutiveChatArtifacts } from "@/components/cockpit/executive/ExecutiveChatArtifacts";
import { PillowContextPanel } from "@/components/cockpit/pillow/PillowContextPanel";
import { PillowProactiveGuidance } from "@/components/cockpit/pillow/PillowProactiveGuidance";
import { resolveCockpitScreenContext } from "@/lib/pillow-ux";

const EXECUTIVE_ACTIONS = [
  { action: "summarise" as const, label: "Summarise" },
  { action: "explain" as const, label: "Explain" },
  { action: "recommend" as const, label: "Recommend" },
  { action: "next_action" as const, label: "Next Action" },
];

/** Part H — Full-height Executive Chat workspace on Executive Home. */
export function ExecutiveHomeChatWorkspace() {
  const pathname = usePathname();
  const conversationRef = useRef<HTMLDivElement>(null);
  const {
    loading,
    context,
    conversation,
    queryDraft,
    voiceEnabled,
    connectionError,
    executiveReady,
    readinessLabel,
    setQueryDraft,
    setVoiceEnabled,
    runAction,
    ask,
    ensureHostSession,
    expand,
    executiveSnapshot,
    proactiveGuidance,
  } = useGlobalAiAssistant();
  const chatEnabled = executiveReady && !loading;

  const voice = usePillowVoice((transcript) => {
    void ask(transcript);
  });

  useEffect(() => {
    expand();
    void ensureHostSession();
  }, [expand, ensureHostSession]);

  useEffect(() => {
    if (voiceEnabled && conversation.length > 0) {
      const last = conversation[conversation.length - 1];
      if (last?.role === "pillow") {
        speakPillowResponse(last.content);
      }
    }
  }, [conversation, voiceEnabled]);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation, loading]);

  const executive = context?.executiveContext;
  const screen = resolveCockpitScreenContext(pathname);

  return (
    <section
      className="flex h-[calc(100vh-8.5rem)] min-h-[520px] flex-col overflow-hidden rounded-xl border border-gold/15 bg-[#0a0a0a]/95 shadow-2xl lg:h-[calc(100vh-7rem)]"
      aria-label="Executive Chat"
    >
      <header className="shrink-0 border-b border-gold/10 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
              Pillow · Executive Intelligence · P7-03
            </p>
            <h2 className="font-display text-lg text-[#f0d78c]">Executive Chat</h2>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              executiveReady
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            {executiveReady ? "Ready" : readinessLabel}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          {executive?.engineCenterName && (
            <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#c8c0b0]">
              {executive.engineCenterName}
            </span>
          )}
          <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
            {executive?.activeMissionCount ?? 0} active missions
          </span>
          <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
            {executive?.alertCount ?? 0} alerts
          </span>
          {executive?.topAlertLabel && (
            <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-red-200">
              {executive.topAlertLabel.slice(0, 40)}
            </span>
          )}
        </div>
      </header>

      {executiveSnapshot && (
        <div className="shrink-0 space-y-2 border-b border-gold/10 px-4 py-2">
          <PillowContextPanel snapshot={executiveSnapshot} screenTitle={screen.screenTitle} />
          <PillowProactiveGuidance
            items={executiveReady ? proactiveGuidance : []}
            onAsk={(prompt) => {
              if (executiveReady) void ask(prompt);
            }}
          />
        </div>
      )}

      <div
        ref={conversationRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        {!executiveReady && (
          <p className="mb-3 rounded border border-gold/20 bg-gold/5 px-2 py-1.5 text-xs text-[#f0d78c]">
            {readinessLabel || connectionError || "Preparing Executive Intelligence…"}
          </p>
        )}

        {conversation.length === 0 && !loading && (
          <div className="flex h-full flex-col justify-center text-sm text-[#8a847a]">
            <p className="text-[#c8c0b0]">
              {!executiveReady
                ? "Starting Executive Systems — conversation will unlock when ready."
                : (context?.pageInsightSummary ??
                  "Executive Chat — your primary operating console. Ask Pillow anything.")}
            </p>
            {executiveReady && executive?.nextExecutiveAction && (
              <p className="mt-2 text-xs text-[#d4af37]">
                Next: {executive.nextExecutiveAction}
              </p>
            )}
          </div>
        )}

        <ul className="space-y-4">
          {conversation.map((turn) => (
            <li
              key={turn.id}
              className={
                turn.role === "pillow"
                  ? "rounded-lg border border-gold/10 bg-white/[0.02] px-3 py-2.5"
                  : "text-right"
              }
            >
              <span className="text-[10px] uppercase text-[#6f6a60]">
                {turn.role === "pillow" ? "Pillow" : "Grand King"}
              </span>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#e8e0d0]">{turn.content}</p>
              {turn.artifacts && turn.artifacts.length > 0 && (
                <ExecutiveChatArtifacts artifacts={turn.artifacts} />
              )}
            </li>
          ))}
        </ul>

        {loading && (
          <p className="mt-3 text-sm text-[#8a847a]">Preparing your executive response…</p>
        )}
      </div>

      <footer className="shrink-0 space-y-2 border-t border-gold/10 px-4 py-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!chatEnabled) return;
            if (queryDraft.trim()) {
              void ask(queryDraft.trim());
            }
          }}
        >
          <input
            type="text"
            id="executive-pillow-query"
            aria-label="Executive prompt"
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            disabled={!executiveReady}
            placeholder={
              executiveReady
                ? "Executive prompt — repository, knowledge, live intelligence…"
                : "Preparing Executive Intelligence…"
            }
            className="min-h-[44px] flex-1 rounded-lg border border-gold/15 bg-black/40 px-3 py-2 text-sm text-[#e8e0d0] placeholder:text-[#6f6a60] focus:border-gold/30 focus:outline-none disabled:opacity-60"
          />
          {voice.supported && (
            <button
              type="button"
              aria-label={voice.listening ? "Stop voice" : "Voice input"}
              onClick={voice.toggle}
              disabled={!executiveReady}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                voice.listening
                  ? "bg-red-500/20 text-red-200"
                  : "border border-gold/15 text-[#d4af37] hover:bg-gold/10"
              }`}
            >
              {voice.listening ? "Stop" : "Voice"}
            </button>
          )}
          <button
            type="submit"
            disabled={!chatEnabled}
            className="shrink-0 rounded-lg bg-gold/15 px-4 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/25 disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-[#6f6a60]">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            Spoken summaries
          </label>
          <div className="flex flex-wrap gap-1">
            {EXECUTIVE_ACTIONS.map(({ action, label }) => (
              <button
                key={action}
                type="button"
                disabled={!executiveReady || loading}
                className="rounded border border-gold/15 px-2 py-1 text-[10px] text-[#c8c0b0] hover:border-gold/30 disabled:opacity-40"
                onClick={() =>
                  void runAction(
                    action,
                    action === "explain"
                      ? { targetType: "page", label: "Explain Executive Home" }
                      : undefined,
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[10px] text-[#6f6a60]">
          {pathname} · Soul · EKLS · OpenAI Intelligence Platform · Artifacts
        </p>
      </footer>
    </section>
  );
}
