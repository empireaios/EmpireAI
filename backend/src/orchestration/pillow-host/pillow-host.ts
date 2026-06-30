import { randomUUID } from "node:crypto";

import {
  createOpenAIIntegrationLayer,
  resetPillowSession,
  startPillow,
  type OpenAIIntegrationLayer,
  type PillowSession,
} from "@empireai/pillow";
import type { LLMRouter } from "../../brain/llm/llm-router.js";
import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { logger } from "../../config/logger.js";
import { ApprovalGateEngine } from "../pillow-approval/approval-gate-engine.js";
import { CursorBridgeAdapter } from "../pillow-approval/cursor-bridge-adapter.js";
import { CursorHeartbeatService } from "../pillow-approval/cursor-heartbeat-service.js";
import { SqlitePillowApprovalRepository } from "../pillow-approval/repository/sqlite-pillow-approval-repository.js";
import {
  buildReasoningBundleForWorkspace,
  ensureExecutiveLearningTables,
  observeExecutiveConversation,
} from "../executive-learning/index.js";
import {
  ensurePillowExecutiveCouncilTables,
  runAndStoreExecutiveCouncil,
} from "../pillow-executive-council/index.js";
import { isPillowProductionModeEnabled } from "../version-1-activation/version-1-activation-config.js";
import {
  shouldRunExecutiveCouncil,
  summarizeProposalTopic,
  inferSubjectType,
  type CeoExecutiveRecommendation,
} from "@empireai/pillow";
import { createBrainLLMAdapter } from "./brain-llm-adapter.js";
import { newPillowRequestId, PillowRequestLogger } from "./pillow-logger.js";
import { formatPillowWorkspaceContext } from "./workspace-context.js";
import { resolvePillowRepositoryRoot } from "./resolve-repo-root.js";
import { PillowSessionStore } from "./session-store.js";
import type {
  PillowHealthState,
  PillowHostStatus,
  RoutePromptInput,
  RoutePromptResult,
  WorkspaceSession,
} from "./types.js";

const HEARTBEAT_INTERVAL_MS = 30_000;
const IDLE_AFTER_MS = 120_000;

