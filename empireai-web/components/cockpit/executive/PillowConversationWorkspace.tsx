"use client";

import { useCallback, useEffect, useMemo, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { speakPillowResponse, usePillowVoice } from "@/lib/cockpit/pillow/use-pillow-voice";
import { ExecutiveChatArtifacts } from "@/components/cockpit/executive/ExecutiveChatArtifacts";
import { ExecutiveChatMarkdown } from "@/components/cockpit/executive/ExecutiveChatMarkdown";
import { CopyPillowAnswer } from "@/components/cockpit/executive/CopyPillowAnswer";
import layout from "./PillowConversationLayout.module.css";
import Link from "next/link";
import { PillowContextPanel } from "@/components/cockpit/pillow/PillowContextPanel";
import { resolveCockpitScreenContext } from "@/lib/pillow-ux";
import { EXECUTIVE_STARTING_LABEL } from "@/lib/pillow/executive-surface";
import { scrubMachineLanguage } from "@/lib/cockpit/executive/executive-presentation";
import { PillowVerificationStatus } from "./PillowVerificationStatus";

const PAGE_SIZE = 40;

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "0px";
  el.style.height = `${Math.min(Math.max(el.scrollHeight + 2, 44), 192)}px`;
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
  const followLatest = useRef(true);
  const earlierAnchor = useRef<{ height: number; top: number } | null>(null);
  const [showLatest, setShowLatest] = useState(false);
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

  useLayoutEffect(() => {
    const pane = historyRef.current;
    if (!pane) return;
    if (earlierAnchor.current) {
      pane.scrollTop = earlierAnchor.current.top + pane.scrollHeight - earlierAnchor.current.height;
      earlierAnchor.current = null;
    } else if (followLatest.current) {
      pane.scrollTop = pane.scrollHeight;
    }
  }, [conversation, windowSize, loading]);

  const goToLatest = () => {
    followLatest.current = true;
    setShowLatest(false);
    const pane = historyRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  };

  const hiddenCount = Math.max(0, conversation.length - windowSize);
  const visibleTurns = useMemo(
    () => conversation.slice(Math.max(0, conversation.length - windowSize)),
    [conversation, windowSize],
  );
  const screen = resolveCockpitScreenContext(pathname);

  const onSend = useCallback(() => {
    if (!canSend) return;
    followLatest.current = true;
    setShowLatest(false);
    void ask(queryDraft.trim());
  }, [ask, canSend, queryDraft]);

  return (
    <section
      id="pillow-conversation-workspace"
      data-testid="pillow-conversation-workspace"
      aria-label="Pillow conversation"
      className={`relative flex h-[min(85vh,920px)] min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-[#0a0a0a] lg:h-full lg:min-h-0 lg:flex-1 ${layout.workspace}`}
    >
      <header className={`flex shrink-0 items-center justify-between gap-3 border-b border-gold/10 px-5 py-3 ${layout.header}`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] lg:hidden">Conversation</p>
          <div className="flex items-center gap-4"><a href="/cockpit" aria-label="Back to Executive Home" className="rounded-lg px-2 py-1 text-sm text-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">← Back</a><h2 className="font-display text-xl text-[#f0d78c]">{title}</h2></div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] ${
              executiveReady
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            {executiveReady ? "Chat available" : scrubMachineLanguage(readinessLabel || "Starting")}
          </span>
          <span className="text-[10px] text-amber-200">NOT_BORN · Commerce locked</span>
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
      <details className={layout.context}>
        <summary className="cursor-pointer text-xs text-[#b6a987]">Status &amp; context · Reasoning evidence and owner acceptance ▸</summary>
        <div className={layout.contextBody}>
          {executiveSnapshot ? (
            <PillowContextPanel snapshot={executiveSnapshot} screenTitle={screen.screenTitle} />
          ) : (
            <p className="text-xs text-[#6f6a60]">
              Current screen context is unavailable. This is not evidence of current business state.
            </p>
          )}
          <PillowVerificationStatus />
          <p className="mt-2 text-xs text-[#8a847a]">The legacy command dashboard uses a dispatch endpoint denied in this locked runtime; it is not Pillow’s authoritative reasoning-context source. Retrying cannot unlock it.</p>
          <Link href="/cockpit/command" className="mt-2 block text-xs text-[#d4af37]">Open command dashboard</Link>
        </div>
      </details>

      </header>


      <div
        ref={historyRef}
        data-testid="pillow-message-history"
        tabIndex={0}
        aria-label="Saved Pillow conversation"
        onScroll={(event) => {
          const pane = event.currentTarget;
          const nearBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 96;
          followLatest.current = nearBottom;
          setShowLatest(!nearBottom);
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none] px-4 py-5 sm:px-6 lg:px-10 lg:py-8"
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
              onClick={() => {
                const pane = historyRef.current;
                if (pane) earlierAnchor.current = { height: pane.scrollHeight, top: pane.scrollTop };
                setWindowSize((n) => n + PAGE_SIZE);
              }}
            >
              Show earlier messages ({hiddenCount})
            </button>
          </div>
        )}

        <ul className="mx-auto flex max-w-3xl flex-col gap-4 lg:max-w-[56rem] lg:gap-6">
          {visibleTurns.map((turn) => {
            const mine = turn.role !== "pillow";
            return (
              <li
                key={turn.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`min-w-0 break-words max-w-[min(42rem,92%)] rounded-2xl px-4 py-3.5 sm:px-5 ${
                    mine
                      ? "bg-[#d4af37]/15 text-[#f0d78c] lg:max-w-[80%]"
                      : "border border-gold/10 bg-white/[0.03] text-[#e8e0d0] lg:w-full lg:max-w-full"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#b6a987]">
                    {mine ? "Grand King" : "Pillow"}
                  </p>
                  <div className="mt-2 text-[#e8e0d0]">
                    <details className="mb-3 text-xs text-[#8a847a]">
                      <summary className="cursor-pointer">Saved history · {turn.source === "server_persisted_transcript" ? "Server record" : "Unverified browser archive"}</summary>
                      <p className="mt-1 leading-relaxed">
                        {Number.isFinite(Date.parse(turn.recordedAt)) ? new Date(turn.recordedAt).toISOString() : "Date unknown"}
                        {turn.source === "server_persisted_transcript" ? " · Server-persisted conversation; historical, not current operational evidence." : " · Historical browser record; original source unverified, not current operational evidence."}
                      </p>
                    </details>
                    <ExecutiveChatMarkdown content={turn.content} />
                    {turn.role === "pillow" && <CopyPillowAnswer content={turn.content} />}
                  </div>
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

      {showLatest && (
        <div className={layout.jump}>
          <button type="button" onClick={goToLatest} className="px-4 py-2 text-xs text-[#d4af37]">Jump to latest</button>
        </div>
      )}

      <footer data-testid="pillow-composer-footer" className="shrink-0 border-t border-gold/10 bg-[#0a0a0a] px-4 py-3 sm:px-5">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 lg:max-w-[56rem] lg:gap-3"
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
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Message Pillow…"
            className="min-h-[44px] max-h-[192px] overflow-y-auto flex-1 resize-none rounded-xl border border-gold/20 bg-black/50 px-4 py-2 text-[15px] leading-relaxed text-[#e8e0d0] placeholder:text-[#6f6a60] focus:border-gold/40 focus:outline-none"
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
        <p className="mx-auto mt-2 hidden max-w-[56rem] text-xs text-[#8a847a] lg:block">Enter to send · Shift+Enter for a new line</p>
        <label className="mx-auto mt-2 flex max-w-3xl lg:max-w-[56rem] items-center gap-2 text-[10px] text-[#6f6a60]">
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
