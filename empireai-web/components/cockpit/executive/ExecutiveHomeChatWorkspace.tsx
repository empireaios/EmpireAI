"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { speakPillowResponse, usePillowVoice } from "@/lib/cockpit/pillow/use-pillow-voice";
import { ExecutiveChatArtifacts } from "@/components/cockpit/executive/ExecutiveChatArtifacts";
import { PillowContextPanel } from "@/components/cockpit/pillow/PillowContextPanel";
import { PillowProactiveGuidance } from "@/components/cockpit/pillow/PillowProactiveGuidance";
import { resolveCockpitScreenContext } from "@/lib/pillow-ux";
import { EXECUTIVE_STARTING_LABEL } from "@/lib/pillow/executive-surface";
import { PILLOW_WORKSPACE_LAYOUT } from "@/lib/cockpit/executive/pillow-workspace-layout";

const EXECUTIVE_ACTIONS = [
  { action: "summarise" as const, label: "Summarise" },
  { action: "explain" as const, label: "Explain" },
  { action: "recommend" as const, label: "Recommend" },
  { action: "next_action" as const, label: "Next Action" },
];

function autosizeComposer(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  const next = Math.min(
    Math.max(el.scrollHeight, PILLOW_WORKSPACE_LAYOUT.composerMinPx),
    PILLOW_WORKSPACE_LAYOUT.composerMaxPx,
  );
  el.style.height = `${next}px`;
}

/**
 * Primary Grand King ↔ Pillow workspace.
 * Scroll owner = Executive Home page. History grows in document flow —
 * no viewport-height nested scroll prison.
 */
