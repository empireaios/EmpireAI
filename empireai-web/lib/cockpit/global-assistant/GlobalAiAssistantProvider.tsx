"use client";

import { hasReasoningFailure, isConfirmedReasoning } from "@/lib/pillow/confirmed-reasoning";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

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
  loadPillowPanelPreferences,
  loadPillowSession,
  preservePillowLocalArchive,
  savePillowPanelPreferences,
  savePillowSession,
  type PillowConversationTurn,
  type PillowSessionSnapshot,
} from "@/lib/cockpit/pillow/pillow-session-store";
import {readTwinChatContext} from '@/lib/owner/twin-chat-context';
import { createPillowHostSession, fetchPillowHistory, retrievePillowChat, sendPillowChat } from "@/lib/pillow/client";
import { reconcilePillowHistory } from "@/lib/pillow/reconcile-history";
import { clearPendingPillowReceipt, loadPendingPillowReceipts, savePendingPillowReceipt } from "@/lib/pillow/pending-receipts";
import { mapPillowChatToAssistantResponse } from "@/lib/pillow/map-response";
import type { PillowChatArtifact, PillowChatResult } from "@/lib/pillow/types";
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
const UNCONFIRMED_REQUEST_MESSAGE = "Pillow is unavailable. This instruction has not been confirmed as accepted or completed. No automatic repeat was attempted.";

export function GlobalAiAssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Remount on identity change: never render the previous owner's transcript,
  // context, active request or session for even one frame of the next account.
  return <GlobalAiAssistantSession key={user?.id ?? "anonymous"}>{children}</GlobalAiAssistantSession>;
}

