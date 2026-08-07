"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import type { GlobalAssistantResponse } from "@/lib/cockpit/global-assistant/types";
import { speakPillowResponse, usePillowVoice } from "@/lib/cockpit/pillow/use-pillow-voice";
import {
  clampPillowFloatGeometry,
  defaultPillowFloatGeometry,
  loadPillowPanelPreferences,
  PILLOW_DOCK_WIDTH_MAX,
  PILLOW_DOCK_WIDTH_MIN,
  PILLOW_FLOAT_HEIGHT_MIN,
  PILLOW_FLOAT_WIDTH_MIN,
  resolvePillowViewMode,
  savePillowPanelPreferences,
  type PillowFloatGeometry,
  type PillowViewMode,
} from "@/lib/cockpit/pillow/pillow-session-store";
import { PillowContextPanel } from "@/components/cockpit/pillow/PillowContextPanel";
import { PillowProactiveGuidance } from "@/components/cockpit/pillow/PillowProactiveGuidance";
import { resolveCockpitScreenContext } from "@/lib/pillow-ux";

function confidenceLabel(confidence: GlobalAssistantResponse["confidence"]) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  if (confidence === "low") return "Low confidence";
  return "Unavailable";
}

function ResponseBlock({ response }: { response: GlobalAssistantResponse }) {
  return (
    <div className="space-y-2 text-[13px] leading-relaxed sm:text-[14px]">
      <p className="text-[#c8c0b0]">{response.interactionSummary}</p>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[#6f6a60]">Current Context</p>
        <p className="text-[#e8e0d0]">{response.currentContext}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[#6f6a60]">Reason</p>
        <p className="text-[#8a847a]">{response.reason}</p>
      </div>
      {response.supportingEvidence.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#6f6a60]">
            Supporting Evidence
          </p>
          <ul className="max-h-24 space-y-1 overflow-y-auto text-xs">
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
        <p className="text-[10px] uppercase tracking-wide text-[#6f6a60]">
          Recommended Next Action
        </p>
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
  icon: string;
}> = [
  { action: "summarise", label: "Summarise", icon: "≡" },
  { action: "explain", label: "Explain", icon: "?" },
  { action: "recommend", label: "Recommend", icon: "★" },
  { action: "next_action", label: "Next Action", icon: "→" },
];

const COMMON_PROMPTS = [
  "What requires my attention right now?",
  "Summarise this screen for executive decision.",
  "What is the highest-value next action?",
  "What risks should I know about?",
  "What can you help me with?",
] as const;

const NAV_SHORTCUTS: Array<{ label: string; href: string }> = [
  { label: "Executive Home", href: "/cockpit" },
  { label: "Alerts", href: "/cockpit#executive-alerts" },
  { label: "Missions", href: "/cockpit/missions" },
  { label: "Commerce", href: "/cockpit/commerce" },
];

const RECENT_PROMPTS_KEY = "empireai:pillow:recent-prompts:v1";
const MAX_RECENT_PROMPTS = 8;

function loadRecentPrompts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_PROMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_PROMPTS)
      : [];
  } catch {
    return [];
  }
}

function pushRecentPrompt(prompt: string): string[] {
  const next = [prompt, ...loadRecentPrompts().filter((item) => item !== prompt)].slice(
    0,
    MAX_RECENT_PROMPTS,
  );
  if (typeof window !== "undefined") {
    window.localStorage.setItem(RECENT_PROMPTS_KEY, JSON.stringify(next));
  }
  return next;
}

function isHelpRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/[?.!]+$/g, "");
  return (
    normalized === "what can you help me with" ||
    normalized === "what can you help with" ||
    normalized === "help" ||
    normalized === "commands"
  );
}

function runSuggestedPrompt(
  prompt: string,
  runAction: ReturnType<typeof useGlobalAiAssistant>["runAction"],
  ask: ReturnType<typeof useGlobalAiAssistant>["ask"],
): "help" | "ran" {
  if (isHelpRequest(prompt)) {
    return "help";
  }
  const lower = prompt.toLowerCase();
  if (lower.includes("summarise") || lower.includes("summarize")) {
    void runAction("summarise");
  } else if (lower.includes("recommend") || lower.includes("next action")) {
    void runAction("next_action");
  } else if (lower.includes("alert")) {
    void runAction("explain", { targetType: "alert", label: prompt });
  } else if (lower.includes("explain")) {
    void runAction("explain", { targetType: "page", label: prompt });
  } else {
    void ask(prompt);
  }
  return "ran";
}