export function ExecutiveHomeChatWorkspace() {
  const pathname = usePathname();
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const seenConversationLenRef = useRef<number | null>(null);
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
    expand,
    executiveSnapshot,
    proactiveGuidance,
  } = useGlobalAiAssistant();
  const canSend = !loading && Boolean(queryDraft.trim());

  const voice = usePillowVoice((transcript) => {
    void ask(transcript);
  });

  const focusComposer = useCallback((opts?: { scrollIntoView?: boolean }) => {
    if (opts?.scrollIntoView) {
      const root = document.getElementById("executive-pillow-workspace");
      root?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    window.requestAnimationFrame(() => {
      composerRef.current?.focus({ preventScroll: true });
      autosizeComposer(composerRef.current);
    });
  }, []);

  useEffect(() => {
    expand();
  }, [expand]);

  // Do NOT autofocus composer on mount — that jumps the page into Pillow and
  // traps the Grand King mid-workspace. Explicit focus-pillow events still work.
  useEffect(() => {
    const onFocus = () => focusComposer({ scrollIntoView: true });
    window.addEventListener(PILLOW_WORKSPACE_LAYOUT.focusEventName, onFocus);
    return () => window.removeEventListener(PILLOW_WORKSPACE_LAYOUT.focusEventName, onFocus);
  }, [focusComposer]);

  useEffect(() => {
    autosizeComposer(composerRef.current);
  }, [queryDraft]);

  useEffect(() => {
    if (voiceEnabled && conversation.length > 0) {
      const last = conversation[conversation.length - 1];
      if (last?.role === "pillow") {
        speakPillowResponse(last.content);
      }
    }
  }, [conversation, voiceEnabled]);

  // Page-primary: only follow the latest turn after a NEW message arrives.
  // Initial hydrate / remount must not yank scroll into the Pillow region.
  useEffect(() => {
    const prev = seenConversationLenRef.current;
    const next = conversation.length;
    if (prev === null) {
      seenConversationLenRef.current = next;
      return;
    }
    if (next <= prev) {
      seenConversationLenRef.current = next;
      return;
    }
    seenConversationLenRef.current = next;
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation.length]);

  const executive = context?.executiveContext;
  const screen = resolveCockpitScreenContext(pathname);

  return (
    <section
      id="executive-pillow-workspace"
      data-testid="executive-pillow-workspace"
      className="flex w-full flex-col rounded-xl border border-gold/20 bg-[#0a0a0a]/98 shadow-2xl"
      style={{ minHeight: PILLOW_WORKSPACE_LAYOUT.workspaceMinPx }}
      aria-label="Executive Chat workspace"
      data-scroll-policy="page-primary"
      data-history-scroll="page-flow"
    >
      <header className="shrink-0 border-b border-gold/10 px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
              Pillow · Primary executive workspace
            </p>
            <h2 className="font-display text-2xl text-[#f0d78c]">Executive Chat</h2>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              executiveReady
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-amber-500/15 text-amber-200"
            }`}
            title={
              executiveReady
                ? "Executive Intelligence ready"
                : readinessLabel || "Starting — composer remains usable"
            }
          >
            {executiveReady ? "Ready" : readinessLabel}
          </span>
        </div>
      </header>

      {executiveSnapshot && (
        <div
          data-testid="pillow-context-strip"
          className="shrink-0 space-y-2 border-b border-gold/10 px-5 py-2"
          style={{ maxHeight: PILLOW_WORKSPACE_LAYOUT.contextStripMaxPx }}
        >
          <div className="max-h-full overflow-y-auto overscroll-y-contain">
            <PillowContextPanel snapshot={executiveSnapshot} screenTitle={screen.screenTitle} />
            <PillowProactiveGuidance
              items={
                executiveReady
                  ? proactiveGuidance.filter((g) => g.id !== "pending-approvals")
                  : []
              }
              onAsk={(prompt) => {
                if (executiveReady) void ask(prompt);
              }}
            />
          </div>
        </div>
      )}

      {/*
        History is document-flow (no max-height / overflow-y prison).
        Long conversations scroll with Executive Home — the canonical page owner.
      */}
      <div
        data-testid="pillow-message-history"
        className="px-5 py-4"
        data-scroll-policy="page-flow"
      >
        {!executiveReady && (
          <p className="mb-3 rounded border border-gold/20 bg-gold/5 px-2 py-1.5 text-xs text-[#f0d78c]">
            {readinessLabel || connectionError || EXECUTIVE_STARTING_LABEL}
          </p>
        )}

        {conversation.length === 0 && !loading && (
          <div className="flex min-h-[160px] flex-col justify-center text-sm text-[#8a847a]">
            <p className="max-w-3xl text-base leading-relaxed text-[#c8c0b0]">
              {context?.pageInsightSummary ??
                "Executive Chat — write a full strategic instruction below. Pillow is your primary operating surface."}
            </p>
            {executive?.nextExecutiveAction && (
              <p className="mt-3 text-sm text-[#d4af37]">Next: {executive.nextExecutiveAction}</p>
            )}
          </div>
        )}

        <ul className="mx-auto max-w-4xl space-y-5">
          {conversation.map((turn) => (
            <li
              key={turn.id}
              className={
                turn.role === "pillow"
                  ? "rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-3"
                  : "text-right"
              }
            >
              <span className="text-[10px] uppercase text-[#6f6a60]">
                {turn.role === "pillow" ? "Pillow" : "Grand King"}
              </span>
              <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-[#e8e0d0]">
                {turn.content}
              </p>
              {turn.artifacts && turn.artifacts.length > 0 && (
                <ExecutiveChatArtifacts artifacts={turn.artifacts} />
              )}
            </li>
          ))}
        </ul>

        {loading && (
          <p className="mt-3 text-sm text-[#8a847a]">Preparing your executive response…</p>
        )}
        <div ref={conversationEndRef} aria-hidden className="h-px w-px" />
      </div>

      <footer
        data-testid="pillow-composer-footer"
        className="shrink-0 space-y-3 border-t border-gold/10 px-5 py-4"
      >
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSend) return;
            void ask(queryDraft.trim());
          }}
        >
          <textarea
            ref={composerRef}
            id="executive-pillow-query"
            data-testid="pillow-composer"
            aria-label="Executive prompt"
            value={queryDraft}
            onChange={(e) => {
              setQueryDraft(e.target.value);
              autosizeComposer(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!canSend) return;
                void ask(queryDraft.trim());
              }
            }}
            rows={5}
            autoComplete="off"
            spellCheck
            placeholder="Write a full executive instruction — multiple paragraphs are welcome…"
            className="min-h-[140px] max-h-[320px] flex-1 resize-y rounded-lg border border-gold/15 bg-black/40 px-4 py-3 text-base leading-relaxed text-[#e8e0d0] placeholder:text-[#6f6a60] focus:border-gold/30 focus:outline-none"
          />
          {voice.supported && (
            <button
              type="button"
              aria-label={voice.listening ? "Stop voice" : "Voice input"}
              onClick={voice.toggle}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
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
            disabled={!canSend}
            title={
              loading
                ? "Preparing response…"
                : !queryDraft.trim()
                  ? "Type a message to enable Send"
                  : "Send"
            }
            className="shrink-0 rounded-lg bg-gold/15 px-4 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
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
            {EXECUTIVE_ACTIONS.map(({ action, label }) => {
              const disabled = !executiveReady || loading;
              return (
                <button
                  key={action}
                  type="button"
                  disabled={disabled}
                  title={
                    disabled
                      ? executiveReady
                        ? "Wait for current response"
                        : "Unavailable until Executive Intelligence is Ready"
                      : label
                  }
                  className="rounded border border-gold/15 px-2 py-1 text-[10px] text-[#c8c0b0] hover:border-gold/30 disabled:cursor-not-allowed disabled:opacity-40"
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
              );
            })}
          </div>
        </div>
      </footer>
    </section>
  );
}
