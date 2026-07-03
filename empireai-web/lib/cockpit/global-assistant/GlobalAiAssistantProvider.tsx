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
import { createPillowHostSession, sendPillowChat } from "@/lib/pillow/client";
import { mapPillowChatToAssistantResponse } from "@/lib/pillow/map-response";
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
};

type GlobalAiAssistantContextValue = GlobalAiAssistantState & {
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  ensureHostSession: () => Promise<string | null>;
  setQueryDraft: (query: string) => void;
  setPanelWidthPx: (widthPx: number) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  refreshContext: () => Promise<void>;
  runAction: (
    action: GlobalAssistantAction,
    target?: GlobalAssistantTarget,
    query?: string,
  ) => Promise<void>;
  ask: (query: string, target?: GlobalAssistantTarget) => Promise<void>;
  explain: (label: string, targetId?: string, value?: string) => Promise<void>;
  recommend: () => Promise<void>;
  summarise: () => Promise<void>;
  nextAction: () => Promise<void>;
};

const GlobalAiAssistantContext = createContext<GlobalAiAssistantContextValue | null>(null);

export function GlobalAiAssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const panelPrefs = loadPillowPanelPreferences();
  const savedSession = loadPillowSession();
  const hostSessionInit = useRef(false);
  const sessionRecoveryAttempted = useRef(false);

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
  });

  useEffect(() => {
    savePillowPanelPreferences({
      expanded: state.expanded,
      widthPx: state.panelWidthPx,
      voiceEnabled: state.voiceEnabled,
    });
  }, [state.expanded, state.panelWidthPx, state.voiceEnabled]);

  useEffect(() => {
    if (!user) return;
    if (hostSessionInit.current) return;
    hostSessionInit.current = true;

    void (async () => {
      try {
        const session = await createPillowHostSession();
        const snapshot: PillowSessionSnapshot = {
          turns: savedSession?.turns ?? [],
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
      setState((s) => ({
        ...s,
        loading: false,
        context: result.result ?? null,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [pathname]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const recordConversation = useCallback(
    (query: string, response: GlobalAssistantResponse | null) => {
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

  const askPillow = useCallback(
    async (query: string, target?: GlobalAssistantTarget) => {
      setState((s) => ({
        ...s,
        expanded: true,
        loading: true,
        activeTarget: target ?? null,
        queryDraft: "",
      }));

      const sessionId = await ensureHostSession();

      if (sessionId) {
        try {
          const chatResult = await sendPillowChat({ message: query, sessionId });
          const response = mapPillowChatToAssistantResponse(chatResult, query);
          recordConversation(query, response);
          setState((s) => ({
            ...s,
            loading: false,
            lastResponse: response,
            pillowConnected: true,
            connectionError: null,
          }));
          return;
        } catch (error) {
          clearPillowHostSession();
          const message = error instanceof Error ? error.message : "Pillow chat failed";
          setState((s) => ({
            ...s,
            hostSessionId: null,
            pillowConnected: false,
            connectionError: message,
          }));
        }
      }

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
    [dispatchViaBrain, ensureHostSession, recordConversation],
  );

  const runAction = useCallback(
    async (
      action: GlobalAssistantAction,
      target?: GlobalAssistantTarget,
      query?: string,
    ) => {
      const userQuery = query ?? target?.label ?? action;

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
      try {
        const result = await brainDispatch<GlobalAssistantResponse>({
          module: "cockpit-global-assistant",
          action,
          payload: {
            action,
            screenPath: pathname,
            query: userQuery,
            targetType: target?.targetType,
            targetId: target?.targetId,
            label: target?.label,
            value: target?.value,
          },
        });
        const response = result.result ?? null;
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
    [pathname, recordConversation, askPillow],
  );

  const ask = useCallback(
    (query: string, target?: GlobalAssistantTarget) => runAction("ask", target, query),
    [runAction],
  );

  const explain = useCallback(
    (label: string, targetId?: string, value?: string) =>
      runAction("explain", { targetType: "panel", targetId, label, value }),
    [runAction],
  );

  const recommend = useCallback(() => runAction("recommend"), [runAction]);
  const summarise = useCallback(() => runAction("summarise"), [runAction]);
  const nextAction = useCallback(() => runAction("next_action"), [runAction]);

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
