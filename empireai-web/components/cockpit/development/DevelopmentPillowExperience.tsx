"use client";

import { useEffect, useRef, useState } from "react";
import { PlatformPageHeader, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DevelopmentPillowPanel } from "@/components/cockpit/widgets/DevelopmentPanels";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";

const TABS = [
  { id: "chat", label: "Conversation" },
  { id: "supervisor", label: "Supervisor" },
] as const;

type PillowTab = (typeof TABS)[number]["id"];

function focusPillowQuery(): boolean {
  const input = document.getElementById("pillow-query");
  if (!(input instanceof HTMLInputElement)) return false;
  input.focus();
  return true;
}

/** SCR-800 — Live Pillow conversation (primary) with supervisor engine center secondary. */
export function DevelopmentPillowExperience() {
  const {
    expand,
    ensureHostSession,
    conversation,
    pillowConnected,
    hostSessionId,
    loading,
    context,
    lastResponse,
    connectionError,
  } = useGlobalAiAssistant();
  const [activeTab, setActiveTab] = useState<PillowTab>("chat");
  const activatedRef = useRef(false);

  useEffect(() => {
    if (activatedRef.current) return;
    activatedRef.current = true;

    expand();
    void ensureHostSession();

    let attempts = 0;
    const tryFocus = () => {
      if (focusPillowQuery() || attempts >= 16) return;
      attempts += 1;
      requestAnimationFrame(tryFocus);
    };
    requestAnimationFrame(tryFocus);
  }, [expand, ensureHostSession]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    let attempts = 0;
    const tryFocus = () => {
      if (focusPillowQuery() || attempts >= 8) return;
      attempts += 1;
      requestAnimationFrame(tryFocus);
    };
    requestAnimationFrame(tryFocus);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        eyebrow="Development · SCR-800"
        title="Pillow Chat"
        description="Talk to Pillow about the cockpit, missions, and executive context. The conversation panel opens automatically — type below or in the Pillow panel."
      />

      <div className="flex flex-wrap gap-2 border-b border-gold/10 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gold/10 text-[#f0d78c]"
                : "text-[#6f6a60] hover:text-[#a8a095]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "chat" ? (
        <div className="space-y-4">
          <Panel title="Pillow session">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  pillowConnected
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-amber-500/15 text-amber-200"
                }`}
              >
                {pillowConnected ? "Connected" : "Connecting…"}
              </span>
              {hostSessionId && (
                <span className="text-xs text-[#6f6a60]">
                  Session {hostSessionId.slice(0, 8)}…
                </span>
              )}
              {connectionError && (
                <p className="w-full text-xs text-amber-200">{connectionError}</p>
              )}
            </div>
          </Panel>

          <Panel title="Conversation">
            {loading && (
              <p className="text-sm text-[#8a847a]">Pillow is assembling live context…</p>
            )}
            {!loading && conversation.length === 0 && !lastResponse && (
              <p className="text-sm text-[#8a847a]">
                {context?.pageInsightSummary ??
                  "Ask Pillow anything about this screen — the input is focused and ready."}
              </p>
            )}
            {conversation.length > 0 && (
              <ul className="max-h-[min(50vh,420px)] space-y-3 overflow-y-auto">
                {conversation.map((turn) => (
                  <li
                    key={turn.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      turn.role === "pillow"
                        ? "border border-gold/10 bg-white/[0.02] text-[#c8c0b0]"
                        : "text-[#d4af37]"
                    }`}
                  >
                    <span className="text-[10px] uppercase text-[#6f6a60]">
                      {turn.role === "pillow" ? "Pillow" : "Grand King"}
                    </span>
                    <p className="mt-1">{turn.content}</p>
                  </li>
                ))}
              </ul>
            )}
            {!loading && lastResponse && conversation.length === 0 && (
              <p className="text-sm text-[#c8c0b0]">{lastResponse.interactionSummary}</p>
            )}
          </Panel>
        </div>
      ) : (
        <DevelopmentPillowPanel />
      )}
    </div>
  );
}
