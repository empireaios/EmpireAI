"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { speakPillowResponse, usePillowVoice } from "@/lib/cockpit/pillow/use-pillow-voice";
import { ExecutiveChatArtifacts } from "@/components/cockpit/executive/ExecutiveChatArtifacts";
import { PillowContextPanel } from "@/components/cockpit/pillow/PillowContextPanel";
import { resolveCockpitScreenContext } from "@/lib/pillow-ux";
import { EXECUTIVE_STARTING_LABEL } from "@/lib/pillow/executive-surface";
import { scrubMachineLanguage } from "@/lib/cockpit/executive/executive-presentation";

const PAGE_SIZE = 40;

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(Math.max(el.scrollHeight, 72), 240)}px`;
}

/**
 * Full Pillow conversation workspace (ChatGPT/Claude-style).
 * Used on Pillow Centre — not embedded as the entire Executive Home.
 */
export function PillowConversationWorkspace({
  title = "Pillow",
  autoFocus = false,
}: {
  title?: string;
  autoFocus?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const historyRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const seenLen = useRef<number | null>(null);
  const [windowSize, setWindowSize] = useState(PAGE_SIZE);
  const {
    loading,
    conversation,
    queryDraft,
    voiceEnabled,
    connectionError,
    executiveReady,
    readinessLabel,
    setQueryDraft,
    setVoiceEnabled,
    ask,
    expand,
    executiveSnapshot,
  } = useGlobalAiAssistant();

  const canSend = !loading && Boolean(queryDraft.trim());
  const voice = usePillowVoice((transcript) => {
    void ask(transcript);
  });

  useEffect(() => {
    expand();
  }, [expand]);

  const seededRef = useRef(false);
  useEffect(() => {
    const seed = searchParams?.get("ask");
    if (!seed || seededRef.current) return;
    seededRef.current = true;
    setQueryDraft(seed);
    window.requestAnimationFrame(() => {
      composerRef.current?.focus({ preventScroll: true });
      void ask(seed);
    });
  }, [searchParams, setQueryDraft, ask]);

  useEffect(() => {
    if (!autoFocus) return;
    window.requestAnimationFrame(() => composerRef.current?.focus({ preventScroll: true }));
  }, [autoFocus]);

  useEffect(() => {
    autosize(composerRef.current);
  }, [queryDraft]);

  useEffect(() => {
    if (voiceEnabled && conversation.length > 0) {
      const last = conversation[conversation.length - 1];
      if (last?.role === "pillow") speakPillowResponse(last.content);
    }
  }, [conversation, voiceEnabled]);

  useEffect(() => {
    const prev = seenLen.current;
    const next = conversation.length;
    if (prev === null) {
      seenLen.current = next;
      return;
    }
    if (next > prev) {
      const pane = historyRef.current;
      if (pane) pane.scrollTop = pane.scrollHeight;
    }
    seenLen.current = next;
  }, [conversation.length]);

  const hiddenCount = Math.max(0, conversation.length - windowSize);
  const visibleTurns = useMemo(
    () => conversation.slice(Math.max(0, conversation.length - windowSize)),
    [conversation, windowSize],
  );
  const screen = resolveCockpitScreenContext(pathname);

  const onSend = useCallback(() => {
    if (!canSend) return;
    void ask(queryDraft.trim());
  }, [ask, canSend, queryDraft]);

  return (
    <section
      id="pillow-conversation-workspace"
      data-testid="pillow-conversation-workspace"
      aria-label="Pillow conversation"
      className="flex h-[min(85vh,920px)] min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-[#0a0a0a]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gold/10 px-5 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">Conversation</p>
          <h2 className="font-display text-xl text-[#f0d78c]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] ${
              executiveReady
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            {executiveReady ? "Available" : scrubMachineLanguage(readinessLabel || "Starting")}
          </span>
          <button
            type="button"
            className="rounded-lg border border-gold/15 px-2.5 py-1 text-[10px] text-[#8a847a] hover:border-gold/30"
            onClick={() => {
              setQueryDraft("");
              composerRef.current?.focus({ preventScroll: true });
            }}
          >
            New message
          </button>
        </div>
      </header>

      <details className="shrink-0 border-b border-gold/10 px-5 py-2">
        <summary className="cursor-pointer text-xs text-[#6f6a60]">Context ▸</summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          {executiveSnapshot ? (
            <PillowContextPanel snapshot={executiveSnapshot} screenTitle={screen.screenTitle} />
          ) : (
            <p className="text-xs text-[#6f6a60]">
              Pillow uses current screen and business state automatically. Details stay hidden unless
              you open this.
            </p>
          )}
        </div>
      </details>

      <div
        ref={historyRef}
        data-testid="pillow-message-history"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {!executiveReady && (
          <p className="mb-4 rounded-lg border border-gold/15 bg-gold/5 px-3 py-2 text-xs text-[#f0d78c]">
            {scrubMachineLanguage(readinessLabel || connectionError || EXECUTIVE_STARTING_LABEL)}
          </p>
        )}

        {conversation.length === 0 && !loading && (
          <div className="mx-auto flex min-h-[240px] max-w-3xl flex-col justify-center text-[#8a847a]">
            <p className="text-base leading-relaxed text-[#c8c0b0]">
              Ask Pillow about decisions, commerce, risks, or what needs your authority. Pillow
              answers from operating evidence — not from invented LIVE figures.
            </p>
          </div>
        )}

        {hiddenCount > 0 && (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              className="text-xs text-[#d4af37] hover:underline"
              onClick={() => setWindowSize((n) => n + PAGE_SIZE)}
            >
              Show earlier messages ({hiddenCount})
            </button>
          </div>
        )}

        <ul className="mx-auto flex max-w-3xl flex-col gap-4">
          {visibleTurns.map((turn) => {
            const mine = turn.role !== "pillow";
            return (
              <li
                key={turn.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    mine
                      ? "bg-[#d4af37]/15 text-[#f0d78c]"
                      : "border border-gold/10 bg-white/[0.03] text-[#e8e0d0]"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
                    {mine ? "Grand King" : "Pillow"}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">
                    {turn.content}
                  </p>
                  {turn.artifacts && turn.artifacts.length > 0 && (
                    <ExecutiveChatArtifacts artifacts={turn.artifacts} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {loading && (
          <p className="mx-auto mt-4 max-w-3xl text-sm text-[#8a847a]">Pillow is thinking…</p>
        )}
      </div>

      <footer className="shrink-0 border-t border-gold/10 bg-[#0a0a0a] px-4 py-3 sm:px-5">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <textarea
            ref={composerRef}
            data-testid="pillow-composer"
            aria-label="Message Pillow"
            value={queryDraft}
            onChange={(e) => {
              setQueryDraft(e.target.value);
              autosize(e.target);
            }}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts newline (standard chat).
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={3}
            placeholder="Message Pillow…"
            className="min-h-[72px] max-h-[240px] flex-1 resize-none rounded-xl border border-gold/20 bg-black/50 px-4 py-3 text-[15px] leading-relaxed text-[#e8e0d0] placeholder:text-[#6f6a60] focus:border-gold/40 focus:outline-none"
          />
          {voice.supported && (
            <button
              type="button"
              aria-label={voice.listening ? "Stop voice" : "Voice input"}
              onClick={voice.toggle}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs ${
                voice.listening
                  ? "bg-red-500/20 text-red-200"
                  : "border border-gold/20 text-[#d4af37]"
              }`}
            >
              {voice.listening ? "Stop" : "Voice"}
            </button>
          )}
          <button
            type="submit"
            disabled={!canSend}
            className="shrink-0 rounded-xl bg-gold/20 px-4 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/30 disabled:opacity-40"
          >
            Send
          </button>
        </form>
        <label className="mx-auto mt-2 flex max-w-3xl items-center gap-2 text-[10px] text-[#6f6a60]">
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
          />
          Spoken summaries
        </label>
      </footer>
    </section>
  );
}
