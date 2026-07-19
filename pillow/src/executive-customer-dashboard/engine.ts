import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import {
  buildExecutiveCustomerDashboardConfiguration,
  type ExecutiveCustomerDashboardConfiguration,
} from "./configuration.js";
import { appendEcdLog, getEcdLogs, resetEcdLogsForTesting } from "./ecd-logging.js";
import { EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectExecutiveCustomerDashboardInput,
  DashboardCockpitSnapshot,
  DetectDashboardFailuresInput,
  ExecutiveCustomerDashboardRunReport,
  ExecutiveCustomerDashboardState,
  GetDashboardWidgetsInput,
  RefreshExecutiveCustomerDashboardInput,
} from "./types.js";
import { ExecutiveCustomerDashboardController } from "./executive-customer-dashboard-controller.js";
import { ExecutiveCustomerDashboardManager } from "./executive-customer-dashboard-manager.js";

export interface ExecutiveCustomerDashboardOptions {
  configuration?: Partial<ExecutiveCustomerDashboardConfiguration>;
}

/** Executive Customer Dashboard (PILLOW-ECD-001 / R4-18). */
export class ExecutiveCustomerDashboard {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveCustomerDashboardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    aiCustomerSupport: AiCustomerSupport,
    sentimentEngine: CustomerSentimentEngine,
    reviewManagementEngine: ReviewManagementEngine,
    loyaltyProgrammeEngine: LoyaltyProgrammeEngine,
    customerRiskEngine: CustomerRiskEngine,
    customerLifetimeValueEngine: CustomerLifetimeValueEngine,
    customerSegmentationEngine: CustomerSegmentationEngine,
    customerJourneyIntelligenceEngine: CustomerJourneyIntelligenceEngine,
    options: ExecutiveCustomerDashboardOptions = {},
  ) {
    const config = buildExecutiveCustomerDashboardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ExecutiveCustomerDashboardManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      aiCustomerSupport,
      sentimentEngine,
      reviewManagementEngine,
      loyaltyProgrammeEngine,
      customerRiskEngine,
      customerLifetimeValueEngine,
      customerSegmentationEngine,
      customerJourneyIntelligenceEngine,
    );
    this.controller = new ExecutiveCustomerDashboardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveCustomerDashboardState> {
    const doc = await this.reader.readText(EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH);
    if (!doc?.includes("Executive Customer Dashboard")) {
      throw new Error(
        `${EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH} missing — Executive Customer Dashboard requires R4-18 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEcdLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-18 Executive Customer Dashboard initialized",
    });
    return this.getState();
  }

  getState(): ExecutiveCustomerDashboardState {
    if (!this.initializedAt) {
      throw new Error("Executive Customer Dashboard not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const snapshots = this.controller.getManager().getSnapshots();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSnapshots: snapshots.length,
      lastRefreshAt: this.controller.getLastRefreshAt(),
      failedSnapshots: 0,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ECD-001",
      missionId: "R4-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectExecutiveCustomerDashboard(
    input: ConnectExecutiveCustomerDashboardInput = {},
  ): ExecutiveCustomerDashboardRunReport {
    return this.controller.connectExecutiveCustomerDashboard(input);
  }

  refreshExecutiveCustomerDashboard(
    input: RefreshExecutiveCustomerDashboardInput = {},
  ): ExecutiveCustomerDashboardRunReport {
    return this.controller.refreshExecutiveCustomerDashboard(input);
  }

  displayCustomerGrowth(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerGrowth();
  }

  displayCustomerActivity(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerActivity();
  }

  displayCustomerLifetimeValue(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerLifetimeValue();
  }

  displayCustomerSegmentation(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerSegmentation();
  }

  displayCustomerSentiment(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerSentiment();
  }

  displayCustomerLoyalty(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerLoyalty();
  }

  displayCustomerJourneyAnalytics(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerJourneyAnalytics();
  }

  displayCustomerRisk(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerRisk();
  }

  displayCustomerSupportMetrics(): ExecutiveCustomerDashboardRunReport {
    return this.controller.displayCustomerSupportMetrics();
  }

  aggregateExecutiveCustomerKpis(): ExecutiveCustomerDashboardRunReport {
    return this.controller.aggregateExecutiveCustomerKpis();
  }

  getDashboardWidgets(input: GetDashboardWidgetsInput = {}): ExecutiveCustomerDashboardRunReport {
    return this.controller.getDashboardWidgets(input);
  }

  detectDashboardFailures(
    input: DetectDashboardFailuresInput = {},
  ): ExecutiveCustomerDashboardRunReport {
    return this.controller.detectDashboardFailures(input);
  }

  reportDashboardStatus(): ExecutiveCustomerDashboardRunReport {
    return this.controller.reportDashboardStatus();
  }

  reportDashboardHealth(): ExecutiveCustomerDashboardRunReport {
    return this.controller.reportDashboardHealth();
  }

  getLatestReport(): ExecutiveCustomerDashboardRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSnapshots() {
    return this.controller.getManager().getSnapshots();
  }

  getMachineReadableSnapshot(dashboardId: string): Record<string, unknown> | null {
    const snapshot = this.controller.getManager().getRegistry().get(dashboardId);
    if (!snapshot) return null;
    return this.controller.getManager().getMetadataGenerator().toMachineReadable(snapshot);
  }

  updateConfiguration(
    overrides: Partial<ExecutiveCustomerDashboardConfiguration>,
  ): ExecutiveCustomerDashboardState {
    const next = buildExecutiveCustomerDashboardConfiguration(this.bootstrap.repositoryRoot, {
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
        `Dashboard status: ${state.status}`,
        `Snapshots: ${state.health.totalSnapshots}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No dashboard operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DashboardCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSnapshots: state.health.totalSnapshots,
      lastRefreshAt: state.health.lastRefreshAt,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getEcdLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createExecutiveCustomerDashboard(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  aiCustomerSupport: AiCustomerSupport,
  sentimentEngine: CustomerSentimentEngine,
  reviewManagementEngine: ReviewManagementEngine,
  loyaltyProgrammeEngine: LoyaltyProgrammeEngine,
  customerRiskEngine: CustomerRiskEngine,
  customerLifetimeValueEngine: CustomerLifetimeValueEngine,
  customerSegmentationEngine: CustomerSegmentationEngine,
  customerJourneyIntelligenceEngine: CustomerJourneyIntelligenceEngine,
  options?: ExecutiveCustomerDashboardOptions,
): ExecutiveCustomerDashboard {
  return new ExecutiveCustomerDashboard(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    aiCustomerSupport,
    sentimentEngine,
    reviewManagementEngine,
    loyaltyProgrammeEngine,
    customerRiskEngine,
    customerLifetimeValueEngine,
    customerSegmentationEngine,
    customerJourneyIntelligenceEngine,
    options,
  );
}

export function resetExecutiveCustomerDashboardForTesting(): void {
  resetEcdLogsForTesting();
  new ExecutiveCustomerDashboardManager(null, null, null, null, null, null, null, null, null, null, null).resetForTesting();
}
