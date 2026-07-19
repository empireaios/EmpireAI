import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import {
  buildLiveChatIntegrationConfiguration,
  type LiveChatIntegrationConfiguration,
} from "./configuration.js";
import { appendLciLog, getLciLogs, resetLciLogsForTesting } from "./lci-logging.js";
import { LIVE_CHAT_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  AssignChatSessionInput,
  ConnectLiveChatIntegrationInput,
  CreateChatSessionInput,
  DetectChatFailuresInput,
  LiveChatCockpitSnapshot,
  LiveChatIntegrationState,
  LiveChatRunReport,
  ManageChatConversationInput,
  ProcessChatQueueInput,
  ReceiveCustomerMessageInput,
  SendSupportResponseInput,
  TrackChatStatusInput,
  TrackResponseTimeInput,
} from "./types.js";
import { LiveChatIntegrationController } from "./live-chat-integration-controller.js";
import { LiveChatIntegrationManager } from "./live-chat-integration-manager.js";

export interface LiveChatIntegrationOptions {
  configuration?: Partial<LiveChatIntegrationConfiguration>;
}

/**
 * Live Chat Integration (PILLOW-LCI-001 / R4-07).
 * Real-time customer support consuming R4-03 Customer Timeline Engine.
 */
export class LiveChatIntegration {
  private initializedAt: string | null = null;
  private readonly controller: LiveChatIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    timelineEngine: CustomerTimelineEngine,
    options: LiveChatIntegrationOptions = {},
  ) {
    const config = buildLiveChatIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LiveChatIntegrationManager(timelineEngine);
    this.controller = new LiveChatIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LiveChatIntegrationState> {
    const doc = await this.reader.readText(LIVE_CHAT_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Live Chat Integration")) {
      throw new Error(
        `${LIVE_CHAT_INTEGRATION_SYSTEM_PATH} missing — Live Chat Integration requires R4-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLciLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-07 Live Chat Integration initialized",
    });
    return this.getState();
  }

  getState(): LiveChatIntegrationState {
    if (!this.initializedAt) {
      throw new Error("Live Chat Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const liveChatRecords = this.controller.getManager().getLiveChatRecords();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(liveChatRecords);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalLiveChatRecords: summary.total,
      waitingSessions: summary.waiting,
      activeSessions: summary.active + summary.assigned,
      failedSessions: summary.failed,
      queuedMessages: this.controller.getManager().getRegistry().queuedMessages().length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LCI-001",
      missionId: "R4-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectLiveChatIntegration(input: ConnectLiveChatIntegrationInput = {}): LiveChatRunReport {
    return this.controller.connectLiveChatIntegration(input);
  }

  createChatSession(input: CreateChatSessionInput): LiveChatRunReport {
    return this.controller.createChatSession(input);
  }

  receiveCustomerMessage(input: ReceiveCustomerMessageInput): LiveChatRunReport {
    return this.controller.receiveCustomerMessage(input);
  }

  sendSupportResponse(input: SendSupportResponseInput): LiveChatRunReport {
    return this.controller.sendSupportResponse(input);
  }

  manageChatConversation(input: ManageChatConversationInput): LiveChatRunReport {
    return this.controller.manageChatConversation(input);
  }

  processChatQueue(input: ProcessChatQueueInput = {}): LiveChatRunReport {
    return this.controller.processChatQueue(input);
  }

  assignChatSession(input: AssignChatSessionInput): LiveChatRunReport {
    return this.controller.assignChatSession(input);
  }

  trackChatStatus(input: TrackChatStatusInput): LiveChatRunReport {
    return this.controller.trackChatStatus(input);
  }

  trackResponseTime(input: TrackResponseTimeInput): LiveChatRunReport {
    return this.controller.trackResponseTime(input);
  }

  detectChatFailures(input: DetectChatFailuresInput = {}): LiveChatRunReport {
    return this.controller.detectChatFailures(input);
  }

  getLatestReport(): LiveChatRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLiveChatRecords() {
    return this.controller.getManager().getLiveChatRecords();
  }

  getConversations() {
    return this.controller.getManager().getConversations();
  }

  getMessages() {
    return this.controller.getManager().getMessages();
  }

  getMachineReadableRecord(chatSessionId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getSession(chatSessionId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<LiveChatIntegrationConfiguration>,
  ): LiveChatIntegrationState {
    const next = buildLiveChatIntegrationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Live chat status: ${state.status}`,
        `Sessions: ${state.health.totalLiveChatRecords} total · ${state.health.activeSessions} active`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No live chat operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LiveChatCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalLiveChatRecords: state.health.totalLiveChatRecords,
      waitingSessions: state.health.waitingSessions,
      activeSessions: state.health.activeSessions,
      queuedMessages: state.health.queuedMessages,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getLciLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLiveChatIntegration(
  bootstrap: EmpireBootstrapContext,
  timelineEngine: CustomerTimelineEngine,
  options?: LiveChatIntegrationOptions,
): LiveChatIntegration {
  return new LiveChatIntegration(bootstrap, timelineEngine, options);
}

export function resetLiveChatIntegrationForTesting(): void {
  resetLciLogsForTesting();
  new LiveChatIntegrationManager(null).resetForTesting();
}
