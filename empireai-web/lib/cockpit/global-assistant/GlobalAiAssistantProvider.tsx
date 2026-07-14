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
  const sessionRecoveryAttempted = useRef(false);
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
    connectionError: null,
    pageOverride: null,
    executiveSnapshot: null,
    proactiveGuidance: [],
    workspaceContext: null,
  });

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

    void (async () => {
      try {
        const session = await createPillowHostSession();
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
                  content: turn.content,
                  screenPath: pathname,
                  recordedAt: turn.timestamp,
                },
              ];
            });
          }
        } catch {
          /* keep local turns if history unavailable */
        }
        const snapshot: PillowSessionSnapshot = {
          turns,
          lastScreenPath: pathname,
          updatedAt: new Date().toISOString(),
          hostSessionId: session.sessionId,
        };
        savePillowSession(snapshot);
        setState((s) => ({
          ...s,
          conversation: turns,
          hostSessionId: session.sessionId,
          pillowConnected: true,
          connectionError: null,
        }));
      } catch (error) {
        clearPillowHostSession();
        setState((s) => ({
          ...s,
          hostSessionId: null,
          pillowConnected: false,
          connectionError:
            error instanceof Error
              ? error.message
              : "Pillow host session unavailable — using Brain assistant fallback.",
        }));
      }
    })();
  }, [pathname, savedSession?.turns, user]);

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
          content: response.interactionSummary,
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
      setState((s) => ({
        ...s,
        hostSessionId: session.sessionId,
        pillowConnected: true,
        connectionError: null,
      }));
      return session.sessionId;
    } catch (error) {
      clearPillowHostSession();
      const message =
        error instanceof Error ? error.message : "Pillow host session unavailable";
      setState((s) => ({
        ...s,
        hostSessionId: null,
        pillowConnected: false,
        connectionError: message,
      }));
      return null;
    }
  }, [pathname]);

  useEffect(() => {
    if (!user || !state.connectionError || state.pillowConnected || sessionRecoveryAttempted.current) {
      return;
    }
    sessionRecoveryAttempted.current = true;
    void ensureHostSession();
  }, [user, state.connectionError, state.pillowConnected, ensureHostSession]);

  const dispatchViaBrain = useCallback(
    async (
      action: GlobalAssistantAction,
      userQuery: string,
      target?: GlobalAssistantTarget,
    ): Promise<GlobalAssistantResponse | null> => {
      const result = await brainDispatch<GlobalAssistantResponse>({
        module: "cockpit-global-assistant",
        action,
        payload: {
          action,
          screenPath: pathname,
          query: userQuery,
          targetType: target?.targetType,
          targetId: target?.targetId,
          label: target?.label ?? userQuery,
          value: target?.value,
        },
      });
      return result.result ?? null;
    },
    [pathname],
  );

  const sendViaPillow = useCallback(
    async (
      query: string,
      target?: GlobalAssistantTarget,
    ): Promise<boolean> => {
      const sessionId = await ensureHostSession();
      if (!sessionId) return false;

      const workspaceContext = buildWorkspaceContext(state.context, state.pageOverride);

      try {
        const chatResult = await sendPillowChat({
          message: query,
          sessionId,
          workspaceContext: workspaceContext as unknown as Record<string, unknown>,
        });
        const response = mapPillowChatToAssistantResponse(chatResult, query);
        recordConversation(query, response, chatResult.artifacts);
        setState((s) => ({
          ...s,
          loading: false,
          lastResponse: response,
          pillowConnected: true,
          connectionError: null,
          activeTarget: target ?? null,
        }));
        return true;
      } catch (error) {
        clearPillowHostSession();
        setState((s) => ({
          ...s,
          hostSessionId: null,
          pillowConnected: false,
          connectionError: error instanceof Error ? error.message : "Pillow chat failed",
        }));
        return false;
      }
    },
    [
      buildWorkspaceContext,
      ensureHostSession,
      pathname,
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

      const sent = await sendViaPillow(query, target);
      if (sent) return;

      try {
        const response = await dispatchViaBrain("ask", query, target);
        recordConversation(query, response);
        setState((s) => ({
          ...s,
          loading: false,
          lastResponse: response,
          connectionError:
            s.connectionError ??
            "Pillow host offline — answered via Brain cockpit assistant.",
        }));
      } catch {
        setState((s) => ({
          ...s,
          loading: false,
          connectionError:
            s.connectionError ?? "Could not reach Pillow or Brain. Try again shortly.",
        }));
      }
    },
    [dispatchViaBrain, recordConversation, sendViaPillow],
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

      try {
        const response = await dispatchViaBrain(action, userQuery, target);
        recordConversation(userQuery, response);
        setState((s) => ({
          ...s,
          loading: false,
          lastResponse: response,
        }));
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [
      askPillow,
      dispatchViaBrain,
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
        setState((s) => ({ ...s, panelWidthPx: Math.max(320, Math.min(720, panelWidthPx)) })),
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