function GlobalAiAssistantSession({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const founderShell = useFounderShellOptional();
  const panelPrefs = loadPillowPanelPreferences();
  const savedSession = loadPillowSession(user?.id);
  const recoveryLoopActive = useRef(false);
  const chatSubmissionActive = useRef(false);
  const activeOwnerId = useRef(user?.id);
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

  useEffect(() => {
    activeOwnerId.current = user?.id;
    return () => { activeOwnerId.current = undefined; };
  }, [user?.id]);

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

  const historyOwnerId = user?.id;
  const historyWorkspaceId = user?.workspaceId;
  useEffect(() => {
    if (!historyOwnerId) return;
    let cancelled = false;
    let running = false;
    const hydrate = async () => {
      if (running || chatSubmissionActive.current || recoveryLoopActive.current) return;
      running = true;
      try {
        // Every device resolves the server conversation. Local storage is only a cache.
        const cached=loadPillowSession(historyOwnerId);
        const historicalBrowserTurns=(cached?.turns ?? []).filter(turn=>!turn.source && Number.isFinite(Date.parse(turn.recordedAt))).map(turn=>({role:turn.role==='grand-king'?'user' as const:'assistant' as const,content:turn.content,timestamp:new Date(turn.recordedAt).toISOString(),requestId:turn.requestId}));
        const session = await createPillowHostSession(historyWorkspaceId, historyOwnerId, historicalBrowserTurns);

        const history = await fetchPillowHistory(session.sessionId);
        if (cancelled || activeOwnerId.current !== historyOwnerId || chatSubmissionActive.current) return;
        const serverTurns: PillowConversationTurn[] = history.session.conversationHistory
          .filter(turn => turn.role === "user" || turn.role === "assistant")
          .map((turn, index) => ({
            id: `server-${turn.requestId ?? index}-${turn.role}-${turn.timestamp}`,
            role: turn.role === "user" ? "grand-king" : "pillow",
            content: turn.content,
            screenPath: pathname,
            recordedAt: turn.timestamp,
            requestId: turn.requestId,
            source: "server_persisted_transcript",
          }));
        const archiveTurns: PillowConversationTurn[] = history.historicalArchive.map(turn => ({
          id:`archive-${turn.id}`, role:turn.role === 'user' ? 'grand-king' : 'pillow',
          content:turn.content, recordedAt:turn.timestamp, requestId:turn.requestId,
          screenPath:pathname, source:'historical_browser_cache',
        }));
        const turns = reconcilePillowHistory(serverTurns, archiveTurns);
        const previous = loadPillowSession(historyOwnerId);
        // Preserve browser-only historical records separately; never silently
        // upload them as server evidence or inference context.
        preservePillowLocalArchive(previous, turns, historyOwnerId);
        savePillowSession({turns, lastScreenPath: pathname, updatedAt: new Date().toISOString(), hostSessionId: session.sessionId}, historyOwnerId);
        markReady(session.sessionId, turns);
      } catch {
        if (!cancelled && activeOwnerId.current === historyOwnerId) {
          markStarting("recovering", "Server conversation history could not be synchronized. Any displayed cached history is device-local and unverified.");
        }
      } finally { running = false; }
    };
    void hydrate();
    const refresh = () => { if (document.visibilityState === "visible") void hydrate(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [markReady, markStarting, pathname, historyOwnerId, historyWorkspaceId]);

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

  useEffect(() => subscribeRead(refreshContext), [refreshContext]);

  useEffect(() => {
    if (state.context) {
      return subscribeRead(() => syncExecutiveAwareness(state.context, state.pageOverride));
    }
  }, [founderShell?.data, state.context, state.pageOverride, syncExecutiveAwareness]);

  const appendUserTurnNow = useCallback(
    (query: string) => {
      if (!user || activeOwnerId.current !== user.id) return;
      const session = appendPillowTurn(loadPillowSession(user.id), {
        role: "grand-king",
        content: query,
        screenPath: pathname,
      }, user.id);
      setState((s) => ({
        ...s,
        conversation: session.turns,
        hostSessionId: session.hostSessionId ?? s.hostSessionId,
      }));
    },
    [pathname, user],
  );

  const appendPillowTurnOnly = useCallback(
    (response: GlobalAssistantResponse, artifacts?: PillowChatArtifact[], requestId?: string, isStatus = false) => {
      if (!user || activeOwnerId.current !== user.id) return;
      const session = appendPillowTurn(loadPillowSession(user.id), {
        role: "pillow",
        requestId,
        content: isStatus ? response.interactionSummary : toExecutiveChatMessage(
          response.interactionSummary,
          EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
        ),
        screenPath: pathname,
        artifacts,
      }, user.id);
      setState((s) => ({
        ...s,
        conversation: session.turns,
        hostSessionId: session.hostSessionId ?? s.hostSessionId,
        lastResponse: response,
      }));
    },
    [pathname, user],
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
    if (!user || activeOwnerId.current !== user.id) return null;
    try {
      const session = await createPillowHostSession(user.workspaceId, user.id);
      if (activeOwnerId.current !== user.id) return null;
      const snapshot: PillowSessionSnapshot = {
        turns: loadPillowSession(user.id)?.turns ?? [],
        lastScreenPath: pathname,
        updatedAt: new Date().toISOString(),
        hostSessionId: session.sessionId,
      };
      savePillowSession(snapshot, user.id);
      markReady(session.sessionId);
      return session.sessionId;
    } catch (error) {
      if (activeOwnerId.current !== user.id) return null;
      markStarting(
        "recovering",
        error instanceof Error ? error.message : EXECUTIVE_RECOVERING_LABEL,
      );
      return null;
    }
  }, [markReady, markStarting, pathname, user]);

  const presentChatResult = useCallback((chatResult: PillowChatResult, query: string, target?: GlobalAssistantTarget) => {
    if (!user || activeOwnerId.current !== user.id) return;
    // Restore/reopen follows the same rebound-session contract as the first send.
    if (chatResult.reboundSessionId) {
      const existing = loadPillowSession(user.id);
      if (existing?.hostSessionId !== chatResult.reboundSessionId) {
        savePillowSession({
          turns: existing?.turns ?? [],
          lastScreenPath: existing?.lastScreenPath ?? pathname,
          updatedAt: new Date().toISOString(),
          hostSessionId: chatResult.reboundSessionId,
        }, user.id);
        markReady(chatResult.reboundSessionId, existing?.turns ?? []);
      }
    }
    const response = mapPillowChatToAssistantResponse(chatResult, query);
    const isStatus = hasReasoningFailure(chatResult) || chatResult.kind === "durable_pending" ||
      chatResult.status === "FAILED_FATAL" || chatResult.status === "FAILED" ||
      chatResult.status === "RESULT_UNAVAILABLE";
    const preserveReasoning = isConfirmedReasoning(chatResult);
    const surfaced = isStatus || preserveReasoning ? response : {
      ...response,
      interactionSummary: toExecutiveChatMessage(response.interactionSummary, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY),
      reason: toExecutiveChatMessage(response.reason, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY),
      recommendedNextAction: toExecutiveChatMessage(response.recommendedNextAction, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY),
    };
    appendPillowTurnOnly(surfaced, chatResult.artifacts, chatResult.requestId, isStatus || preserveReasoning);
    if (user && chatResult.kind !== "durable_pending" && chatResult.status !== "RESULT_UNAVAILABLE") {
      clearPendingPillowReceipt(user.id, chatResult.requestId);
    }
    setState((s) => ({
      ...s,
      lastResponse: surfaced,
      connectionError: isStatus ? chatResult.message : null,
      activeTarget: target ?? null,
    }));
  }, [appendPillowTurnOnly, markReady, pathname, user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    // Refresh/remount resumes GET on confirmed IDs, never the original POST.
    const receipts = loadPendingPillowReceipts(user.id);
    void (async () => {
      for (const receipt of receipts) {
        if (controller.signal.aborted) break;
        try {
          const result = await retrievePillowChat(receipt, { signal: controller.signal });
          if (!controller.signal.aborted) presentChatResult(result, receipt.query);
        } catch {
          // Unmount/sign-out cancels retrieval; the owner-scoped receipt remains saved.
        }
      }
    })();
    return () => controller.abort();
  }, [user, presentChatResult]);

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
      const productContext=user?readTwinChatContext(user.id):null;
      const contextKey=productContext?JSON.stringify(productContext):undefined;
      const buildContextWithContinuity = (): Record<string, unknown> => {
        const base = buildWorkspaceContext(state.context, state.pageOverride);
        const turns = (loadPillowSession(user?.id)?.turns ?? [])
          .filter(t => t.source === "server_persisted_transcript")
          .slice(-12)
          .map((t) => ({
            role: t.role,
            content:
              String(t.content ?? "").length > 8000
                ? `${String(t.content).slice(0, 7970)}…`
                : t.content,
          }));
        return {
          ...base,
          recentConversationTurns: turns,
          ...(productContext?{productContext}:{}),
        };
      };

      const attemptChat = async (sessionId: string): Promise<boolean> => {
        const priorReceipt = user
          ? loadPendingPillowReceipts(user.id).find((row) => row.query === query && row.contextKey === contextKey)
          : undefined;
        const chatResult: PillowChatResult & { reboundSessionId?: string } = priorReceipt
          ? await retrievePillowChat(priorReceipt)
          : await sendPillowChat({
            message: query,
            sessionId,
            workspaceContext: buildContextWithContinuity(),
          }, {
            onAccepted: (receipt) => {
              if (user) savePendingPillowReceipt(user.id, { ...receipt, query, contextKey });
            },
          });
        if (!user || activeOwnerId.current !== user.id) return true;
        presentChatResult(chatResult, query, target);
        setState((s) => ({
          ...s,
          loading: false,
          pillowConnected: true,
          executiveReady: true,
          readinessPhase: "ready",
          readinessLabel: formatReadinessLabel("ready"),
          activeTarget: target ?? null,
        }));
        return true;
      };

      const sessionId = await ensureHostSession();
      if (!sessionId) return false;

      try {
        return await attemptChat(sessionId);
      } catch (error) {
        if (!user || activeOwnerId.current !== user.id) return true;
        // A timeout/401/404 is not proof that the original POST was rejected.
        // Preserve continuity and never execute the instruction a second time.
        const message = error instanceof Error ? error.message : "The request status could not be confirmed. No automatic repeat was attempted.";
        markStarting("delayed", message);
        appendPillowTurnOnly({
          ...mapPillowChatToAssistantResponse({
            requestId: "", sessionId, message, kind: "error", latencyMs: 0,
          }, query),
          interactionSummary: message,
        }, undefined, undefined, true);
        return true;
      }
    },
    [
      appendPillowTurnOnly,
      buildWorkspaceContext,
      ensureHostSession,
      markStarting,
      presentChatResult,
      state.context,
      state.pageOverride,
      user,
    ],
  );

  const askPillow = useCallback(
    async (query: string, target?: GlobalAssistantTarget) => {
      const trimmed = query.trim();
      if (!trimmed || chatSubmissionActive.current) return;
      chatSubmissionActive.current = true;

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
          reason: UNCONFIRMED_REQUEST_MESSAGE,
          supportingEvidence: [],
          recommendedNextAction: "Restore the connection and check request status before sending this instruction again.",
          confidence: "unavailable",
          suggestedFollowUps: [],
          interactionIntent: "general",
          interactionSummary: UNCONFIRMED_REQUEST_MESSAGE,
          computedAt: new Date().toISOString(),
          futureCapabilities: [],
        });
        setState((s) => ({
          ...s,
          connectionError: s.connectionError ?? EXECUTIVE_RECOVERING_LABEL,
        }));
      } finally {
        chatSubmissionActive.current = false;
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
      if (chatSubmissionActive.current) return;
      chatSubmissionActive.current = true;

      setState((s) => ({
        ...s,
        expanded: true,
        loading: true,
        activeTarget: target ?? null,
      }));

      tr…4218 tokens truncated…"classification": "SIMULATION_EXCLUDED_FROM_ACTUALS",
          "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
          "planDigest": "96110a74fc5e5e678b40f9ed585fb328714984963286705ce99e4cf1e1a7c1e3",
          "assumptions": {
            "classification": "SIMULATION_ASSUMPTIONS_NOT_ACTUAL_CHARGES",
            "version": "SIM_FINANCE_V1",
            "feeBasis": "CANDIDATE_FEE_PLUS_PAYMENT_PERCENT",
            "dutyBasis": "CANDIDATE_DUTY_PLUS_TAX_PER_UNIT",
            "payout": "SIMULATED_HOLD_ONE_DAY_THEN_BANK",
            "supplierPayment": "SIMULATED_QUOTED_COST_FREIGHT_DUTY",
            "actualCashMovement": 0
          },
          "recordedEvents": 11,
          "totalEvents": 11,
          "financial": {
            "classification": "SIMULATION_EXCLUDED_FROM_ACTUALS",
            "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
            "work5Reference": "158242368742f02ab890e810fba6dc3dc767dc66f5bd4865692fdcf8765c53a9",
            "eventDigest": "05351df1031def29569caacd3ff6b008954f3041a2f4ee746eb39450004134a6",
            "cutoffAt": "2026-10-12T00:01:00.000Z",
            "orders": [
              {
                "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
                "currency": "SGD",
                "missing": [],
                "unknownIds": [],
                "contributionMinor": 4040,
                "realisedContributionMinor": 4040,
                "receivableMinor": 0,
                "settlementMinor": 0,
                "payoutHeldMinor": 0,
                "bankMinor": 4040,
                "liabilityMinor": 0,
                "cashNeedMinor": 0,
                "conserved": true,
                "complete": true
              }
            ],
            "duplicates": 0,
            "pending": [],
            "unknown": [],
            "balanced": true,
            "conserved": true,
            "complete": true,
            "actualCashMovement": 0,
            "actualRevenue": null,
            "actualProfit": null,
            "technologyCosts": "EXCLUDED_SEPARATE_COST_CENTRE",
            "fx": "NO_IMPLICIT_CONVERSION",
            "sourceVerification": "CANONICAL_IMMUTABLE_HISTORY_READ",
            "noncanonicalAmounts": "EXPLICIT_SIMULATION_ASSUMPTIONS_NOT_SOURCE_FACTS"
          },
          "actualCashMovement": 0,
          "simulatedCharges": [
            {
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "currency": "SGD",
              "feeMinor": 1360,
              "dutyAndTaxMinor": 400,
              "refundMinor": null
            }
          ],
          "events": [
            {
              "id": "sim:b4b9b6e9993871a2428a6ca61d62d39835a3e22f991ac8fabcb9702b67f5196b",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "SALE",
              "currency": "SGD",
              "minor": 8000,
              "at": "2026-10-11T00:00:00.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:222142d625938c5b1acfcd17f08ea31d083220af9acc94b04f4d007cd763bb50",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "COGS",
              "currency": "SGD",
              "minor": 1600,
              "at": "2026-10-11T00:00:01.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:367770c90529b87e86cdbbc4ec32a22c6c78ff2e1365dd058e9a44ae5ae92bac",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "FREIGHT",
              "currency": "SGD",
              "minor": 600,
              "at": "2026-10-11T00:00:02.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:95a3c6860216a457f6cb5801170f54d92ce904eca1b7575efe45e9cca3320786",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "FEE",
              "currency": "SGD",
              "minor": 1360,
              "at": "2026-10-11T00:00:03.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:a6bf6f496e3a552f0714b0fc7264f801587d35e3cb1ff7b96c917370a0160f61",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "DUTY",
              "currency": "SGD",
              "minor": 400,
              "at": "2026-10-11T00:00:04.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:48a8c6084b6226e3e498ba633f014241173c14c53e481b65b8dbd150cc62bdce",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "DISCOUNT",
              "currency": "SGD",
              "minor": 0,
              "at": "2026-10-11T00:00:05.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:e48d51d22805a4b2122f77d8c17d560f5d6a0f60c7e71d996aeeb697f68d9a01",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "SETTLEMENT",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-11T00:00:06.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:ecc8cc0713301f2811df016f8638e50ffe1a85b46cce6e5ba726a1dd8345fb88",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "PAYOUT_HOLD",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-11T00:00:07.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:16fea21267518783e92278ffa0a463d3e2da8c6f2aa17b3dd778cd6d87e7f5a6",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "SUPPLIER_PAYMENT",
              "currency": "SGD",
              "minor": 2600,
              "at": "2026-10-11T00:00:08.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:fd9ba2e7f5eb39f8009ea5d14c1c2a6f1c43625b03c3c1d358ef31bf1de739d8",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "PAYOUT_RELEASE",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-12T00:00:09.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:361fba3a51cffb4575dad3afaedba94c83b4a3ae5805ebde1143877322907673",
              "orderId": "fixture-order-5f1e4e198aa2c66b0bd1",
              "sourceReceiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
              "kind": "BANK_RECEIPT",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-12T00:00:10.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            }
          ]
        }
      },
      {
        "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
        "receiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
        "version": 10,
        "productId": "fixture-product-ba08c179c73a06746c33",
        "variantId": "fixture-variant-ba08c179c73a06746c33",
        "listing": {
          "productId": "fixture-product-ba08c179c73a06746c33",
          "title": "Synthetic organiser 3",
          "bullets": [
            "Synthetic dimensions for acceptance only"
          ],
          "description": "Synthetic listing package, not intended for marketplace publication.",
          "category": "HOME_STORAGE",
          "attributes": {
            "material": "fixture"
          },
          "variants": [
            {
              "sku": "FIXTURE-ba08c179c73a06746c33",
              "variantId": "fixture-variant-ba08c179c73a06746c33",
              "dimensions": "10x10x10 cm fixture"
            }
          ],
          "images": [
            {
              "url": "https://example.invalid/fixture.png",
              "license": "Synthetic acceptance image manifest; no actual media licensed",
              "rightsEvidence": "evidence-QUALITY",
              "sha256": "ecf5bc501c5a4b57073420da4f16b0abc7b0a5ca26e30494b3f911d68e0f024f"
            }
          ],
          "claims": [
            {
              "text": "Synthetic fixture",
              "evidenceId": "evidence-QUALITY"
            }
          ],
          "sourceEvidence": [
            "evidence-DEMAND",
            "evidence-COMPETITION",
            "evidence-DIFFERENTIATION",
            "evidence-QUALITY",
            "evidence-COMPLIANCE",
            "evidence-RETURNS",
            "evidence-MARKETPLACE",
            "evidence-PAYMENT"
          ]
        },
        "publication": {
          "capacity": {
            "account": "isolated-fixture",
            "marketplace": "SG",
            "mode": "NEW_ASIN",
            "asin": null,
            "newAsinRemaining": 1000,
            "unsoldRemaining": 1000,
            "requestsPerSecond": 1,
            "eligibility": "ELIGIBLE",
            "provenance": {
              "source": "work6-deterministic-acceptance",
              "reference": "synthetic:work6-fixture-not-provider-evidence",
              "sha256": "ac1d1be57de78abe02f9f5c3cbba30df7db9bcef061d746d31f60879795c15fd",
              "observedAt": "2026-10-11T00:00:00.000Z",
              "expiresAt": "2026-10-11T01:00:00.000Z",
              "classification": "SYNTHETIC"
            }
          },
          "status": "INTERCEPTED",
          "receiptId": "08d0bf2eb4f2ea844b1b517563854e8a412ca05aac7f00ba040d8810a968d566",
          "canonicalPublisher": "marketplace-publishing/services/amazon-listings-publish-executor"
        },
        "orders": {
          "fixture-order-ba08c179c73a06746c33": {
            "order": {
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "workspaceId": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
              "storeId": "isolated",
              "brandId": "fixture",
              "supplierPlatform": "CJ_DROPSHIPPING",
              "connectorId": "cj-interceptor",
              "status": "DELIVERED",
              "fulfillmentStatus": "DELIVERED",
              "items": [
                {
                  "itemId": "line-1",
                  "supplierSku": "FIXTURE-ba08c179c73a06746c33",
                  "supplierProductId": "fixture-product-ba08c179c73a06746c33",
                  "title": "Synthetic organiser 3",
                  "quantity": 2,
                  "unitCost": 8,
                  "currency": "SGD"
                }
              ],
              "shippingAddress": {
                "fullName": "Synthetic Recipient",
                "addressLine1": "Fixture address",
                "city": "Singapore",
                "state": "Singapore",
                "postalCode": "000000",
                "countryCode": "SG",
                "phone": "00000000"
              },
              "estimatedCost": 16,
              "estimatedDeliveryDaysMin": 7,
              "estimatedDeliveryDaysMax": 10,
              "currency": "SGD",
              "approval": null,
              "supplierOrderId": null,
              "trackingNumber": null,
              "carrier": null,
              "trackingEvents": [],
              "integrationMode": "SANDBOX",
              "createdAt": "2026-10-11T00:00:00.000Z",
              "updatedAt": "2026-10-11T00:00:00.000Z"
            },
            "outcome": "DELIVERED",
            "accepted": 2,
            "shipped": 2,
            "delivered": 2,
            "tracking": [
              "tracking-shipped",
              "tracking-delivered"
            ],
            "lastTrackingAt": "2026-10-11T00:00:00.000Z",
            "shipments": {
              "fixture-shipment-ba08c179c73a06746c33": {
                "quantity": 2,
                "delivered": true,
                "carrier": "fixture-carrier",
                "tracking": "fixture-tracking"
              }
            },
            "remedies": [],
            "intentId": "711af31a6acc94afc8fdf48bf219030601625e5a3cf1230037d7317a176852b8",
            "providerId": "cj-intercepted-receipt"
          }
        },
        "financeReference": {
          "workspace": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
          "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
          "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8"
        },
        "sourceClassification": "SYNTHETIC",
        "title": "Synthetic organiser 3",
        "sku": "FIXTURE-ba08c179c73a06746c33",
        "phase": "APPROVED",
        "qualification": {
          "qualified": true,
          "reasons": [],
          "score": 87,
          "confidence": 1,
          "economics": {
            "input": {
              "productId": "fixture-product-ba08c179c73a06746c33",
              "supplierId": "CJ",
              "channel": "AMAZON",
              "country": "SG",
              "currency": "SGD",
              "sellingPrice": 40,
              "productCost": 8,
              "freight": 3,
              "fulfilment": 1,
              "feePercent": 15,
              "paymentPercent": 2,
              "advertising": 1,
              "refundRate": 0.05,
              "refundLoss": 12,
              "duties": 1,
              "tax": 1,
              "overhead": 1,
              "complete": true,
              "evidenceRefs": [
                "evidence-DEMAND",
                "evidence-COMPETITION",
                "evidence-DIFFERENTIATION",
                "evidence-QUALITY",
                "evidence-COMPLIANCE",
                "evidence-RETURNS",
                "evidence-MARKETPLACE",
                "evidence-PAYMENT"
              ],
              "assumptions": "Entirely synthetic isolated acceptance; not actual sales or supplier quotes."
            },
            "gross": 27,
            "contribution": 17.599999999999998,
            "net": 16.599999999999998,
            "breakEven": 20.000000000000004,
            "minimumViablePrice": 20.000000000000004,
            "marginPercent": 41.49999999999999,
            "status": "EVIDENCED_SCENARIO_NOT_ACTUAL",
            "genuinelyProfitable": false
          },
          "exposure": 25,
          "available": 980,
          "classification": "SYNTHETIC_OR_EVIDENCED_SCENARIO_NOT_ACTUAL",
          "genuinelyProfitable": false
        },
        "decisions": [],
        "finance": {
          "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
          "lifecycleComplete": true,
          "status": "COMPLETE_SIMULATION",
          "classification": "SIMULATION_EXCLUDED_FROM_ACTUALS",
          "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
          "planDigest": "ee8173507f147c265c0a4ca783cd124e5deedb9aa908ee92b9d3dd90dc7f3249",
          "assumptions": {
            "classification": "SIMULATION_ASSUMPTIONS_NOT_ACTUAL_CHARGES",
            "version": "SIM_FINANCE_V1",
            "feeBasis": "CANDIDATE_FEE_PLUS_PAYMENT_PERCENT",
            "dutyBasis": "CANDIDATE_DUTY_PLUS_TAX_PER_UNIT",
            "payout": "SIMULATED_HOLD_ONE_DAY_THEN_BANK",
            "supplierPayment": "SIMULATED_QUOTED_COST_FREIGHT_DUTY",
            "actualCashMovement": 0
          },
          "recordedEvents": 11,
          "totalEvents": 11,
          "financial": {
            "classification": "SIMULATION_EXCLUDED_FROM_ACTUALS",
            "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
            "work5Reference": "158242368742f02ab890e810fba6dc3dc767dc66f5bd4865692fdcf8765c53a9",
            "eventDigest": "2f5480d0e9c5bd4a48a5038ae29cd02c4076d2d124bbbd52d2014423393b31d6",
            "cutoffAt": "2026-10-12T00:01:00.000Z",
            "orders": [
              {
                "orderId": "fixture-order-ba08c179c73a06746c33",
                "currency": "SGD",
                "missing": [],
                "unknownIds": [],
                "contributionMinor": 4040,
                "realisedContributionMinor": 4040,
                "receivableMinor": 0,
                "settlementMinor": 0,
                "payoutHeldMinor": 0,
                "bankMinor": 4040,
                "liabilityMinor": 0,
                "cashNeedMinor": 0,
                "conserved": true,
                "complete": true
              }
            ],
            "duplicates": 0,
            "pending": [],
            "unknown": [],
            "balanced": true,
            "conserved": true,
            "complete": true,
            "actualCashMovement": 0,
            "actualRevenue": null,
            "actualProfit": null,
            "technologyCosts": "EXCLUDED_SEPARATE_COST_CENTRE",
            "fx": "NO_IMPLICIT_CONVERSION",
            "sourceVerification": "CANONICAL_IMMUTABLE_HISTORY_READ",
            "noncanonicalAmounts": "EXPLICIT_SIMULATION_ASSUMPTIONS_NOT_SOURCE_FACTS"
          },
          "actualCashMovement": 0,
          "simulatedCharges": [
            {
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "currency": "SGD",
              "feeMinor": 1360,
              "dutyAndTaxMinor": 400,
              "refundMinor": null
            }
          ],
          "events": [
            {
              "id": "sim:471e220a6f4f512174c56779a24450fdde25dce9d6802130289b7f17dc45c0b4",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "SALE",
              "currency": "SGD",
              "minor": 8000,
              "at": "2026-10-11T00:00:00.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:ce3b0009588334124d01d86fb84764a17e17bdbaea8f070523be3ca7eb0aa49b",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "COGS",
              "currency": "SGD",
              "minor": 1600,
              "at": "2026-10-11T00:00:01.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:104409b98e342f2579ece7acdfc9b7f6873ee1a296b80555cf78ff282fc82552",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "FREIGHT",
              "currency": "SGD",
              "minor": 600,
              "at": "2026-10-11T00:00:02.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:0ab8e5595d65b7054083c4ab78e200ae68f3f0e2671c82b5bea5cf2985be4349",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "FEE",
              "currency": "SGD",
              "minor": 1360,
              "at": "2026-10-11T00:00:03.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:33b214aff0485934daef8ac090513335d82473a85ebb7c5f1f5c5f4ef12684a9",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "DUTY",
              "currency": "SGD",
              "minor": 400,
              "at": "2026-10-11T00:00:04.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:36aa1c54e6f3509fd059b4a6f18d44d55506331a86198792acf15c481e5f3814",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "DISCOUNT",
              "currency": "SGD",
              "minor": 0,
              "at": "2026-10-11T00:00:05.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:f355ed1ac7bb707605f0b0c358491ed3af8848bc6c7123fcdfdce119de261f82",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "SETTLEMENT",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-11T00:00:06.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:6cdb57d385e1e6ac76c0eaea10b990516d9ce614ce3c19a5924f2874c19611c3",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "PAYOUT_HOLD",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-11T00:00:07.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:f3322d507af987bcddc19473bb5d7c7e9c33b44d1f8fb2fd0390c18f9cedd653",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "SUPPLIER_PAYMENT",
              "currency": "SGD",
              "minor": 2600,
              "at": "2026-10-11T00:00:08.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:3128580f45dfbafcad63c7eaba7c1226bbab2e7d34a5409074f9925cad6c761c",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "PAYOUT_RELEASE",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-12T00:00:09.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:a259d6345d2103cefadf84f026f3b1faa4e90d6decc199c41d55ed62de671eea",
              "orderId": "fixture-order-ba08c179c73a06746c33",
              "sourceReceiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
              "kind": "BANK_RECEIPT",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-12T00:00:10.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            }
          ]
        }
      },
      {
        "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
        "receiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
        "version": 10,
        "productId": "fixture-product-de3ce2856387d06ce1c0",
        "variantId": "fixture-variant-de3ce2856387d06ce1c0",
        "listing": {
          "productId": "fixture-product-de3ce2856387d06ce1c0",
          "title": "Synthetic organiser 1",
          "bullets": [
            "Synthetic dimensions for acceptance only"
          ],
          "description": "Synthetic listing package, not intended for marketplace publication.",
          "category": "HOME_STORAGE",
          "attributes": {
            "material": "fixture"
          },
          "variants": [
            {
              "sku": "FIXTURE-de3ce2856387d06ce1c0",
              "variantId": "fixture-variant-de3ce2856387d06ce1c0",
              "dimensions": "10x10x10 cm fixture"
            }
          ],
          "images": [
            {
              "url": "https://example.invalid/fixture.png",
              "license": "Synthetic acceptance image manifest; no actual media licensed",
              "rightsEvidence": "evidence-QUALITY",
              "sha256": "ecf5bc501c5a4b57073420da4f16b0abc7b0a5ca26e30494b3f911d68e0f024f"
            }
          ],
          "claims": [
            {
              "text": "Synthetic fixture",
              "evidenceId": "evidence-QUALITY"
            }
          ],
          "sourceEvidence": [
            "evidence-DEMAND",
            "evidence-COMPETITION",
            "evidence-DIFFERENTIATION",
            "evidence-QUALITY",
            "evidence-COMPLIANCE",
            "evidence-RETURNS",
            "evidence-MARKETPLACE",
            "evidence-PAYMENT"
          ]
        },
        "publication": {
          "capacity": {
            "account": "isolated-fixture",
            "marketplace": "SG",
            "mode": "NEW_ASIN",
            "asin": null,
            "newAsinRemaining": 1000,
            "unsoldRemaining": 1000,
            "requestsPerSecond": 1,
            "eligibility": "ELIGIBLE",
            "provenance": {
              "source": "work6-deterministic-acceptance",
              "reference": "synthetic:work6-fixture-not-provider-evidence",
              "sha256": "ac1d1be57de78abe02f9f5c3cbba30df7db9bcef061d746d31f60879795c15fd",
              "observedAt": "2026-10-11T00:00:00.000Z",
              "expiresAt": "2026-10-11T01:00:00.000Z",
              "classification": "SYNTHETIC"
            }
          },
          "status": "INTERCEPTED",
          "receiptId": "d63dab3477a121f2300e79e80d090f9dbe25ee3a02a4f8d99a24e2499a276003",
          "canonicalPublisher": "marketplace-publishing/services/amazon-listings-publish-executor"
        },
        "orders": {
          "fixture-order-de3ce2856387d06ce1c0": {
            "order": {
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "workspaceId": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
              "storeId": "isolated",
              "brandId": "fixture",
              "supplierPlatform": "CJ_DROPSHIPPING",
              "connectorId": "cj-interceptor",
              "status": "DELIVERED",
              "fulfillmentStatus": "DELIVERED",
              "items": [
                {
                  "itemId": "line-1",
                  "supplierSku": "FIXTURE-de3ce2856387d06ce1c0",
                  "supplierProductId": "fixture-product-de3ce2856387d06ce1c0",
                  "title": "Synthetic organiser 1",
                  "quantity": 2,
                  "unitCost": 8,
                  "currency": "SGD"
                }
              ],
              "shippingAddress": {
                "fullName": "Synthetic Recipient",
                "addressLine1": "Fixture address",
                "city": "Singapore",
                "state": "Singapore",
                "postalCode": "000000",
                "countryCode": "SG",
                "phone": "00000000"
              },
              "estimatedCost": 16,
              "estimatedDeliveryDaysMin": 7,
              "estimatedDeliveryDaysMax": 10,
              "currency": "SGD",
              "approval": null,
              "supplierOrderId": null,
              "trackingNumber": null,
              "carrier": null,
              "trackingEvents": [],
              "integrationMode": "SANDBOX",
              "createdAt": "2026-10-11T00:00:00.000Z",
              "updatedAt": "2026-10-11T00:00:00.000Z"
            },
            "outcome": "DELIVERED",
            "accepted": 2,
            "shipped": 2,
            "delivered": 2,
            "tracking": [
              "tracking-shipped",
              "tracking-delivered"
            ],
            "lastTrackingAt": "2026-10-11T00:00:00.000Z",
            "shipments": {
              "fixture-shipment-de3ce2856387d06ce1c0": {
                "quantity": 2,
                "delivered": true,
                "carrier": "fixture-carrier",
                "tracking": "fixture-tracking"
              }
            },
            "remedies": [],
            "intentId": "02f192afd465f6be55aa1608b24dab92a274e4aa974769fcb0c8a190697b71bc",
            "providerId": "cj-intercepted-receipt"
          }
        },
        "financeReference": {
          "workspace": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
          "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
          "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd"
        },
        "sourceClassification": "SYNTHETIC",
        "title": "Synthetic organiser 1",
        "sku": "FIXTURE-de3ce2856387d06ce1c0",
        "phase": "APPROVED",
        "qualification": {
          "qualified": true,
          "reasons": [],
          "score": 87,
          "confidence": 1,
          "economics": {
            "input": {
              "productId": "fixture-product-de3ce2856387d06ce1c0",
              "supplierId": "CJ",
              "channel": "AMAZON",
              "country": "SG",
              "currency": "SGD",
              "sellingPrice": 40,
              "productCost": 8,
              "freight": 3,
              "fulfilment": 1,
              "feePercent": 15,
              "paymentPercent": 2,
              "advertising": 1,
              "refundRate": 0.05,
              "refundLoss": 12,
              "duties": 1,
              "tax": 1,
              "overhead": 1,
              "complete": true,
              "evidenceRefs": [
                "evidence-DEMAND",
                "evidence-COMPETITION",
                "evidence-DIFFERENTIATION",
                "evidence-QUALITY",
                "evidence-COMPLIANCE",
                "evidence-RETURNS",
                "evidence-MARKETPLACE",
                "evidence-PAYMENT"
              ],
              "assumptions": "Entirely synthetic isolated acceptance; not actual sales or supplier quotes."
            },
            "gross": 27,
            "contribution": 17.599999999999998,
            "net": 16.599999999999998,
            "breakEven": 20.000000000000004,
            "minimumViablePrice": 20.000000000000004,
            "marginPercent": 41.49999999999999,
            "status": "EVIDENCED_SCENARIO_NOT_ACTUAL",
            "genuinelyProfitable": false
          },
          "exposure": 25,
          "available": 980,
          "classification": "SYNTHETIC_OR_EVIDENCED_SCENARIO_NOT_ACTUAL",
          "genuinelyProfitable": false
        },
        "decisions": [],
        "finance": {
          "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
          "lifecycleComplete": true,
          "status": "COMPLETE_SIMULATION",
          "classification": "SIMULATION_EXCLUDED_FROM_ACTUALS",
          "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
          "planDigest": "2c533a034c3ffed9db567b58fb1fd6f957597974567793ef29b5bc906f88b05c",
          "assumptions": {
            "classification": "SIMULATION_ASSUMPTIONS_NOT_ACTUAL_CHARGES",
            "version": "SIM_FINANCE_V1",
            "feeBasis": "CANDIDATE_FEE_PLUS_PAYMENT_PERCENT",
            "dutyBasis": "CANDIDATE_DUTY_PLUS_TAX_PER_UNIT",
            "payout": "SIMULATED_HOLD_ONE_DAY_THEN_BANK",
            "supplierPayment": "SIMULATED_QUOTED_COST_FREIGHT_DUTY",
            "actualCashMovement": 0
          },
          "recordedEvents": 11,
          "totalEvents": 11,
          "financial": {
            "classification": "SIMULATION_EXCLUDED_FROM_ACTUALS",
            "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
            "work5Reference": "158242368742f02ab890e810fba6dc3dc767dc66f5bd4865692fdcf8765c53a9",
            "eventDigest": "72a39f7fa24c5e7de759b024afb620671025a47b51752e2e2407183de72881f5",
            "cutoffAt": "2026-10-12T00:01:00.000Z",
            "orders": [
              {
                "orderId": "fixture-order-de3ce2856387d06ce1c0",
                "currency": "SGD",
                "missing": [],
                "unknownIds": [],
                "contributionMinor": 4040,
                "realisedContributionMinor": 4040,
                "receivableMinor": 0,
                "settlementMinor": 0,
                "payoutHeldMinor": 0,
                "bankMinor": 4040,
                "liabilityMinor": 0,
                "cashNeedMinor": 0,
                "conserved": true,
                "complete": true
              }
            ],
            "duplicates": 0,
            "pending": [],
            "unknown": [],
            "balanced": true,
            "conserved": true,
            "complete": true,
            "actualCashMovement": 0,
            "actualRevenue": null,
            "actualProfit": null,
            "technologyCosts": "EXCLUDED_SEPARATE_COST_CENTRE",
            "fx": "NO_IMPLICIT_CONVERSION",
            "sourceVerification": "CANONICAL_IMMUTABLE_HISTORY_READ",
            "noncanonicalAmounts": "EXPLICIT_SIMULATION_ASSUMPTIONS_NOT_SOURCE_FACTS"
          },
          "actualCashMovement": 0,
          "simulatedCharges": [
            {
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "currency": "SGD",
              "feeMinor": 1360,
              "dutyAndTaxMinor": 400,
              "refundMinor": null
            }
          ],
          "events": [
            {
              "id": "sim:6b66741e22e5989d040c6d28cd2afe816f9c43e56288956bbdfd68ccfd5acdce",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "SALE",
              "currency": "SGD",
              "minor": 8000,
              "at": "2026-10-11T00:00:00.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:e78d28c1eb0a4bc4633b0d075699c86727ade03e81cfda0ab337475a1a52e070",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "COGS",
              "currency": "SGD",
              "minor": 1600,
              "at": "2026-10-11T00:00:01.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:bd53b002eaac3bb363b942ae99c0886d78e543d48ba318562d256b0d4aa0ee53",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "FREIGHT",
              "currency": "SGD",
              "minor": 600,
              "at": "2026-10-11T00:00:02.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:5b521d1996ec004c79c19020584734f0dd8f6c7b14c90fa0954dc10f3440df98",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "FEE",
              "currency": "SGD",
              "minor": 1360,
              "at": "2026-10-11T00:00:03.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:641572393ec4e44eddf8a2c7b0188f11a4801caab9c0c5601ee0de6db75bad65",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "DUTY",
              "currency": "SGD",
              "minor": 400,
              "at": "2026-10-11T00:00:04.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:8dcd1276425cfdf5c1fd8113fb7ade6858368ec98d1aee24ca0e634e8bd378a2",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "DISCOUNT",
              "currency": "SGD",
              "minor": 0,
              "at": "2026-10-11T00:00:05.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:9271b8e20caeddffe7801c3095031ef41a8a9633ad29962ef2b5303a19ed1a24",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "SETTLEMENT",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-11T00:00:06.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:ba945e270f1ffbea0930df8ccc0cfd7040c6c440b0b26d59f9b78552870d89b4",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "PAYOUT_HOLD",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-11T00:00:07.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:7ddc5eaf3167d019c14124b6c978ca51ba360bf0190911de964b62cbe1b367da",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "SUPPLIER_PAYMENT",
              "currency": "SGD",
              "minor": 2600,
              "at": "2026-10-11T00:00:08.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:7c4ef6885c2fdd7ccde790780d6285fc98e2fe35ec672565e5a4ad850607f5c9",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "PAYOUT_RELEASE",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-12T00:00:09.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            },
            {
              "id": "sim:66c4b98c62dcb36bbe17091d35cf17a48f6de695164c81d6a5aff02d1be8c5b5",
              "orderId": "fixture-order-de3ce2856387d06ce1c0",
              "sourceReceiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
              "kind": "BANK_RECEIPT",
              "currency": "SGD",
              "minor": 6640,
              "at": "2026-10-12T00:00:10.000Z",
              "classification": "SIMULATION",
              "assumptionRef": "synthetic:SIM_FINANCE_V1:5210db6ca85eb9fd8930b74236832b971f1798bc11cfdd1b6ff67ceb913526e6"
            }
          ]
        }
      }
    ],
    "next": null,
    "coverage": "BOUNDED_PAGE",
    "actualCashMovement": 0,
    "liveCommerce": "LOCKED",
    "birth": "NOT_BORN",
    "authority": {
      "grant": {
        "workspace": "ws",
        "owner": "owner",
        "id": "renew",
        "sessionId": "exam",
        "version": 2,
        "action": "GRANT",
        "mode": "ONE_HOUR",
        "at": 1791763260000,
        "expiresAt": 1791766860000,
        "requestDigest": "dcfb678976cb3afcc1098b6200da70aeee53a166645ec996d8b8a6cac619c78e",
        "previous": "08e9883843332c7f3b08754b73b8c30d68eace7f86a6cbca4ae8d509c42b09db",
        "scope": "TWIN_SCHEDULER_ONLY",
        "digest": "bef5ce23c3754ba023995ca422fcbfb603444c93ed52a5f3885e32536fbca98e"
      },
      "version": 2,
      "status": "ACTIVE",
      "scope": "TWIN_SCHEDULER_ONLY",
      "externalEffects": 0
    },
    "tasks": [
      {
        "id": "twin-exam:ba08c179c73a06746c33",
        "mission": "acceptance:twin-exam:ba08c179c73a06746c33",
        "workspace": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
        "owner": "owner",
        "createdAt": 1791676800000,
        "cursor": 10,
        "fence": 10,
        "status": "COMPLETE",
        "error": null,
        "attempts": 0,
        "maxSteps": 32,
        "maxAttempts": 3,
        "paidInference": 0,
        "stepCount": 10
      },
      {
        "id": "twin-exam:5f1e4e198aa2c66b0bd1",
        "mission": "acceptance:twin-exam:5f1e4e198aa2c66b0bd1",
        "workspace": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
        "owner": "owner",
        "createdAt": 1791676800000,
        "cursor": 10,
        "fence": 10,
        "status": "COMPLETE",
        "error": null,
        "attempts": 0,
        "maxSteps": 32,
        "maxAttempts": 3,
        "paidInference": 0,
        "stepCount": 10
      },
      {
        "id": "twin-exam:de3ce2856387d06ce1c0",
        "mission": "acceptance:twin-exam:de3ce2856387d06ce1c0",
        "workspace": "twin_b76b2d1f33e29323ce2bf4da28690ee36fff8d17f3ef88f9",
        "owner": "owner",
        "createdAt": 1791676800000,
        "cursor": 10,
        "fence": 10,
        "status": "COMPLETE",
        "error": null,
        "attempts": 0,
        "maxSteps": 32,
        "maxAttempts": 3,
        "paidInference": 0,
        "stepCount": 10
      }
    ],
    "assurance": {
      "probes": [
        {
          "id": "work8-checkpoint:0be57fd59df4c7b6b7dd9fb8c67b104d47bd3e72d7bcd044c6076aa3c24bde33",
          "capability": "commerce-checkpoint",
          "classification": "COMMITTED_RECEIPT_CURSOR_GAP",
          "severity": "HIGH",
          "status": "HEALTHY",
          "summary": "Saved task progress matches independently verified commerce receipts.",
          "evidence": {
            "taskId": "twin-exam:ba08c179c73a06746c33",
            "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
            "cursor": 10,
            "fence": 10,
            "prefixDigest": "0e6a2d5af0bbcdaa9670db12a14f093ff56f8d4535238c9dd90bd17878a1f52a",
            "receiptDigest": "07de9ce21f7915b7d85527c8cb379333ff4850cc6eb0ef5fbde182d267f192f8",
            "observedAt": 1791763260000,
            "externalEffects": 0
          },
          "runbookId": null
        },
        {
          "id": "work8-checkpoint:f2f1a79123682c6ac6f4aebfea93a7cf6e1a59754a81d0398c2c9dfe60cf3b46",
          "capability": "commerce-checkpoint",
          "classification": "COMMITTED_RECEIPT_CURSOR_GAP",
          "severity": "HIGH",
          "status": "HEALTHY",
          "summary": "Saved task progress matches independently verified commerce receipts.",
          "evidence": {
            "taskId": "twin-exam:5f1e4e198aa2c66b0bd1",
            "missionId": "acceptance:twin-exam:5f1e4e198aa2c66b0bd1",
            "cursor": 10,
            "fence": 10,
            "prefixDigest": "695fa037b911ece563000e4ecb0339a12dc9b291c668f1c871f14ee55b0e91a9",
            "receiptDigest": "b36dd9e48fe8fd3817fd42d7207a36b2796f2e3469cae6a0de8fee0107dabed8",
            "observedAt": 1791763260000,
            "externalEffects": 0
          },
          "runbookId": null
        },
        {
          "id": "work8-checkpoint:661e91b7714d751b0eb641e6eb5c05c4ff80a85b4c03751c0ceb0ae424cd3acd",
          "capability": "commerce-checkpoint",
          "classification": "COMMITTED_RECEIPT_CURSOR_GAP",
          "severity": "HIGH",
          "status": "HEALTHY",
          "summary": "Saved task progress matches independently verified commerce receipts.",
          "evidence": {
            "taskId": "twin-exam:de3ce2856387d06ce1c0",
            "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
            "cursor": 10,
            "fence": 10,
            "prefixDigest": "71599772b491ca5f20abbd53f905a92fd440ba655eb8213586bbedf54d317ccb",
            "receiptDigest": "d1e3ae495b198a1833713914379822a45c06e21b298ad0799765e58557db92dd",
            "observedAt": 1791763260000,
            "externalEffects": 0
          },
          "runbookId": null
        }
      ],
      "observations": [
        {
          "id": "e15e51e190ac2c6e7f859694553b63252c8c59fcde846a38765d003ee4bcdb98",
          "kind": "ASSURANCE_ESCALATION",
          "reason": "TWIN_AUTHORITY_EXPIRED",
          "observedAt": 1791763260000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "8045ceda2280c6a47cd0cafeb62564417345bae15105d3c89d1b5bb426f8e1f3",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:ba08c179c73a06746c33",
          "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
          "cursor": 10,
          "status": "COMPLETE",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "2104bf2810a6a11302e19ac964d3c98293e39cf761dc1e9b4763662a58b4a619",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:ba08c179c73a06746c33",
          "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
          "cursor": 8,
          "status": "RUNNING",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "ee726f9b0b57bfa7d2e8de0d8fd0ace77578dba38ae8d3cb1b4ff8a1dd75a91d",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:ba08c179c73a06746c33",
          "missionId": "acceptance:twin-exam:ba08c179c73a06746c33",
          "cursor": 4,
          "status": "RUNNING",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "22c58e422c075f0ba3b5a027c32e8f7eccf1672e3641c8fb41dc693a7e332477",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:5f1e4e198aa2c66b0bd1",
          "missionId": "acceptance:twin-exam:5f1e4e198aa2c66b0bd1",
          "cursor": 10,
          "status": "COMPLETE",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "76d6c3ae276ea84f624167b49d9b6838c60076a8194690b152438c3643942131",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:5f1e4e198aa2c66b0bd1",
          "missionId": "acceptance:twin-exam:5f1e4e198aa2c66b0bd1",
          "cursor": 8,
          "status": "RUNNING",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "5e35f748f1a5ebbefc6a5753fd1b4a003ed998259f5e6aab7ac6e6a3939b4bc3",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:5f1e4e198aa2c66b0bd1",
          "missionId": "acceptance:twin-exam:5f1e4e198aa2c66b0bd1",
          "cursor": 4,
          "status": "RUNNING",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "68b9ec3132644ddb5c998e44855aaef6cb9d4bc7e37dfea0ba542e0a8adcd886",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:de3ce2856387d06ce1c0",
          "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
          "cursor": 10,
          "status": "COMPLETE",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "d311811c653cbef19c19dbb11a8fb560f91781410663f8a8877eb6a6e16ba8b9",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:de3ce2856387d06ce1c0",
          "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
          "cursor": 9,
          "status": "RUNNING",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "d7b23f5f2ab011964d1679af27fb83f1a18cd10739fad55a003dcb3c9b7d422d",
          "kind": "SCHEDULER_PROGRESS",
          "taskId": "twin-exam:de3ce2856387d06ce1c0",
          "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
          "cursor": 5,
          "status": "RUNNING",
          "error": null,
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "0ce38537498aa9289e6b5e3daf2db0b3ed9bf1fe770cb476739112c015ca68f3",
          "kind": "ASSURANCE_RECOVERED",
          "probeId": "work8-checkpoint:661e91b7714d751b0eb641e6eb5c05c4ff80a85b4c03751c0ceb0ae424cd3acd",
          "taskId": "twin-exam:de3ce2856387d06ce1c0",
          "receiptDigest": "be6eadc63019f0a01305029369272a3ebf6afd176c7dd9c1479a96060e5872f0",
          "historyDigest": "2946dc43f41de15076ce1134f08a8a75e45c3b4a30cb2235606b3cac0a575a77",
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "7f6a8161bd4d7c8cf82b2a204de7ee5ef66f2a865f61445fb21be53ed102b508",
          "kind": "ASSURANCE_DETECTED",
          "probeId": "work8-checkpoint:661e91b7714d751b0eb641e6eb5c05c4ff80a85b4c03751c0ceb0ae424cd3acd",
          "status": "FAILED",
          "taskId": "twin-exam:de3ce2856387d06ce1c0",
          "receiptDigest": "be6eadc63019f0a01305029369272a3ebf6afd176c7dd9c1479a96060e5872f0",
          "observedAt": 1791676800000,
          "classification": "SIMULATED_OPERATIONS",
          "externalEffects": 0
        },
        {
          "id": "fault:gap",
          "requestDigest": "de0f45d35878f744aa576e6a72dc7a9e3d20d1f99c290b827f472f3b900d8678",
          "kind": "COMMITTED_RECEIPT_CURSOR_GAP",
          "taskId": "twin-exam:de3ce2856387d06ce1c0",
          "missionId": "acceptance:twin-exam:de3ce2856387d06ce1c0",
          "classification": "CONTROLLED_SIMULATED_FAULT",
          "externalEffects": 0
        }
      ],
      "coverage": "LATEST_100_OBSERVATIONS"
    },
    "scheduler": {
      "mode": "BOUNDED_CANONICAL_WORKER",
      "intervalMs": 5000
    },
    "sourceNotice": "Labelled test fixtures are not genuine supplier qualification. No actual money or goods move."
  },
  "counts": [
    30,
    33
  ],
  "checks": {
    "distinctProducts": 3,
    "deliveredOrders": 3,
    "settlementComplete": true,
    "checkpointRecovery": true,
    "pauseFreeze": true,
    "coldRestartNoDuplicates": true,
    "actualCashMovement": 0
  }
}