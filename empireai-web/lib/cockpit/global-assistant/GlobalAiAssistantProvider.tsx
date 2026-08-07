"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { brainDispatch } from "@/lib/brain/client";
import type {
  GlobalAssistantAction,
  GlobalAssistantContext,
  GlobalAssistantResponse,
  GlobalAssistantTarget,
} from "@/lib/cockpit/global-assistant/types";
import {
  appendPillowTurn,
  clearPillowHostSession,
  loadPillowPanelPreferences,
  loadPillowSession,
  savePillowPanelPreferences,
  savePillowSession,
  type PillowConversationTurn,
  type PillowSessionSnapshot,
} from "@/lib/cockpit/pillow/pillow-session-store";
import { createPillowHostSession, fetchPillowHistory, sendPillowChat } from "@/lib/pillow/client";
import { mapPillowChatToAssistantResponse } from "@/lib/pillow/map-response";
import type { PillowChatArtifact } from "@/lib/pillow/types";
import {
  EXECUTIVE_NOT_READY_REPLY,
  EXECUTIVE_PIPELINE_SOFT_REPLY,
  EXECUTIVE_RECOVERING_LABEL,
  EXECUTIVE_STARTING_LABEL,
  readinessLabel as formatReadinessLabel,
  toExecutiveChatMessage,
  toExecutiveSurfaceMessage,
  type ExecutiveReadinessPhase,
} from "@/lib/pillow/executive-surface";
import {
  buildExecutiveContextSnapshot,
  buildPillowActionPrompt,
  buildPillowWorkspaceContext,
  buildProactiveGuidance,
  resolveCockpitScreenContext,
  type PillowExecutiveContextSnapshot,
  type PillowGuidanceItem,
  type PillowPageContextOverride,
  type PillowWorkspaceContext,
} from "@/lib/pillow-ux";
import { useFounderShellOptional } from "@/lib/founder-shell/FounderShellProvider";
import { useAuth } from "@/lib/auth/context";

type GlobalAiAssistantState = {
  expanded: boolean;
  panelWidthPx: number;
  voiceEnabled: boolean;
  loading: boolean;
  context: GlobalAssistantContext | null;
  lastResponse: GlobalAssistantResponse | null;
  activeTarget: GlobalAssistantTarget | null;
  queryDraft: string;
  conversation: PillowConversationTurn[];
  hostSessionId: string | null;
  pillowConnected: boolean;
  /** True only when Pillow session is ready for Grand King conversation. */
  executiveReady: boolean;
  readinessPhase: ExecutiveReadinessPhase;
  readinessLabel: string;
  connectionError: string | null;
  pageOverride: PillowPageContextOverride | null;
  executiveSnapshot: PillowExecutiveContextSnapshot | null;
  proactiveGuidance: PillowGuidanceItem[];
  workspaceContext: PillowWorkspaceContext | null;
};

type GlobalAiAssistantContextValue = GlobalAiAssistantState & {
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  ensureHostSession: () => Promise<string | null>;
  setQueryDraft: (query: string) => void;
  setPanelWidthPx: (widthPx: number) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setPageOverride: (override: PillowPageContextOverride | null) => void;
  refreshContext: () => Promise<void>;
  runAction: (
    action: GlobalAssistantAction,
    target?: GlobalAssistantTarget,
    query?: string,
  ) => Promise<void>;
  ask: (query: string, target?: GlobalAssistantTarget) => Promise<void>;
  explain: (label: string, targetId?: string, value?: string) => void;
  recommend: () => void;
  summarise: () => void;
  nextAction: () => void;
};

const GlobalAiAssistantContext = createContext<GlobalAiAssistantContextValue | null>(null);

