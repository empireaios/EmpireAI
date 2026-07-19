import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import type { ReturnManagementEngine } from "../return-management/engine.js";
import {
  buildReturnsIntelligenceEngineConfiguration,
  type ReturnsIntelligenceEngineConfiguration,
} from "./configuration.js";
import { appendRieLog, getRieLogs, resetRieLogsForTesting } from "./rie-logging.js";
import { RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeReturnHistoryInput,
  ConnectReturnsIntelligenceEngineInput,
  CoordinateCustomerCommunicationsInput,
  DetectAbnormalReturnBehaviorInput,
  DetectRepeatReturnPatternsInput,
  DetectReturnFailuresInput,
  EvaluateReturnEligibilityInput,
  GenerateReturnInsightsInput,
  ReceiveReturnRequestInput,
  RecommendReturnDecisionInput,
  ReturnsIntelligenceCockpitSnapshot,
  ReturnsIntelligenceEngineState,
  ReturnsIntelligenceRunReport,
  TrackReturnLifecycleInput,
} from "./types.js";
import { ReturnsIntelligenceController } from "./returns-intelligence-controller.js";
import { ReturnsIntelligenceManager } from "./returns-intelligence-manager.js";

export interface ReturnsIntelligenceEngineOptions {
  configuration?: Partial<ReturnsIntelligenceEngineConfiguration>;
}

/**
 * Returns Intelligence Engine (PILLOW-RIE-001 / R4-13).
 * Smart return workflows consuming R4-01, R4-02, R4-03, R4-08, R4-09 and R2-13.
 */
export class ReturnsIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: ReturnsIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    aiCustomerSupport: AiCustomerSupport,
    ticketManagementEngine: TicketManagementEngine,
    returnManagementEngine: ReturnManagementEngine,
    options: ReturnsIntelligenceEngineOptions = {},
  ) {
    const config = buildReturnsIntelligenceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ReturnsIntelligenceManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      aiCustomerSupport,
      ticketManagementEngine,
      returnManagementEngine,
    );
    this.controller = new ReturnsIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ReturnsIntelligenceEngineState> {
    const doc = await this.reader.readText(RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Returns Intelligence")) {
      throw new Error(
        `${RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH} missing — Returns Intelligence requires R4-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRieLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-13 Returns Intelligence Engine initialized",
    });
    return this.getState();
  }

  getState(): ReturnsIntelligenceEngineState {
    if (!this.initializedAt) {
      throw new Error("Returns Intelligence Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const returnRecords = this.controller.getManager().getReturnIntelligenceRecords();
    const insights = this.controller.getManager().getRegistry().listInsights();
    const summary = this.controller.getManager().getInsightsEngine().summarize(returnRecords, insights);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalReturnIntelligenceRecords: summary.totalRecords,
      highRiskReturns: summary.highRiskReturns,
      repeatPatternCustomers: summary.repeatPatternCustomers,
      activeInsights: summary.activeInsights,
      failedRecords: summary.failedRecords,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RIE-001",
      missionId: "R4-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectReturnsIntelligenceEngine(
    input: ConnectReturnsIntelligenceEngineInput = {},
  ): ReturnsIntelligenceRunReport {
    return this.controller.connectReturnsIntelligenceEngine(input);
  }

  receiveReturnRequest(input: ReceiveReturnRequestInput): ReturnsIntelligenceRunReport {
    return this.controller.receiveReturnRequest(input);
  }

  evaluateReturnEligibility(input: EvaluateReturnEligibilityInput): ReturnsIntelligenceRunReport {
    return this.controller.evaluateReturnEligibility(input);
  }

  analyzeReturnHistory(input: AnalyzeReturnHistoryInput): ReturnsIntelligenceRunReport {
    return this.controller.analyzeReturnHistory(input);
  }

  detectAbnormalReturnBehavior(
    input: DetectAbnormalReturnBehaviorInput = {},
  ): ReturnsIntelligenceRunReport {
    return this.controller.detectAbnormalReturnBehavior(input);
  }

  detectRepeatReturnPatterns(
    input: DetectRepeatReturnPatternsInput = {},
  ): ReturnsIntelligenceRunReport {
    return this.controller.detectRepeatReturnPatterns(input);
  }

  recommendReturnDecision(input: RecommendReturnDecisionInput): ReturnsIntelligenceRunReport {
    return this.controller.recommendReturnDecision(input);
  }

  trackReturnLifecycle(input: TrackReturnLifecycleInput): ReturnsIntelligenceRunReport {
    return this.controller.trackReturnLifecycle(input);
  }

  coordinateCustomerCommunications(
    input: CoordinateCustomerCommunicationsInput,
  ): ReturnsIntelligenceRunReport {
    return this.controller.coordinateCustomerCommunications(input);
  }

  generateReturnInsights(input: GenerateReturnInsightsInput = {}): ReturnsIntelligenceRunReport {
    return this.controller.generateReturnInsights(input);
  }

  detectReturnFailures(input: DetectReturnFailuresInput = {}): ReturnsIntelligenceRunReport {
    return this.controller.detectReturnFailures(input);
  }

  reportReturnStatus(): ReturnsIntelligenceRunReport {
    return this.controller.reportReturnStatus();
  }

  reportReturnHealth(): ReturnsIntelligenceRunReport {
    return this.controller.reportReturnHealth();
  }

  getLatestReport(): ReturnsIntelligenceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getReturnIntelligenceRecords() {
    return this.controller.getManager().getReturnIntelligenceRecords();
  }

  getInsights() {
    return this.controller.getManager().getRegistry().listInsights();
  }

  getFailures() {
    return this.controller.getManager().getRegistry().listFailures();
  }

  getMachineReadableRecord(returnIntelligenceId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(returnIntelligenceId);
    if (!record) return null;
    return this.controller.getManager().getInsightsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<ReturnsIntelligenceEngineConfiguration>,
  ): ReturnsIntelligenceEngineState {
    const next = buildReturnsIntelligenceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Returns intelligence status: ${state.status}`,
        `Records: ${state.health.totalReturnIntelligenceRecords} · ${state.health.highRiskReturns} high risk`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No return intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ReturnsIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalReturnIntelligenceRecords: state.health.totalReturnIntelligenceRecords,
      highRiskReturns: state.health.highRiskReturns,
      activeInsights: state.health.activeInsights,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      returnManagementEngineConnected: record?.returnManagementEngineConnected ?? false,
      recentLogs: getRieLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createReturnsIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  aiCustomerSupport: AiCustomerSupport,
  ticketManagementEngine: TicketManagementEngine,
  returnManagementEngine: ReturnManagementEngine,
  options?: ReturnsIntelligenceEngineOptions,
): ReturnsIntelligenceEngine {
  return new ReturnsIntelligenceEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    aiCustomerSupport,
    ticketManagementEngine,
    returnManagementEngine,
    options,
  );
}

export function resetReturnsIntelligenceEngineForTesting(): void {
  resetRieLogsForTesting();
  new ReturnsIntelligenceManager(null, null, null, null, null, null).resetForTesting();
}
