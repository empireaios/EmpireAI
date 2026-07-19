import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import type { ReturnsIntelligenceEngine } from "../returns-intelligence-engine/engine.js";
import {
  buildCustomerRiskEngineConfiguration,
  type CustomerRiskEngineConfiguration,
} from "./configuration.js";
import { appendCreLog, getCreLogs, resetCreLogsForTesting } from "./cre-logging.js";
import { CUSTOMER_RISK_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CalculateCustomerRiskScoreInput,
  ConnectCustomerRiskEngineInput,
  CustomerRiskCockpitSnapshot,
  CustomerRiskEngineState,
  CustomerRiskRunReport,
  DetectAccountAbuseInput,
  DetectCustomerRiskFailuresInput,
  DetectFraudIndicatorsInput,
  DetectSuspiciousCommunicationInput,
  DetectSuspiciousPurchasingInput,
  DetectSuspiciousReturnBehaviourInput,
  EvaluateCustomerRiskInput,
  GenerateCustomerRiskAlertsInput,
  RecommendMitigationActionsInput,
} from "./types.js";
import { CustomerRiskController } from "./customer-risk-controller.js";
import { CustomerRiskManager } from "./customer-risk-manager.js";

export interface CustomerRiskEngineOptions {
  configuration?: Partial<CustomerRiskEngineConfiguration>;
}

/** Customer Risk Engine (PILLOW-CRE-001 / R4-14). */
export class CustomerRiskEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerRiskController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    ticketManagementEngine: TicketManagementEngine,
    sentimentEngine: CustomerSentimentEngine,
    reviewManagementEngine: ReviewManagementEngine,
    returnsIntelligenceEngine: ReturnsIntelligenceEngine,
    options: CustomerRiskEngineOptions = {},
  ) {
    const config = buildCustomerRiskEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerRiskManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      ticketManagementEngine,
      sentimentEngine,
      reviewManagementEngine,
      returnsIntelligenceEngine,
    );
    this.controller = new CustomerRiskController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerRiskEngineState> {
    const doc = await this.reader.readText(CUSTOMER_RISK_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Customer Risk Engine")) {
      throw new Error(
        `${CUSTOMER_RISK_ENGINE_SYSTEM_PATH} missing — Customer Risk Engine requires R4-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCreLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-14 Customer Risk Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerRiskEngineState {
    if (!this.initializedAt) {
      throw new Error("Customer Risk Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const riskRecords = this.controller.getManager().getCustomerRiskRecords();
    const alerts = this.controller.getManager().getRegistry().listAlerts();
    const highRiskCustomers = new Set(
      riskRecords
        .filter((r) => r.riskLevel === "high" || r.riskLevel === "critical")
        .map((r) => r.customerId),
    ).size;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCustomerRiskRecords: riskRecords.length,
      activeAlerts: alerts.length,
      highRiskCustomers,
      failedRecords: riskRecords.filter((r) => r.validationStatus === "failed").length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CRE-001",
      missionId: "R4-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCustomerRiskEngine(input: ConnectCustomerRiskEngineInput = {}): CustomerRiskRunReport {
    return this.controller.connectCustomerRiskEngine(input);
  }

  evaluateCustomerRisk(input: EvaluateCustomerRiskInput): CustomerRiskRunReport {
    return this.controller.evaluateCustomerRisk(input);
  }

  detectFraudIndicators(input: DetectFraudIndicatorsInput): CustomerRiskRunReport {
    return this.controller.detectFraudIndicators(input);
  }

  detectAccountAbuse(input: DetectAccountAbuseInput): CustomerRiskRunReport {
    return this.controller.detectAccountAbuse(input);
  }

  detectSuspiciousPurchasingBehaviour(
    input: DetectSuspiciousPurchasingInput,
  ): CustomerRiskRunReport {
    return this.controller.detectSuspiciousPurchasingBehaviour(input);
  }

  detectSuspiciousReturnBehaviour(
    input: DetectSuspiciousReturnBehaviourInput,
  ): CustomerRiskRunReport {
    return this.controller.detectSuspiciousReturnBehaviour(input);
  }

  detectSuspiciousCommunicationPatterns(
    input: DetectSuspiciousCommunicationInput,
  ): CustomerRiskRunReport {
    return this.controller.detectSuspiciousCommunicationPatterns(input);
  }

  calculateCustomerRiskScore(input: CalculateCustomerRiskScoreInput): CustomerRiskRunReport {
    return this.controller.calculateCustomerRiskScore(input);
  }

  generateCustomerRiskAlerts(input: GenerateCustomerRiskAlertsInput = {}): CustomerRiskRunReport {
    return this.controller.generateCustomerRiskAlerts(input);
  }

  recommendMitigationActions(input: RecommendMitigationActionsInput): CustomerRiskRunReport {
    return this.controller.recommendMitigationActions(input);
  }

  detectCustomerRiskFailures(input: DetectCustomerRiskFailuresInput = {}): CustomerRiskRunReport {
    return this.controller.detectCustomerRiskFailures(input);
  }

  reportCustomerRiskStatus(): CustomerRiskRunReport {
    return this.controller.reportCustomerRiskStatus();
  }

  reportCustomerRiskHealth(): CustomerRiskRunReport {
    return this.controller.reportCustomerRiskHealth();
  }

  getLatestReport(): CustomerRiskRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCustomerRiskRecords() {
    return this.controller.getManager().getCustomerRiskRecords();
  }

  getAlerts() {
    return this.controller.getManager().getRegistry().listAlerts();
  }

  getFailures() {
    return this.controller.getManager().getRegistry().listFailures();
  }

  getMachineReadableRecord(customerRiskId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(customerRiskId);
    if (!record) return null;
    return this.controller.getManager().getRecommendationEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerRiskEngineConfiguration>,
  ): CustomerRiskEngineState {
    const next = buildCustomerRiskEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Customer risk status: ${state.status}`,
        `Records: ${state.health.totalCustomerRiskRecords} · Alerts: ${state.health.activeAlerts}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No customer risk operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CustomerRiskCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCustomerRiskRecords: state.health.totalCustomerRiskRecords,
      activeAlerts: state.health.activeAlerts,
      highRiskCustomers: state.health.highRiskCustomers,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getCreLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerRiskEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  ticketManagementEngine: TicketManagementEngine,
  sentimentEngine: CustomerSentimentEngine,
  reviewManagementEngine: ReviewManagementEngine,
  returnsIntelligenceEngine: ReturnsIntelligenceEngine,
  options?: CustomerRiskEngineOptions,
): CustomerRiskEngine {
  return new CustomerRiskEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    ticketManagementEngine,
    sentimentEngine,
    reviewManagementEngine,
    returnsIntelligenceEngine,
    options,
  );
}

export function resetCustomerRiskEngineForTesting(): void {
  resetCreLogsForTesting();
  new CustomerRiskManager(null, null, null, null, null, null, null).resetForTesting();
}
