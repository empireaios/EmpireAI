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
  EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
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
        // Never treat mission count as approvals — that caused Home vs Pillow Context contradictions.
        pendingApprovals: brainContext?.executiveContext?.pendingApprovals ?? 0,
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
        pendingApprovals: brainContext?.executiveContext?.pendingApprovals ?? 0,
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
      // Remount / Strict-effect safety: reuse a persisted host session instead of
      // creating another and rate-limit storming Brain (/api/pillow/session 503).
      const existingId = loadPillowSession()?.hostSessionId ?? null;
      if (existingId) {
        markReady(existingId, loadPillowSession()?.turns ?? []);
        return;
      }

      markStarting("starting");
      const maxAttempts = 4;
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
          // Do not clear a concurrently established session on rate-limit failure.
          const persisted = loadPillowSession();
          if (persisted?.hostSessionId) {
            markReady(persisted.hostSessionId, persisted.turns ?? []);
            return;
          }
          clearPillowHostSession();
          const phase: ExecutiveReadinessPhase =
            attempt >= 3 ? "delayed" : attempt > 1 ? "recovering" : "starting";
          markStarting(
            phase,
            error instanceof Error ? error.message : EXECUTIVE_STARTING_LABEL,
          );
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, Math.min(8_000, 1_500 * attempt)));
          }
        }
      }
      const recovered = loadPillowSession()?.hostSessionId;
      if (recovered) {
        markReady(recovered, loadPillowSession()?.turns ?? []);
        return;
      }
      markStarting("delayed", EXECUTIVE_RECOVERING_LABEL);
    })();
  }, [markReady, markStarting, pathname, savedSession?.turns, user]);

  const refreshContext = useCallback(async () => {
    // Never share chat `loading` with background context refresh — that disabled Send
    // and showed "Preparing your executive response…" while Brain context was fetching.
    try {
      const result = await brainDispatch<GlobalAssistantContext>({
        module: "cockpit-global-assistant",
        action: "context",
        payload: { screenPath: pathname },
      });
      const brainContext = result.result ?? null;
      setState((s) => ({
        ...s,
        context: brainContext,
      }));
      syncExecutiveAwareness(brainContext, state.pageOverride);
    } catch {
      // Background awareness only — do not block the composer.
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

  const appendUserTurnNow = useCallback(
    (query: string) => {
      const session = appendPillowTurn(loadPillowSession(), {
        role: "grand-king",
        content: query,
        screenPath: pathname,
      });
      setState((s) => ({
        ...s,
        conversation: session.turns,
        hostSessionId: session.hostSessionId ?? s.hostSessionId,
      }));
    },
    [pathname],
  );

  const appendPillowTurnOnly = useCallback(
    (response: GlobalAssistantResponse, artifacts?: PillowChatArtifact[]) => {
      const session = appendPillowTurn(loadPillowSession(), {
        role: "pillow",
          content: toExecutiveChatMessage(
          response.interactionSummary,
          EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
        ),
        screenPath: pathname,
        artifacts,
      });
      setState((s) => ({
        ...s,
        conversation: session.turns,
        hostSessionId: session.hostSessionId ?? s.hostSessionId,
        lastResponse: response,
      }));
    },
    [pathname],
  );

  /** Legacy helper — user+response. Prefer appendUserTurnNow + appendPillowTurnOnly. */
  const recordConversation = useCallback(
    (
      query: string,
      response: GlobalAssistantResponse | null,
      artifacts?: PillowChatArtifact[],
    ) => {
      appendUserTurnNow(query);
      if (response) appendPillowTurnOnly(response, artifacts);
    },
    [appendPillowTurnOnly, appendUserTurnNow],
  );

  const ensureHostSession = useCallback(async (): Promise<string | null> => {
    // Reuse first — Executive Home / panel expand must not create parallel sessions.
    const existing = loadPillowSession();
    if (existing?.hostSessionId) {
      markReady(existing.hostSessionId, existing.turns ?? []);
      return existing.hostSessionId;
    }
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
      const persisted = loadPillowSession();
      if (persisted?.hostSessionId) {
        markReady(persisted.hostSessionId, persisted.turns ?? []);
        return persisted.hostSessionId;
      }
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
      // Single bounded recovery attempt — multi-retry loops stampeded Brain (503 + lag).
      for (let attempt = 1; attempt <= 1 && !cancelled; attempt += 1) {
        const id = await ensureHostSession();
        if (id || cancelled) break;
        markStarting("delayed");
        await new Promise((r) => setTimeout(r, 15_000));
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
      const buildContextWithContinuity = (): Record<string, unknown> => {
        const base = buildWorkspaceContext(state.context, state.pageOverride);
        const turns = (loadPillowSession()?.turns ?? [])
          .slice(-12)
          .map((t) => ({ role: t.role, content: t.content }));
        return {
          ...base,
          recentConversationTurns: turns,
        };
      };

      const attemptChat = async (sessionId: string): Promise<boolean> => {
        const chatResult = await sendPillowChat({
          message: query,
          sessionId,
          workspaceContext: buildContextWithContinuity(),
        });
        if (chatResult.reboundSessionId && chatResult.reboundSessionId !== sessionId) {
          const existing = loadPillowSession();
          savePillowSession({
            turns: existing?.turns ?? [],
            lastScreenPath: existing?.lastScreenPath ?? pathname,
            updatedAt: new Date().toISOString(),
            hostSessionId: chatResult.reboundSessionId,
          });
          markReady(chatResult.reboundSessionId, existing?.turns ?? []);
        }
        const response = mapPillowChatToAssistantResponse(chatResult, query);
        // Never pass raw text as fallback — constitutional/infra leaks must not reach UX.
        const surfaced = {
          ...response,
          interactionSummary: toExecutiveChatMessage(
            response.interactionSummary,
            EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
          ),
          reason: toExecutiveChatMessage(response.reason, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY),
          recommendedNextAction: toExecutiveChatMessage(
            response.recommendedNextAction,
            EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
          ),
        };
        // User turn already rendered optimistically — append Pillow only.
        appendPillowTurnOnly(surfaced, chatResult.artifacts);
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

      const isInvalidSessionError = (error: unknown): boolean => {
        const msg = error instanceof Error ? error.message : String(error ?? "");
        return /session.*(not found|invalid|expired)|404|401/i.test(msg);
      };

      let sessionId = await ensureHostSession();
      if (!sessionId) return false;

      try {
        return await attemptChat(sessionId);
      } catch (firstError) {
        // Retry same session once before recreating — preserves server history under lag.
        try {
          return await attemptChat(sessionId);
        } catch (secondError) {
          if (!isInvalidSessionError(secondError) && !isInvalidSessionError(firstError)) {
            // Lag/timeout — keep session id; do not wipe local continuity.
            markStarting(
              "delayed",
              secondError instanceof Error ? secondError.message : EXECUTIVE_RECOVERING_LABEL,
            );
            return false;
          }
          clearPillowHostSession();
          markStarting("recovering");
          sessionId = await ensureHostSession();
          if (!sessionId) return false;
          try {
            return await attemptChat(sessionId);
          } catch (error) {
            markStarting(
              "delayed",
              error instanceof Error ? error.message : EXECUTIVE_RECOVERING_LABEL,
            );
            return false;
          }
        }
      }
    },
    [
      appendPillowTurnOnly,
      buildWorkspaceContext,
      ensureHostSession,
      markStarting,
      state.context,
      state.pageOverride,
    ],
  );

  const askPillow = useCallback(
    async (query: string, target?: GlobalAssistantTarget) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // Render Grand King message immediately; show honest processing state while Pillow works.
      appendUserTurnNow(trimmed);
      setState((s) => ({
        ...s,
        expanded: true,
        loading: true,
        activeTarget: target ?? null,
        queryDraft: "",
      }));

      try {
        if (!state.executiveReady) {
          void ensureHostSession();
        }

        const sent = await sendViaPillow(trimmed, target);
        if (sent) return;

        // Honest terminal — not a completed executive answer; no recovery residue.
        appendPillowTurnOnly({
          action: "ask",
          currentContext: "Executive infrastructure",
          reason: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
          supportingEvidence: [],
          recommendedNextAction: "Wait for the same accepted request to complete — do not treat this as an executive answer.",
          confidence: "unavailable",
          suggestedFollowUps: [],
          interactionIntent: "general",
          interactionSummary: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
          computedAt: new Date().toISOString(),
          futureCapabilities: [],
        });
        setState((s) => ({
          ...s,
          connectionError: s.connectionError ?? EXECUTIVE_RECOVERING_LABEL,
        }));
      } finally {
        setState((s) => (s.loading ? { ...s, loading: false } : s));
      }
    },
    [
      appendPillowTurnOnly,
      appendUserTurnNow,
      ensureHostSession,
      sendViaPillow,
      state.executiveReady,
    ],
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

      try {
        const sent = await sendViaPillow(userQuery, target);
        if (sent) return;

        recordConversation(userQuery, {
          action,
          currentContext: "Executive infrastructure",
          reason: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
          supportingEvidence: [],
          recommendedNextAction:
            "Wait for the same accepted request to complete — do not treat this as an executive answer.",
          confidence: "unavailable",
          suggestedFollowUps: [],
          interactionIntent: "general",
          interactionSummary: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
          computedAt: new Date().toISOString(),
          futureCapabilities: [],
        });
        setState((s) => ({
          ...s,
          lastResponse: {
            action,
            currentContext: "Executive infrastructure",
            reason: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
            supportingEvidence: [],
            recommendedNextAction:
              "Wait for the same accepted request to complete — do not treat this as an executive answer.",
            confidence: "unavailable",
            suggestedFollowUps: [],
            interactionIntent: "general",
            interactionSummary: EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
            computedAt: new Date().toISOString(),
            futureCapabilities: [],
          },
          connectionError: s.readinessLabel || EXECUTIVE_RECOVERING_LABEL,
        }));
      } finally {
        setState((s) => (s.loading ? { ...s, loading: false } : s));
      }
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
      expand: () => {
        // Mark panel expanded only. Do NOT auto-dispatch the Pillow focus event —
        // Executive Home mounts expand() and that was yanking page scroll into Pillow.
        // Explicit openers (Ask AI / Ask Pillow) dispatch the focus event themselves.
        setState((s) => ({ ...s, expanded: true }));
      },
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