type PaletteItem = {
  id: string;
  section: string;
  label: string;
  kind: "prompt" | "action" | "nav";
  prompt?: string;
  action?: (typeof ACTION_BUTTONS)[number]["action"];
  href?: string;
};

/** V1 Activation — Persistent Pillow operating shell (canonical AI interface). */
export function GlobalAiAssistantPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const isExecutiveHome = pathname === "/cockpit" || pathname === "/cockpit/";

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
    connectionError,
    executiveReady,
    readinessLabel,
    toggle,
    collapse,
    setQueryDraft,
    setPanelWidthPx,
    setVoiceEnabled,
    runAction,
    ask,
    executiveSnapshot,
    proactiveGuidance,
  } = useGlobalAiAssistant();
  // Typing is always allowed; Ask/Enter may attempt pipeline even during startup.
  const chatEnabled = !loading && Boolean(queryDraft.trim());

  const voice = usePillowVoice((transcript) => {
    void ask(transcript);
  });

  const hasConversation = conversation.length > 0;
  const hasUserMessage = conversation.some((turn) => turn.role === "grand-king");

  const [statusOpen, setStatusOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const initialPrefs = useMemo(() => loadPillowPanelPreferences(), []);
  const [viewMode, setViewMode] = useState<PillowViewMode>(() =>
    resolvePillowViewMode(initialPrefs),
  );
  const [previousViewMode, setPreviousViewMode] = useState<Exclude<PillowViewMode, "workspace">>(
    () => initialPrefs.previousViewMode ?? "dock",
  );
  const [floatGeometry, setFloatGeometry] = useState<PillowFloatGeometry>(
    () => initialPrefs.float ?? defaultPillowFloatGeometry(),
  );
  const [isNarrowViewport, setIsNarrowViewport] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth < 768 : false),
  );
  /** When true after a user message, show the fuller header instead of compact. */
  const [detailedHeaderRequested, setDetailedHeaderRequested] = useState(false);
  const [recentPrompts, setRecentPrompts] = useState<string[]>(() => loadRecentPrompts());
  const [paletteQuery, setPaletteQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef(0);
  const dragStateRef = useRef<{
    kind: "move" | "resize";
    startX: number;
    startY: number;
    origin: PillowFloatGeometry;
    edge?: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  } | null>(null);

  /** Effective mode — floating is impractical on narrow/mobile; fall back to workspace sheet. */
  const effectiveViewMode: PillowViewMode =
    viewMode === "float" && isNarrowViewport ? "workspace" : viewMode;

  const showCompactHeader = hasUserMessage && !detailedHeaderRequested;

  useEffect(() => {
    const onResize = () => {
      setIsNarrowViewport(window.innerWidth < 768);
      setFloatGeometry((prev) =>
        clampPillowFloatGeometry(prev, {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (voiceEnabled && lastResponse?.interactionSummary) {
      speakPillowResponse(lastResponse.interactionSummary);
    }
  }, [lastResponse, voiceEnabled]);

  // Persist preferred mode + float geometry (conversation/draft live in provider store).
  useEffect(() => {
    const prefs = loadPillowPanelPreferences();
    savePillowPanelPreferences({
      ...prefs,
      viewMode,
      workspaceMode: viewMode === "workspace",
      previousViewMode,
      float: floatGeometry,
    });
  }, [viewMode, previousViewMode, floatGeometry]);

  const rememberScroll = useCallback(() => {
    if (chatScrollRef.current) {
      savedScrollTopRef.current = chatScrollRef.current.scrollTop;
    }
  }, []);

  const restoreScroll = useCallback(() => {
    requestAnimationFrame(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = savedScrollTopRef.current;
      }
    });
  }, []);

  const setViewModePreservingState = useCallback(
    (next: PillowViewMode) => {
      rememberScroll();
      if (viewMode !== "workspace" && next === "workspace") {
        setPreviousViewMode(viewMode);
      }
      setViewMode(next);
      restoreScroll();
    },
    [rememberScroll, restoreScroll, viewMode],
  );

  const collapseWorkspace = useCallback(() => {
    setViewModePreservingState(previousViewMode === "float" ? "float" : "dock");
  }, [previousViewMode, setViewModePreservingState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.length, loading]);

  const openPalette = useCallback(() => {
    setPaletteQuery("");
    setPaletteOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    setPaletteQuery("");
  }, []);

  const submitAsk = useCallback(
    (raw: string) => {
      if (!executiveReady) return;
      const text = raw.trim();
      if (!text) return;
      if (isHelpRequest(text)) {
        setQueryDraft("");
        openPalette();
        return;
      }
      setPaletteOpen(false);
      setRecentPrompts(pushRecentPrompt(text));
      void ask(text);
    },
    [ask, executiveReady, openPalette, setQueryDraft],
  );

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const typingInField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        if (paletteOpen) {
          event.preventDefault();
          closePalette();
          return;
        }
        if (infoOpen) {
          event.preventDefault();
          setInfoOpen(false);
          return;
        }
        if (effectiveViewMode === "workspace") {
          event.preventDefault();
          collapseWorkspace();
          return;
        }
        if (effectiveViewMode === "float") {
          event.preventDefault();
          setViewModePreservingState("dock");
          return;
        }
      }

      if (meta && key === " ") {
        event.preventDefault();
        if (paletteOpen) closePalette();
        else openPalette();
        return;
      }

      if (!typingInField && event.key === "/") {
        event.preventDefault();
        openPalette();
        return;
      }

      if (meta && event.shiftKey && key === "m") {
        event.preventDefault();
        if (effectiveViewMode === "workspace") collapseWorkspace();
        else setViewModePreservingState("workspace");
      }

      if (meta && event.shiftKey && key === "d") {
        event.preventDefault();
        setViewModePreservingState("dock");
      }

      if (meta && event.shiftKey && key === "f") {
        event.preventDefault();
        setViewModePreservingState(isNarrowViewport ? "workspace" : "float");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    expanded,
    paletteOpen,
    infoOpen,
    effectiveViewMode,
    isNarrowViewport,
    openPalette,
    closePalette,
    collapseWorkspace,
    setViewModePreservingState,
  ]);

  const executive = context?.executiveContext;
  const suggestedPrompts = useMemo(
    () => context?.suggestedPrompts ?? [],
    [context?.suggestedPrompts],
  );
  const showEmptySuggestions =
    !loading && !hasConversation && !paletteOpen && suggestedPrompts.length > 0;

  const visibleTurns = useMemo(
    () => (conversation.length > 100 ? conversation.slice(-100) : conversation),
    [conversation],
  );

  const paletteItems = useMemo((): PaletteItem[] => {
    const items: PaletteItem[] = [];
    for (const prompt of suggestedPrompts) {
      items.push({
        id: `suggested-${prompt}`,
        section: "Suggested",
        label: prompt,
        kind: "prompt",
        prompt,
      });
    }
    for (const prompt of COMMON_PROMPTS) {
      items.push({
        id: `common-${prompt}`,
        section: "Common prompts",
        label: prompt,
        kind: "prompt",
        prompt,
      });
    }
    for (const nav of NAV_SHORTCUTS) {
      items.push({
        id: `nav-${nav.href}`,
        section: "Navigation",
        label: nav.label,
        kind: "nav",
        href: nav.href,
      });
    }
    for (const prompt of recentPrompts) {
      items.push({
        id: `recent-${prompt}`,
        section: "Recent prompts",
        label: prompt,
        kind: "prompt",
        prompt,
      });
    }
    for (const tool of ACTION_BUTTONS) {
      items.push({
        id: `tool-${tool.action}`,
        section: "Quick executive tools",
        label: `${tool.label}`,
        kind: "action",
        action: tool.action,
      });
    }
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.section.toLowerCase().includes(q),
    );
  }, [suggestedPrompts, recentPrompts, paletteQuery]);

  const paletteSections = useMemo(() => {
    const order = [
      "Suggested",
      "Common prompts",
      "Navigation",
      "Recent prompts",
      "Quick executive tools",
    ];
    return order
      .map((section) => ({
        section,
        items: paletteItems.filter((item) => item.section === section),
      }))
      .filter((group) => group.items.length > 0);
  }, [paletteItems]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(160, Math.max(44, el.scrollHeight));
    el.style.height = `${next}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [queryDraft, resizeTextarea, expanded, effectiveViewMode]);

  const beginFloatDrag = useCallback(
    (
      event: ReactPointerEvent,
      kind: "move" | "resize",
      edge?: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw",
    ) => {
      if (effectiveViewMode !== "float") return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      dragStateRef.current = {
        kind,
        startX: event.clientX,
        startY: event.clientY,
        origin: floatGeometry,
        edge,
      };
    },
    [effectiveViewMode, floatGeometry],
  );

  useEffect(() => {
    if (effectiveViewMode !== "float") return;

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const viewport = { width: window.innerWidth, height: window.innerHeight };

      if (drag.kind === "move") {
        setFloatGeometry(
          clampPillowFloatGeometry(
            {
              ...drag.origin,
              x: drag.origin.x + dx,
              y: drag.origin.y + dy,
            },
            viewport,
          ),
        );
        return;
      }

      let { x, y, width, height } = drag.origin;
      const edge = drag.edge ?? "se";
      if (edge.includes("e")) width = drag.origin.width + dx;
      if (edge.includes("s")) height = drag.origin.height + dy;
      if (edge.includes("w")) {
        width = drag.origin.width - dx;
        x = drag.origin.x + dx;
      }
      if (edge.includes("n")) {
        height = drag.origin.height - dy;
        y = drag.origin.y + dy;
      }
      width = Math.max(PILLOW_FLOAT_WIDTH_MIN, width);
      height = Math.max(PILLOW_FLOAT_HEIGHT_MIN, height);
      setFloatGeometry(clampPillowFloatGeometry({ x, y, width, height }, viewport));
    };

    const onPointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [effectiveViewMode]);

  const onComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "/" && queryDraft.trim() === "") {
      event.preventDefault();
      openPalette();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!chatEnabled) return;
      submitAsk(queryDraft);
    }
  };

  const selectPaletteItem = (item: PaletteItem) => {
    if (item.kind === "nav" && item.href) {
      closePalette();
      router.push(item.href);
      return;
    }
    if (item.kind === "action" && item.action) {
      closePalette();
      void runAction(
        item.action,
        item.action === "explain"
          ? { targetType: "page", label: "Explain this page" }
          : undefined,
      );
      return;
    }
    if (item.prompt) {
      if (isHelpRequest(item.prompt)) {
        setPaletteQuery("");
        setPaletteOpen(true);
        return;
      }
      closePalette();
      setRecentPrompts(pushRecentPrompt(item.prompt));
      runSuggestedPrompt(item.prompt, runAction, ask);
    }
  };

  if (isExecutiveHome) {
    return null;
  }

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

  const dockWidth = Math.max(
    PILLOW_DOCK_WIDTH_MIN,
    Math.min(PILLOW_DOCK_WIDTH_MAX, panelWidthPx),
  );

  const shellClass =
    effectiveViewMode === "workspace"
      ? "fixed inset-[1.5dvh_1.5vw] z-40 flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-[#0a0a0a]/98 shadow-2xl backdrop-blur-xl sm:inset-[2dvh_2vw]"
      : effectiveViewMode === "float"
        ? "fixed z-40 flex flex-col overflow-hidden rounded-xl border border-gold/20 bg-[#0a0a0a]/98 shadow-2xl backdrop-blur-xl"
        : "fixed bottom-0 right-0 z-40 flex h-[calc(100dvh-0.25rem)] flex-col overflow-hidden border-l border-t border-gold/15 bg-[#0a0a0a]/98 shadow-2xl backdrop-blur-xl lg:bottom-2.5 lg:right-2.5 lg:h-[calc(100dvh-1.25rem)] lg:rounded-xl lg:border";

  const shellStyle =
    effectiveViewMode === "workspace"
      ? { width: "auto", maxWidth: "none" as const }
      : effectiveViewMode === "float"
        ? {
            left: floatGeometry.x,
            top: floatGeometry.y,
            width: floatGeometry.width,
            height: floatGeometry.height,
            maxWidth: "none" as const,
          }
        : { width: "100%", maxWidth: `${dockWidth}px` };

  const readingWidthClass =
    effectiveViewMode === "workspace"
      ? "mx-auto w-full max-w-[48rem] px-4 sm:px-6"
      : effectiveViewMode === "float"
        ? "px-3 sm:px-3.5"
        : "px-3 sm:px-3.5";

  const pageLabel = executive?.screenTitle ?? "Cockpit";
  const missionCount = executive?.activeMissionCount ?? 0;
  const alertCount = executive?.alertCount ?? 0;
  const connectionStatus = !executiveReady
    ? readinessLabel
    : loading
      ? "Working"
      : "Ready";

  const modeButtonClass = (active: boolean) =>
    `rounded px-1.5 py-0.5 text-[10px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[#d4af37] ${
      active
        ? "bg-gold/15 text-[#f0d78c]"
        : "text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c]"
    }`;

  const renderModeControls = () => (
    <div className="flex shrink-0 items-center gap-0.5" role="toolbar" aria-label="Pillow view mode">
      <button
        type="button"
        className={modeButtonClass(effectiveViewMode === "dock")}
        onClick={() => setViewModePreservingState("dock")}
        aria-label="Dock mode"
        title="Dock — right-side panel (Ctrl/⌘+Shift+D)"
        aria-pressed={effectiveViewMode === "dock"}
      >
        Dock
      </button>
      <button
        type="button"
        className={modeButtonClass(viewMode === "float")}
        onClick={() => setViewModePreservingState(isNarrowViewport ? "workspace" : "float")}
        aria-label={isNarrowViewport ? "Float unavailable on mobile — opens workspace" : "Float mode"}
        title={
          isNarrowViewport
            ? "Float becomes full workspace on narrow screens"
            : "Float — draggable window (Ctrl/⌘+Shift+F)"
        }
        aria-pressed={viewMode === "float"}
      >
        Float
      </button>
      <button
        type="button"
        className={modeButtonClass(effectiveViewMode === "workspace")}
        onClick={() =>
          effectiveViewMode === "workspace"
            ? collapseWorkspace()
            : setViewModePreservingState("workspace")
        }
        aria-label={
          effectiveViewMode === "workspace" ? "Collapse workspace" : "Expand to full workspace"
        }
        title={
          effectiveViewMode === "workspace"
            ? "Collapse to previous mode (Esc)"
            : "Expand — full workspace (Ctrl/⌘+Shift+M)"
        }
        aria-pressed={effectiveViewMode === "workspace"}
      >
        {effectiveViewMode === "workspace" ? "Collapse" : "Expand"}
      </button>
      <button
        type="button"
        className="rounded px-1.5 py-0.5 text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[#d4af37]"
        onClick={collapse}
        aria-label="Close Pillow"
        title="Close Pillow"
      >
        Close
      </button>
    </div>
  );

  return (
    <aside
      className={shellClass}
      style={shellStyle}
      data-pillow-mode={effectiveViewMode}
      aria-label="Pillow operating shell"
    >
      {/* Smart header — fuller empty state; compact after first user message */}
      <header
        className={`shrink-0 border-b border-gold/10 ${
          effectiveViewMode === "float" ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onPointerDown={
          effectiveViewMode === "float"
            ? (event) => {
                const target = event.target as HTMLElement;
                if (target.closest("button, a, input, textarea, select, summary")) return;
                beginFloatDrag(event, "move");
              }
            : undefined
        }
      >
        {showCompactHeader ? (
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5">
            <p className="min-w-0 flex-1 truncate text-[11px] text-[#c8c0b0]">
              <span className="font-medium text-[#f0d78c]">Pillow</span>
              <span className="text-[#6f6a60]"> · </span>
              <span className="text-[#8a847a]">{pageLabel}</span>
              <span className="text-[#6f6a60]"> · </span>
              <span
                className={
                  !executiveReady ? "text-amber-200" : "text-emerald-200/90"
                }
              >
                {connectionStatus}
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className={modeButtonClass(false)}
                onClick={() => setDetailedHeaderRequested(true)}
                aria-expanded={false}
                title="Show detailed header"
                aria-label="Show detailed header"
              >
                Details
              </button>
              <button
                type="button"
                className={modeButtonClass(infoOpen)}
                onClick={() => {
                  setInfoOpen((value) => !value);
                  if (!infoOpen) setStatusOpen(true);
                }}
                aria-expanded={infoOpen}
                title="Info and status details"
                aria-label="Open info and status"
              >
                Info
              </button>
              {renderModeControls()}
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 sm:px-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#f0d78c] sm:text-[14px]">
                  Pillow
                  <span className="font-normal text-[#6f6a60]"> · </span>
                  <span className="font-normal text-[#c8c0b0]">{pageLabel}</span>
                  <span className="font-normal text-[#6f6a60]"> · </span>
                  <span
                    className={`font-normal ${
                      !executiveReady ? "text-amber-200" : "text-emerald-200/90"
                    }`}
                  >
                    {connectionStatus}
                  </span>
                </p>
                {!hasUserMessage && (
                  <p className="mt-0.5 text-[10px] text-[#6f6a60]">
                    Executive assistant · conversation first
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {hasUserMessage && (
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-[10px] text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[#d4af37]"
                    onClick={() => setDetailedHeaderRequested(false)}
                    aria-expanded
                    title="Use compact header"
                  >
                    Compact
                  </button>
                )}
                <button
                  type="button"
                  className={modeButtonClass(infoOpen || statusOpen)}
                  onClick={() => {
                    setInfoOpen((value) => !value);
                    setStatusOpen((value) => !value);
                  }}
                  aria-expanded={infoOpen || statusOpen}
                  title="Info and status details"
                  aria-label="Open info and status"
                >
                  Info
                </button>
                {renderModeControls()}
              </div>
            </div>
          </div>
        )}
      </header>

      {(infoOpen || statusOpen) && (
        <div className="shrink-0 max-h-[26dvh] space-y-2 overflow-y-auto border-b border-gold/10 px-3 py-2 sm:px-3.5">
          <div className="flex flex-wrap items-center gap-1 text-[10px]">
            <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
              {missionCount} missions
            </span>
            <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a]">
              {alertCount} alerts
            </span>
            {executive?.engineCenterName && (
              <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#c8c0b0]">
                {executive.engineCenterName}
              </span>
            )}
            <span className="rounded border border-gold/10 px-1.5 py-0.5 text-[#6f6a60]">
              Mode: {effectiveViewMode}
              {viewMode === "float" && isNarrowViewport ? " (mobile sheet)" : ""}
            </span>
            {executive?.topAlertLabel && (
              <Link
                href="/cockpit#executive-alerts"
                className="truncate text-[#8a847a] hover:text-[#d4af37]"
              >
                Alert: {executive.topAlertLabel.slice(0, 36)}…
              </Link>
            )}
            <button
              type="button"
              className="ml-auto rounded border border-gold/10 px-1.5 py-0.5 text-[#8a847a] hover:border-gold/25 hover:text-[#f0d78c]"
              onClick={() => {
                setInfoOpen(false);
                setStatusOpen(false);
              }}
            >
              Hide info
            </button>
          </div>
          {executiveSnapshot && (
            <PillowContextPanel
              snapshot={executiveSnapshot}
              screenTitle={resolveCockpitScreenContext(pathname).screenTitle}
            />
          )}
          {executiveReady && proactiveGuidance.length > 0 && (
            <PillowProactiveGuidance
              items={proactiveGuidance}
              onAsk={(prompt) => void ask(prompt)}
            />
          )}
        </div>
      )}

      {/* Conversation — absolute priority for remaining height; single scroll plane */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={chatScrollRef}
          className={`min-h-0 flex-1 overflow-y-auto py-2 ${readingWidthClass}`}
        >
          {!executiveReady && (
            <p className="mb-2 rounded border border-gold/20 bg-gold/5 px-2 py-1.5 text-xs text-[#f0d78c]">
              {readinessLabel || connectionError || "Preparing Executive Intelligence…"}
            </p>
          )}

          {hasConversation ? (
            <ul className="space-y-2.5 text-[13.5px] leading-[1.55] sm:text-[15px] sm:leading-relaxed">
              {visibleTurns.map((turn) => (
                <li
                  key={turn.id}
                  className={`px-0.5 py-1 ${
                    turn.role === "pillow" ? "text-[#d8d0c0]" : "text-[#f0d78c]"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide text-[#6f6a60]">
                    {turn.role === "pillow" ? "Pillow" : "Grand King"}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap">{turn.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-full flex-col justify-center space-y-3 py-6 text-[13.5px] leading-relaxed sm:text-[15px]">
              {!loading && context && (
                <>
                  <p className="text-[#8a847a]">{context.pageInsightSummary}</p>
                  {executive?.nextExecutiveAction && (
                    <p className="text-xs text-[#d4af37]">
                      Next: {executive.nextExecutiveAction}
                    </p>
                  )}
                  <p className="text-[11px] text-[#6f6a60]">
                    Press <kbd className="text-[#8a847a]">/</kbd> or{" "}
                    <kbd className="text-[#8a847a]">Ctrl/⌘ Space</kbd> for commands ·{" "}
                    <kbd className="text-[#8a847a]">+</kbd> opens palette
                  </p>
                </>
              )}
              {showEmptySuggestions && (
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wide text-[#6f6a60]">
                    Suggested
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="rounded-full border border-gold/15 px-2.5 py-1 text-[11px] text-[#c8c0b0] hover:border-gold/30"
                        onClick={() => {
                          if (runSuggestedPrompt(prompt, runAction, ask) === "help") {
                            openPalette();
                            return;
                          }
                          setRecentPrompts(pushRecentPrompt(prompt));
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <p className="mt-3 text-sm text-[#8a847a]">
              Pillow assembling live context from Brain…
            </p>
          )}

          {!loading && activeTarget && (
            <p className="mt-2 text-xs text-[#8a847a]">Target: {activeTarget.label}</p>
          )}

          {!loading && lastResponse && hasConversation && (
            <details className="mt-3 rounded-lg border border-gold/10 bg-black/20">
              <summary className="cursor-pointer px-3 py-1.5 text-[10px] uppercase tracking-wide text-[#6f6a60] hover:text-[#c8c0b0]">
                Structured brief
              </summary>
              <div className="border-t border-gold/10 px-3 py-2.5">
                <ResponseBlock response={lastResponse} />
              </div>
            </details>
          )}

          {!loading && lastResponse && !hasConversation && (
            <div className="mt-3 border-t border-gold/10 pt-3">
              <ResponseBlock response={lastResponse} />
            </div>
          )}

          {!loading && lastResponse && lastResponse.suggestedFollowUps.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-[#d4af37]">
              {lastResponse.suggestedFollowUps.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    className="rounded-full border border-gold/15 px-2 py-0.5 hover:border-gold/30"
                    onClick={() => submitAsk(f)}
                  >
                    → {f}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Anchored composer */}
      <footer className="relative shrink-0 border-t border-gold/10 bg-[#0a0a0a]/95">
        {paletteOpen && (
          <div
            className="absolute bottom-full left-0 right-0 z-20 mb-0 max-h-[min(48dvh,420px)] overflow-hidden rounded-t-xl border border-b-0 border-gold/15 bg-[#0c0c0c]/98 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-label="Executive Command Palette"
          >
            <div className="flex items-center gap-2 border-b border-gold/10 px-3 py-2">
              <span className="text-[10px] uppercase tracking-wide text-[#6f6a60]">Commands</span>
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Filter actions, prompts, navigation…"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#e8e0d0] placeholder:text-[#6f6a60] focus:outline-none"
                aria-label="Filter command palette"
              />
              <button
                type="button"
                className="text-[10px] text-[#8a847a] hover:text-[#f0d78c]"
                onClick={closePalette}
              >
                Esc
              </button>
            </div>
            <div className="max-h-[min(40dvh,360px)] overflow-y-auto px-2 py-2">
              {paletteSections.length === 0 ? (
                <p className="px-2 py-3 text-xs text-[#6f6a60]">No matching commands.</p>
              ) : (
                paletteSections.map((group) => (
                  <div key={group.section} className="mb-2">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-[#6f6a60]">
                      {group.section}
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[12px] text-[#c8c0b0] hover:bg-white/[0.04] hover:text-[#f0d78c]"
                            onClick={() => selectPaletteItem(item)}
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className={`py-1.5 ${readingWidthClass}`}>
          {/* Compact command toolbar */}
          <div className="mb-1 flex items-center gap-0.5 overflow-x-auto">
            {ACTION_BUTTONS.map(({ action, label, icon }) => (
              <button
                key={action}
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c]"
                onClick={() =>
                  void runAction(
                    action,
                    action === "explain"
                      ? { targetType: "page", label: "Explain this page" }
                      : undefined,
                  )
                }
              >
                <span aria-hidden className="text-[#d4af37]/80">
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            ))}
            <button
              type="button"
              className="ml-auto inline-flex shrink-0 items-center justify-center rounded border border-gold/15 px-2 py-0.5 text-[12px] text-[#d4af37] hover:border-gold/30"
              onClick={() => (paletteOpen ? closePalette() : openPalette())}
              aria-expanded={paletteOpen}
              aria-label="Open command palette"
              title="Command palette (+ · / · Ctrl/⌘ Space)"
            >
              +
            </button>
          </div>

          <form
            className="flex items-end gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatEnabled) return;
              submitAsk(queryDraft);
            }}
          >
            <textarea
              ref={textareaRef}
              id="pillow-query"
              aria-label="Ask Pillow"
              rows={1}
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              onKeyDown={onComposerKeyDown}
              autoComplete="off"
              spellCheck
              placeholder="Ask Pillow… (Enter send · Shift+Enter newline · / commands)"
              className="min-h-[44px] max-h-40 min-w-0 flex-1 resize-none rounded-lg border border-gold/15 bg-black/40 px-3 py-2.5 text-sm leading-snug text-[#e8e0d0] placeholder:text-[#6f6a60] focus:border-gold/30 focus:outline-none"
            />
            {voice.supported && (
              <button
                type="button"
                aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
                onClick={voice.toggle}
                className={`shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium ${
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
              disabled={!chatEnabled}
              title={loading ? "Preparing response…" : "Ask Pillow"}
              className="shrink-0 rounded-lg bg-gold/15 px-3 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/25 disabled:opacity-50"
            >
              Ask
            </button>
          </form>

          {effectiveViewMode === "dock" && (
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[#6f6a60]">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                />
                Spoken
              </label>
              <label className="flex items-center gap-1.5">
                <span className="hidden sm:inline">Width</span>
                <input
                  type="range"
                  min={PILLOW_DOCK_WIDTH_MIN}
                  max={PILLOW_DOCK_WIDTH_MAX}
                  value={dockWidth}
                  onChange={(e) => setPanelWidthPx(Number(e.target.value))}
                  aria-label="Pillow dock width"
                  className="w-24 sm:w-32"
                />
              </label>
            </div>
          )}
          {effectiveViewMode === "workspace" && (
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[#6f6a60]">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                />
                Spoken
              </label>
              <span>Workspace · Esc or Collapse returns to {previousViewMode}</span>
            </div>
          )}
          {effectiveViewMode === "float" && (
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[#6f6a60]">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                />
                Spoken
              </label>
              <span>Floating · drag header · resize edges · Esc docks</span>
            </div>
          )}
        </div>
      </footer>

      {effectiveViewMode === "float" && (
        <>
          {(
            [
              ["n", "top-0 left-3 right-3 h-1.5 cursor-n-resize"],
              ["s", "bottom-0 left-3 right-3 h-1.5 cursor-s-resize"],
              ["e", "right-0 top-3 bottom-3 w-1.5 cursor-e-resize"],
              ["w", "left-0 top-3 bottom-3 w-1.5 cursor-w-resize"],
              ["ne", "right-0 top-0 h-3 w-3 cursor-ne-resize"],
              ["nw", "left-0 top-0 h-3 w-3 cursor-nw-resize"],
              ["se", "right-0 bottom-0 h-3 w-3 cursor-se-resize"],
              ["sw", "left-0 bottom-0 h-3 w-3 cursor-sw-resize"],
            ] as const
          ).map(([edge, className]) => (
            <div
              key={edge}
              role="separator"
              aria-label={`Resize ${edge}`}
              title={`Resize ${edge}`}
              className={`absolute z-30 ${className}`}
              onPointerDown={(event) => beginFloatDrag(event, "resize", edge)}
            />
          ))}
        </>
      )}
    </aside>
  );
}