export class PillowSessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Pillow workspace session not found: ${sessionId}`);
    this.name = "PillowSessionNotFoundError";
  }
}

export class PillowHostNotRunningError extends Error {
  constructor() {
    super("Pillow host is not running");
    this.name = "PillowHostNotRunningError";
  }
}

export interface PillowHostConfigureOptions {
  llmRouter: LLMRouter;
  auditLogger?: AuditLogger;
  repoRoot?: string;
}

/**
 * PILLOW-016 — Brain Integration Layer host singleton.
 * Hosts @empireai/pillow in-process and routes inference through Brain LLMRouter.
 */
export class PillowHost {
  private lifecycle: PillowHostStatus["lifecycle"] = "stopped";
  private health: PillowHealthState = "Idle";
  private startedAt: string | null = null;
  private stoppedAt: string | null = null;
  private lastHeartbeatAt: string | null = null;
  private lastActivityAt: number | null = null;
  private lastError: string | null = null;
  private activeRequests = 0;
  private repositoryRoot: string | null = null;

  private llmRouter: LLMRouter | null = null;
  private auditLogger: AuditLogger | undefined;
  private repoRootOverride: string | undefined;

  private pillowSession: PillowSession | null = null;
  private llmLayer: OpenAIIntegrationLayer | null = null;
  private readonly sessionStore = new PillowSessionStore();
  private requestLogger = new PillowRequestLogger();

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private approvalGate: ApprovalGateEngine | null = null;
  private cursorBridge: CursorBridgeAdapter | null = null;

  configure(options: PillowHostConfigureOptions): void {
    this.llmRouter = options.llmRouter;
    this.auditLogger = options.auditLogger;
    this.repoRootOverride = options.repoRoot;
    this.requestLogger = new PillowRequestLogger(options.auditLogger);
  }

  async startPillow(): Promise<void> {
    if (this.lifecycle === "running" || this.lifecycle === "starting") {
      return;
    }

    if (!this.llmRouter) {
      throw new Error("PillowHost.configure() must be called before startPillow()");
    }

    this.lifecycle = "starting";
    this.health = "Recovering";
    this.lastError = null;

    try {
      this.repositoryRoot = await resolvePillowRepositoryRoot(this.repoRootOverride);
      resetPillowSession();

      const pillowProductionMode = isPillowProductionModeEnabled();
      this.pillowSession = await startPillow({
        repositoryRoot: this.repositoryRoot,
        dryRunRecoveryValidation: !pillowProductionMode,
        dryRunSyncExecution: !pillowProductionMode,
      });

      const adapter = createBrainLLMAdapter(this.llmRouter);
      this.llmLayer = createOpenAIIntegrationLayer(adapter);

      this.initializeApprovalLayer();
      ensureExecutiveLearningTables();
      ensurePillowExecutiveCouncilTables();

      this.startedAt = new Date().toISOString();
      this.stoppedAt = null;
      this.lifecycle = "running";
      this.health = "Running";
      this.lastActivityAt = Date.now();
      this.tickHeartbeat();
      this.startHeartbeat();

      this.auditLogger?.write({
        action: "pillow.startup",
        actor: "pillow-host",
        workspaceId: "system",
        correlationId: randomUUID(),
        metadata: {
          repositoryRoot: this.repositoryRoot,
          llmProviders: this.llmLayer.listAvailableProviders(),
          journeyPosition: this.pillowSession.bootstrap.journeyPosition,
          currentMission: this.pillowSession.bootstrap.currentMission,
        },
      });

      logger.info(
        {
          repositoryRoot: this.repositoryRoot,
          llmProviders: this.llmLayer.listAvailableProviders(),
        },
        "Pillow host started (PILLOW-016)",
      );
    } catch (error) {
      this.lifecycle = "error";
      this.health = "Error";
      this.lastError = error instanceof Error ? error.message : String(error);
      this.pillowSession = null;
      this.llmLayer = null;
      logger.error({ error: this.lastError }, "Pillow host failed to start");
      throw error;
    }
  }

  async stopPillow(): Promise<void> {
    if (this.lifecycle === "stopped" || this.lifecycle === "stopping") {
      return;
    }

    this.lifecycle = "stopping";
    this.health = "Recovering";

    this.stopHeartbeat();
    resetPillowSession();
    this.pillowSession = null;
    this.llmLayer = null;
    this.approvalGate = null;
    this.cursorBridge = null;
    this.sessionStore.clear();
    this.requestLogger.clear();

    this.stoppedAt = new Date().toISOString();
    this.lifecycle = "stopped";
    this.health = "Idle";

    this.auditLogger?.write({
      action: "pillow.shutdown",
      actor: "pillow-host",
      workspaceId: "system",
      correlationId: randomUUID(),
      metadata: { stoppedAt: this.stoppedAt },
    });

    logger.info("Pillow host stopped");
  }

  getStatus(): PillowHostStatus {
    const bootstrap = this.pillowSession?.bootstrap;
    return {
      lifecycle: this.lifecycle,
      health: this.getHealth(),
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      lastHeartbeatAt: this.lastHeartbeatAt,
      lastError: this.lastError,
      activeRequests: this.activeRequests,
      activeSessions: this.sessionStore.count(),
      repositoryRoot: this.repositoryRoot,
      repositoryFingerprint:
        this.pillowSession?.contextBuilder.repositoryFingerprint ?? null,
      journeyPosition: bootstrap?.journeyPosition ?? null,
      currentMission: bootstrap?.currentMission ?? null,
      llmProviders: this.llmLayer?.listAvailableProviders() ?? [],
      pillowVersion: "PILLOW-016",
      missionId: "PILLOW-016",
    };
  }

  getHealth(): PillowHealthState {
    if (this.lifecycle === "error") return "Error";
    if (this.lifecycle === "starting" || this.lifecycle === "stopping") {
      return "Recovering";
    }
    if (this.activeRequests > 0) return "Busy";
    if (this.lifecycle !== "running") return "Idle";
    if (
      this.lastActivityAt &&
      Date.now() - this.lastActivityAt > IDLE_AFTER_MS
    ) {
      return "Idle";
    }
    return "Running";
  }

  tickHeartbeat(): void {
    this.lastHeartbeatAt = new Date().toISOString();
    if (this.lifecycle === "running" && this.activeRequests === 0) {
      this.health = this.getHealth();
    }
  }

  createSession(workspaceId: string): WorkspaceSession {
    this.ensureRunning();
    const bootstrap = this.pillowSession!.bootstrap;
    const session = this.sessionStore.create(workspaceId, {
      repositoryFingerprint:
        this.pillowSession!.contextBuilder.repositoryFingerprint,
      currentMission: bootstrap.currentMission,
    });

    this.touchActivity();
    this.auditLogger?.write({
      action: "pillow.session.create",
      actor: "pillow-host",
      workspaceId,
      correlationId: session.sessionId,
      metadata: { sessionId: session.sessionId },
    });

    return session;
  }

  destroySession(workspaceId: string, sessionId: string): boolean {
    const removed = this.sessionStore.destroy(workspaceId, sessionId);
    if (removed) {
      this.auditLogger?.write({
        action: "pillow.session.destroy",
        actor: "pillow-host",
        workspaceId,
        correlationId: sessionId,
        metadata: { sessionId },
      });
    }
    return removed;
  }

  getSession(workspaceId: string, sessionId: string): WorkspaceSession | null {
    return this.sessionStore.get(workspaceId, sessionId);
  }

  listRequestLogs(filters?: {
    workspaceId?: string;
    sessionId?: string;
    limit?: number;
  }) {
    return this.requestLogger.list(filters);
  }

  getApprovalGate(): ApprovalGateEngine {
    this.ensureRunning();
    if (!this.approvalGate) {
      throw new Error("Pillow approval gate not initialized");
    }
    return this.approvalGate;
  }

  getCursorBridge(): CursorBridgeAdapter {
    this.ensureRunning();
    if (!this.cursorBridge) {
      throw new Error("Pillow cursor bridge not initialized");
    }
    return this.cursorBridge;
  }

  getObjectiveDashboard() {
    this.ensureRunning();
    return this.pillowSession!.objective.getDashboardState();
  }

  private initializeApprovalLayer(): void {
    if (!this.repositoryRoot) return;
    this.approvalGate = new ApprovalGateEngine(this.auditLogger, (input) => {
      const session = this.pillowSession;
      if (!session) {
        return {
          allowed: true,
          alignment: "objective_aligned" as const,
          reason: "Pillow session unavailable",
        };
      }

      const grandKingOverride = input.proposal.metadata?.grandKingOverride === true;
      const { proceed, evaluation } = session.autonomousRuntime.prepareForExecution({
        title: input.proposal.title,
        summary: input.proposal.summary,
        missionId: input.proposal.missionId,
        grandKingOverride,
      });

      if (!proceed && !grandKingOverride) {
        session.objective.routeToVault({
          title: input.proposal.title,
          summary: input.proposal.summary,
          missionId: input.proposal.missionId,
        });
      }

      return {
        allowed: proceed || grandKingOverride,
        alignment: grandKingOverride
          ? "requires_grand_king_override"
          : evaluation.alignment,
        reason: evaluation.reason,
        storedInVault: evaluation.storedInVault,
      };
    });
    const repository = new SqlitePillowApprovalRepository();
    const heartbeat = new CursorHeartbeatService(repository);
    const pillowProductionMode = isPillowProductionModeEnabled();
    this.cursorBridge = new CursorBridgeAdapter(
      () => this.pillowSession,
      repository,
      heartbeat,
      {
        dryRunLaunch: !pillowProductionMode,
        repositoryRoot: this.repositoryRoot,
      },
      this.auditLogger,
    );
    this.approvalGate.attachCursorBridge(this.cursorBridge);
  }

  async routePrompt(input: RoutePromptInput): Promise<RoutePromptResult> {
    this.ensureRunning();

    const session = this.sessionStore.get(input.workspaceId, input.sessionId);
    if (!session) {
      throw new PillowSessionNotFoundError(input.sessionId);
    }

    const requestId = newPillowRequestId();
    const started = performance.now();
    this.activeRequests++;
    this.health = "Busy";

    const userTurn = {
      role: "user" as const,
      content: input.message,
      timestamp: new Date().toISOString(),
      requestId,
    };
    session.conversationHistory.push(userTurn);

    const llmUserMessage = input.workspaceContext
      ? `${formatPillowWorkspaceContext(input.workspaceContext)}\n\nGrand King: ${input.message}`
      : input.message;

    try {
      const pillow = this.pillowSession!;
      const commandResponse = await pillow.command.processCommand({
        command: input.message,
        skipAutonomousPause: true,
      });

      const operationalContext = await pillow.contextBuilder.build({
        userMessage: input.message,
      });
      const executiveReasoning = pillow.executiveDirection.composeReasoningCycle(
        input.message,
      );
      const objectiveState = pillow.objective.getDashboardState();
      const executiveLearningBundle = buildReasoningBundleForWorkspace({
        workspaceId: input.workspaceId,
        currentObjective: objectiveState.currentObjective.title ?? null,
        executiveConstitutionSummary: executiveReasoning.briefingAnchor,
        executivePerspectives: executiveReasoning.executiveReasoningNotes,
      });
      const contextWithReasoning = {
        ...operationalContext,
        executiveReasoning,
      };

      session.repositoryFingerprint =
        operationalContext.manifest.repositoryFingerprint;
      session.currentMission =
        operationalContext.intelligenceSnapshot.currentMission ??
        pillow.bootstrap.currentMission;

      let message = commandResponse.message;
      let kind: RoutePromptResult["kind"] = "command_fallback";
      let provider: RoutePromptResult["provider"];
      let model: string | undefined;
      let mode: string | undefined;
      let tokens: RoutePromptResult["tokens"];
      let logResult: "success" | "fallback" | "error" = "fallback";

      let executiveCouncilRecommendation: CeoExecutiveRecommendation | undefined;
      let executiveCouncilDebateId: string | undefined;

      if (shouldRunExecutiveCouncil(input.message)) {
        try {
          const councilResult = runAndStoreExecutiveCouncil(
            {
              workspaceId: input.workspaceId,
              sessionId: session.sessionId,
              requestId,
              topic: summarizeProposalTopic(input.message),
              proposalSummary: input.message,
              userMessage: input.message,
              currentObjective: objectiveState.currentObjective.title ?? null,
              journeyPosition:
                operationalContext.intelligenceSnapshot.journeyPosition ?? null,
              repositoryHealthScore: operationalContext.intelligenceSnapshot.healthScore,
              subjectType: inferSubjectType(input.message),
              actor: input.actor,
            },
            this.auditLogger,
          );
          executiveCouncilRecommendation = councilResult.publicRecommendation;
          executiveCouncilDebateId = councilResult.debate.debateId;
        } catch (councilError) {
          logger.warn(
            {
              error:
                councilError instanceof Error ? councilError.message : String(councilError),
            },
            "Executive Perspectives debate failed (non-blocking)",
          );
        }
      }

      const providers = this.llmLayer?.listAvailableProviders() ?? [];
      if (this.llmLayer && providers.length > 0) {
        try {
          const completion = await this.llmLayer.complete({
            operationalContext: contextWithReasoning,
            executiveReasoning,
            executiveLearningBundle,
            executiveCouncilRecommendation,
            userMessage: llmUserMessage,
            workspaceId: input.workspaceId,
            correlationId: input.correlationId,
            provider: input.provider,
          });

          message = completion.content;
          kind = "llm";
          provider = completion.provider;
          model = completion.model;
          mode = completion.mode;
          tokens = completion.usage
            ? {
                promptTokens: completion.usage.promptTokens,
                completionTokens: completion.usage.completionTokens,
                totalTokens: completion.usage.totalTokens,
              }
            : undefined;
          logResult = "success";

          if (tokens) {
            session.tokenUsage.promptTokens += tokens.promptTokens;
            session.tokenUsage.completionTokens += tokens.completionTokens;
            session.tokenUsage.totalTokens += tokens.totalTokens;
          }
          session.tokenUsage.requestCount++;
        } catch (error) {
          logResult = "fallback";
          this.lastError =
            error instanceof Error ? error.message : String(error);
        }
      }

      const assistantTurn = {
        role: "assistant" as const,
        content: message,
        timestamp: new Date().toISOString(),
        requestId,
        provider,
      };
      session.conversationHistory.push(assistantTurn);

      try {
        observeExecutiveConversation(
          {
            workspaceId: input.workspaceId,
            sessionId: session.sessionId,
            requestId,
            userMessage: input.message,
            assistantMessage: message,
            executiveReasoning,
            conversationTurnCount: session.conversationHistory.length,
            actor: input.actor,
          },
          this.auditLogger,
        );
      } catch (learningError) {
        logger.warn(
          {
            error:
              learningError instanceof Error ? learningError.message : String(learningError),
          },
          "Executive learning observation failed (non-blocking)",
        );
      }

      const latencyMs = Math.round(performance.now() - started);
      const now = new Date().toISOString();
      session.updatedAt = now;
      session.lastActivityAt = now;
      this.touchActivity();

      this.requestLogger.log({
        requestId,
        sessionId: session.sessionId,
        workspaceId: input.workspaceId,
        action: "pillow.chat",
        latencyMs,
        provider,
        tokens: tokens
          ? {
              prompt: tokens.promptTokens,
              completion: tokens.completionTokens,
              total: tokens.totalTokens,
            }
          : undefined,
        result: logResult,
        actor: input.actor,
      });

      return {
        requestId,
        sessionId: session.sessionId,
        workspaceId: input.workspaceId,
        message,
        kind,
        provider,
        model,
        mode,
        tokens,
        latencyMs,
        command: {
          intent: commandResponse.intent,
          category: commandResponse.category,
          plan: commandResponse.plan,
          awareness: commandResponse.awareness,
        },
        executiveRecommendation: executiveCouncilRecommendation
          ? {
              recommendationId: executiveCouncilRecommendation.recommendationId,
              debateId: executiveCouncilDebateId,
              currentObjective: executiveCouncilRecommendation.currentObjective,
              recommendation: executiveCouncilRecommendation.recommendation,
              reason: executiveCouncilRecommendation.reason,
              confidence: executiveCouncilRecommendation.confidence,
              expectedProfitImpact: executiveCouncilRecommendation.expectedProfitImpact,
              expectedEngineeringCost: executiveCouncilRecommendation.expectedEngineeringCost,
              expectedRisk: executiveCouncilRecommendation.expectedRisk,
              objectiveAlignment: executiveCouncilRecommendation.objectiveAlignment,
              status: executiveCouncilRecommendation.status,
            }
          : undefined,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - started);
      this.requestLogger.log({
        requestId,
        sessionId: session.sessionId,
        workspaceId: input.workspaceId,
        action: "pillow.chat",
        latencyMs,
        result: "error",
        error: error instanceof Error ? error.message : String(error),
        actor: input.actor,
      });
      throw error;
    } finally {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.health = this.getHealth();
    }
  }

  private ensureRunning(): void {
    if (this.lifecycle !== "running" || !this.pillowSession) {
      throw new PillowHostNotRunningError();
    }
  }

  private touchActivity(): void {
    this.lastActivityAt = Date.now();
    this.health = this.getHealth();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.tickHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
    if (typeof this.heartbeatTimer.unref === "function") {
      this.heartbeatTimer.unref();
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

let singleton: PillowHost | null = null;

export function getPillowHost(): PillowHost {
  if (!singleton) {
    singleton = new PillowHost();
  }
  return singleton;
}

export async function initializePillowHost(options: {
  llmRouter: LLMRouter;
  auditLogger?: AuditLogger;
  repoRoot?: string;
}): Promise<PillowHost> {
  const host = getPillowHost();
  host.configure(options);
  await host.startPillow();
  return host;
}

export async function shutdownPillowHost(): Promise<void> {
  if (singleton) {
    await singleton.stopPillow();
  }
}

/** Test-only reset */
export function resetPillowHostSingleton(): void {
  singleton = null;
}