export function GlobalAiAssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const founderShell = useFounderShellOptional();
  const panelPrefs = loadPillowPanelPreferences();
  const savedSession = loadPillowSession();
  const hostSessionInit = useRef(false);
  const recoveryLoopActive = useRef(false);
  const navHistoryRef = useRef<string[]>([pathname]);

  const [state, setState] = useState<GlobalAiAssistantState>({
    expanded: panelPrefs.expanded,
    panelWidthPx: panelPrefs.widthPx,
    voiceEnabled: panelPrefs.voiceEnabled,
    loading: false,
    context: null,
    lastResponse: null,
    activeTarget: null,
    queryDraft: "",
    conversation: savedSession?.turns ?? [],
    hostSessionId: savedSession?.hostSessionId ?? null,
    pillowConnected: false,
    executiveReady: false,
    readinessPhase: "starting",
    readinessLabel: EXECUTIVE_STARTING_LABEL,
    connectionError: null,
    pageOverride: null,
    executiveSnapshot: null,
    proactiveGuidance: [],
    workspaceContext: null,
  });

  const markReady = useCallback((hostSessionId: string, conversation?: PillowConversationTurn[]) => {
    setState((s) => ({
      ...s,
      hostSessionId,
      pillowConnected: true,
      executiveReady: true,
      readinessPhase: "ready",
      readinessLabel: formatReadinessLabel("ready"),
      connectionError: null,
      ...(conversation ? { conversation } : {}),
    }));
  }, []);

  const markStarting = useCallback((phase: ExecutiveReadinessPhase = "starting", error?: string | null) => {
    const surface = error ? toExecutiveSurfaceMessage(error) : formatReadinessLabel(phase);
    setState((s) => ({
      ...s,
      pillowConnected: false,
      executiveReady: false,
      readinessPhase: phase,
      readinessLabel: surface,
      connectionError: surface,
    }));
  }, []);

  useEffect(() => {
    const history = navHistoryRef.current;
    if (history[history.length - 1] !== pathname) {
      navHistoryRef.current = [...history, pathname].slice(-20);
    }
  }, [pathname]);

  useEffect(() => {
    savePillowPanelPreferences({
      expanded: state.expanded,
      widthPx: state.panelWidthPx,
      voiceEnabled: state.voiceEnabled,
    });
  }, [state.expanded, state.panelWidthPx, state.voiceEnabled]);

  const buildWorkspaceContext = useCallback(
    (
      brainContext: GlobalAssistantContext | null,
      pageOverride: PillowPageContextOverride | null,
    ): PillowWorkspaceContext => {
      const snapshot = buildExecutiveContextSnapshot({
        founderShell: founderShell?.data ?? null,
        brainContext,
        pendingApprovals: brainContext?.executiveContext?.activeMissionCount,
        nextExecutiveAction: brainContext?.executiveContext?.nextExecutiveAction ?? null,
      });

      return buildPillowWorkspaceContext({
        screenPath: pathname,
        navigationHistory: navHistoryRef.current,
        pageOverride,
        executive: {
          currentBusiness: snapshot.currentBusiness,
          currentMission: snapshot.currentMission,
          currentJourney: snapshot.currentJourney,
          currentRoadmapItem: snapshot.currentRoadmapItem,
          builderStatus: snapshot.builderStatus,
          supervisorStatus: snapshot.supervisorStatus,
          productionStatus: snapshot.productionStatus,
          guardianStatus: snapshot.guardianStatus,
          pendingApprovals: snapshot.pendingApprovals,
          unreadNotifications: snapshot.alertCount,
          recommendations: snapshot.recommendations,
          risks: snapshot.risks,
        },
      });
    },
    [founderShell?.data, pathname],
  );

  const syncExecutiveAwareness = useCallback(
    (brainContext: GlobalAssistantContext | null, pageOverride: PillowPageContextOverride | null) => {
      const snapshot = buildExecutiveContextSnapshot({
        founderShell: founderShell?.data ?? null,
        brainContext,
        pendingApprovals: brainContext?.executiveContext?.activeMissionCount,
        nextExecutiveAction: brainContext?.executiveContext?.nextExecutiveAction ?? null,
      });
      const guidance = buildProactiveGuidance(snapshot);
      const workspaceContext = buildWorkspaceContext(brainContext, pageOverride);
      setState((s) => ({
        ...s,
        executiveSnapshot: snapshot,
        proactiveGuidance: guidance,
        workspaceContext,
      }));
    },
    [buildWorkspaceContext, founderShell?.data],
  );

  useEffect(() => {
    if (!user) return;
    if (hostSessionInit.current) return;
    hostSessionInit.current = true;
    markStarting("starting");

    void (async () => {
      const maxAttempts = 8;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const session = await createPillowHostSession();
          // Mark ready immediately — history is non-blocking for conversation readiness.
          markReady(session.sessionId, savedSession?.turns ?? []);
          let turns = savedSession?.turns ?? [];
          try {
            const history = await fetchPillowHistory(session.sessionId);
            if (history.session.conversationHistory.length > 0) {
              turns = history.session.conversationHistory.flatMap((turn, index) => {
                const role = turn.role === "user" ? ("grand-king" as const) : ("pillow" as const);
                return [
                  {
                    id: `server-${index}-${turn.timestamp}`,
                    role,
                    content: toExecutiveSurfaceMessage(turn.content, turn.content),
                    screenPath: pathname,
                    recordedAt: turn.timestamp,
                  },
                ];
              });
              const snapshot: PillowSessionSnapshot = {
                turns,
                lastScreenPath: pathname,
                updatedAt: new Date().toISOString(),
                hostSessionId: session.sessionId,
              };
              savePillowSession(snapshot);
              setState((s) => ({ ...s, conversation: turns }));
            } else {
              savePillowSession({
                turns,
                lastScreenPath: pathname,
                updatedAt: new Date().toISOString(),
                hostSessionId: session.sessionId,
              });
            }
          } catch {
            savePillowSession({
              turns,
              lastScreenPath: pathname,
              updatedAt: new Date().toISOString(),
              hostSessionId: session.sessionId,
            });
          }
          return;
        } catch (error) {
          clearPillowHostSession();
          const phase: ExecutiveReadinessPhase =
            attempt >= 4 ? "delayed" : attempt > 1 ? "recovering" : "starting";
          markStarting(
            phase,
            error instanceof Error ? error.message : EXECUTIVE_STARTING_LABEL,
          );
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, Math.min(8_000, 1_200 * attempt)));
          }
        }
      }
      markStarting("delayed", EXECUTIVE_RECOVERING_LABEL);
    })();
  }, [markReady, markStarting, pathname, savedSession?.turns, user]);

  const refreshContext = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await brainDispatch<GlobalAssistantContext>({
        module: "cockpit-global-assistant",
        action: "context",
        payload: { screenPath: pathname },
      });
      const brainContext = result.result ?? null;
      setState((s) => ({
        ...s,
        loading: false,
        context: brainContext,
      }));
      syncExecutiveAwareness(brainContext, state.pageOverride);
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [pathname, state.pageOverride, syncExecutiveAwareness]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  useEffect(() => {
    if (state.context) {
      syncExecutiveAwareness(state.context, state.pageOverride);
    }
  }, [founderShell?.data, state.context, state.pageOverride, syncExecutiveAwareness]);

  const recordConversation = useCallback(
    (
      query: string,
      response: GlobalAssistantResponse | null,
      artifacts?: PillowChatArtifact[],
    ) => {
      let session: PillowSessionSnapshot | null = loadPillowSession();
      session = appendPillowTurn(session, {
        role: "grand-king",
        content: query,
        screenPath: pathname,
      });
      if (response) {
        session = appendPillowTurn(session, {
          role: "pillow",
          content: toExecutiveChatMessage(
            response.interactionSummary,
            EXECUTIVE_NOT_READY_REPLY,
          ),
          screenPath: pathname,
          artifacts,
        });
      }
      setState((s) => ({
        ...s,
        conversation: session?.turns ?? s.conversation,
        hostSessionId: session?.hostSessionId ?? s.hostSessionId,
      }));
    },
    [pathname],
  );

  const ensureHostSession = useCallback(async (): Promise<string | null> => {
    try {
      const session = await createPillowHostSession();
      const snapshot: PillowSessionSnapshot = {
        turns: loadPillowSession()?.turns ?? [],
        lastScreenPath: pathname,
        updatedAt: new Date().toISOString(),
        hostSessionId: session.sessionId,
      };
      savePillowSession(snapshot);
      markReady(session.sessionId);
      return session.sessionId;
    } catch (error) {
      clearPillowHostSession();
      markStarting(
        "recovering",
        error instanceof Error ? error.message : EXECUTIVE_RECOVERING_LABEL,
      );
      return null;
    }
  }, [markReady, markStarting, pathname]);

  // Slow recovery only after the initial bootstrap exhausted — never parallel with it.
  useEffect(() => {
    if (!user || state.executiveReady || state.readinessPhase !== "delayed") return;
    if (recoveryLoopActive.current) return;
    recoveryLoopActive.current = true;
    let cancelled = false;

    void (async () => {
      for (let attempt = 1; attempt <= 4 && !cancelled; attempt += 1) {
        const id = await ensureHostSession();
        if (id || cancelled) break;
        markStarting("delayed");
        await new Promise((r) => setTimeout(r, Math.min(20_000, 5_000 * attempt)));
      }
      recoveryLoopActive.current = false;
    })();

    return () => {
      cancelled = true;
      recoveryLoopActive.current = false;
    };
  }, [user, state.executiveReady, state.readinessPhase, ensureHostSession, markStarting]);

  const sendViaPillow = useCallback(
    async (
      query: string,
      target?: GlobalAssistantTarget,
    ): Promise<boolean> => {
      const workspaceContext = buildWorkspaceContext(state.context, state.pageOverride);

      const attemptChat = async (sessionId: string): Promise<boolean> => {
        const chatResult = await sendPillowChat({
          message: query,
          sessionId,
          workspaceContext: workspaceContext as unknown as Record<string, unknown>,
        });
        const response = mapPillowChatToAssistantResponse(chatResult, query);
        // Never pass raw text as fallback — constitutional/infra leaks must not reach UX.
        const surfaced = {
          ...response,
          interactionSummary: toExecutiveChatMessage(
            response.interactionSummary,
            EXECUTIVE_PIPELINE_SOFT_REPLY,
          ),
          reason: toExecutiveChatMessage(response.reason, EXECUTIVE_PIPELINE_SOFT_REPLY),
          recommendedNextAction: toExecutiveChatMessage(
            response.recommendedNextAction,
            EXECUTIVE_PIPELINE_SOFT_REPLY,
          ),
        };
        recordConversation(query, surfaced, chatResult.artifacts);
        setState((s) => ({
          ...s,
          loading: false,
          lastResponse: surfaced,
          pillowConnected: true,
          executiveReady: true,
          readinessPhase: "ready",
          readinessLabel: formatReadinessLabel("ready"),
          connectionError: null,
          activeTarget: target ?? null,
        }));
        return true;
      };

      let sessionId = await ensureHostSession();
      if (!sessionId) return false;

      try {
        return await attemptChat(sessionId);
      } catch {
        // Automatic recovery: recreate session and retry once.
        clearPillowHostSession();
        markStarting("recovering");
        sessionId = await ensureHostSession();
        if (!sessionId) return false;
        try {
          return await attemptChat(sessionId);
        } catch (error) {
          clearPillowHostSession();
          markStarting(
            "delayed",
            error instanceof Error ? error.message : EXECUTIVE_RECOVERING_LABEL,
          );
          return false;
        }
      }
    },
    [
      buildWorkspaceContext,
      ensureHostSession,
      markStarting,
      recordConversation,
      state.context,
      state.pageOverride,
    ],
  );

  const askPillow = useCallback(
    async (query: string, target?: GlobalAssistantTarget) => {
      setState((s) => ({
        ...s,
        expanded: true,
        loading: true,
        activeTarget: target ?? null,
        queryDraft: "",
      }));

      // Always attempt the executive pipeline — soft reply only if session/chat cannot complete.
      if (!state.executiveReady) {
        void ensureHostSession();
      }

      const sent = await sendViaPillow(query, target);
      if (sent) return;

      // Gate still enforced (no Brain fallback) — Grand King sees executive language only.
      recordConversation(query, {
        action: "ask",
        currentContext: "Executive startup",
        reason: EXECUTIVE_NOT_READY_REPLY,
        supportingEvidence: [],
        recommendedNextAction: "Wait a moment, then ask again.",
        confidence: "unavailable",
        suggestedFollowUps: [],
        interactionIntent: "general",
        interactionSummary: EXECUTIVE_NOT_READY_REPLY,
        computedAt: new Date().toISOString(),
        futureCapabilities: [],
      });
      setState((s) => ({
        ...s,
        loading: false,
        lastResponse: {
          action: "ask",
          currentContext: "Executive startup",
          reason: EXECUTIVE_NOT_READY_REPLY,
          supportingEvidence: [],
          recommendedNextAction: "Wait a moment, then ask again.",
          confidence: "unavailable",
          suggestedFollowUps: [],
          interactionIntent: "general",
          interactionSummary: EXECUTIVE_NOT_READY_REPLY,
          computedAt: new Date().toISOString(),
          futureCapabilities: [],
        },
        connectionError: s.connectionError ?? EXECUTIVE_RECOVERING_LABEL,
      }));
    },
    [ensureHostSession, recordConversation, sendViaPillow, state.executiveReady],
  );

  const runAction = useCallback(
    async (
      action: GlobalAssistantAction,
      target?: GlobalAssistantTarget,
      query?: string,
    ) => {
      const screen = resolveCockpitScreenContext(pathname);
      const userQuery =
        query ??
        (action === "ask"
          ? (target?.label ?? "")
          : buildPillowActionPrompt(action, {
              screenTitle: screen.screenTitle,
              screenPath: pathname,
              targetLabel: target?.label,
              nextExecutiveAction: state.executiveSnapshot?.nextExecutiveAction,
            }));

      if (action === "ask") {
        await askPillow(userQuery, target);
        return;
      }

      setState((s) => ({
        ...s,
        expanded: true,
        loading: true,
        activeTarget: target ?? null,
      }));

      const sent = await sendViaPillow(userQuery, target);
      if (sent) return;

      recordConversation(userQuery, {
        action,
        currentContext: "Executive Intelligence starting",
        reason: EXECUTIVE_NOT_READY_REPLY,
        supportingEvidence: [],
        recommendedNextAction: "Wait a moment, then ask again.",
        confidence: "unavailable",
        suggestedFollowUps: [],
        interactionIntent: "general",
        interactionSummary: EXECUTIVE_NOT_READY_REPLY,
        computedAt: new Date().toISOString(),
        futureCapabilities: [],
      });
      setState((s) => ({
        ...s,
        loading: false,
        lastResponse: {
          action,
          currentContext: "Executive Intelligence starting",
          reason: EXECUTIVE_NOT_READY_REPLY,
          supportingEvidence: [],
          recommendedNextAction: "Wait a moment, then ask again.",
          confidence: "unavailable",
          suggestedFollowUps: [],
          interactionIntent: "general",
          interactionSummary: EXECUTIVE_NOT_READY_REPLY,
          computedAt: new Date().toISOString(),
          futureCapabilities: [],
        },
        connectionError: s.readinessLabel || EXECUTIVE_RECOVERING_LABEL,
      }));
    },
    [
      askPillow,
      pathname,
      recordConversation,
      sendViaPillow,
      state.executiveSnapshot?.nextExecutiveAction,
    ],
  );

  const ask = useCallback(
    (query: string, target?: GlobalAssistantTarget) => runAction("ask", target, query),
    [runAction],
  );

  const explain = useCallback(
    (label: string, targetId?: string, value?: string) =>
      void runAction("explain", { targetType: "panel", targetId, label, value }),
    [runAction],
  );

  const recommend = useCallback(() => void runAction("recommend"), [runAction]);
  const summarise = useCallback(() => void runAction("summarise"), [runAction]);
  const nextAction = useCallback(() => void runAction("next_action"), [runAction]);

  const setPageOverride = useCallback((override: PillowPageContextOverride | null) => {
    setState((s) => ({ ...s, pageOverride: override }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      expand: () => setState((s) => ({ ...s, expanded: true })),
      collapse: () => setState((s) => ({ ...s, expanded: false })),
      toggle: () => setState((s) => ({ ...s, expanded: !s.expanded })),
      ensureHostSession,
      setQueryDraft: (queryDraft: string) => setState((s) => ({ ...s, queryDraft })),
      setPanelWidthPx: (panelWidthPx: number) =>
        setState((s) => ({
          ...s,
          panelWidthPx: Math.max(360, Math.min(960, panelWidthPx)),
        })),
      setVoiceEnabled: (voiceEnabled: boolean) => setState((s) => ({ ...s, voiceEnabled })),
      setPageOverride,
      refreshContext,
      runAction,
      ask,
      explain,
      recommend,
      summarise,
      nextAction,
    }),
    [
      state,
      ensureHostSession,
      setPageOverride,
      refreshContext,
      runAction,
      ask,
      explain,
      recommend,
      summarise,
      nextAction,
    ],
  );

  return (
    <GlobalAiAssistantContext.Provider value={value}>
      {children}
    </GlobalAiAssistantContext.Provider>
  );
}

export function useGlobalAiAssistant() {
  const ctx = useContext(GlobalAiAssistantContext);
  if (!ctx) {
    throw new Error("useGlobalAiAssistant must be used within GlobalAiAssistantProvider");
  }
  return ctx;
}

export function usePillowPageContext() {
  const ctx = useContext(GlobalAiAssistantContext);
  return {
    setPageOverride: ctx?.setPageOverride ?? (() => undefined),
    pageOverride: ctx?.pageOverride ?? null,
  };
}
