import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import {
  buildCustomerTimelineEngineConfiguration,
  type CustomerTimelineEngineConfiguration,
} from "./configuration.js";
import { appendCteLog, getCteLogs, resetCteLogsForTesting } from "./cte-logging.js";
import { CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectCustomerTimelineEngineInput,
  RecordAccountChangeInput,
  RecordCommunicationInput,
  RecordCustomerInteractionInput,
  RecordCustomerMilestoneInput,
  RecordPurchaseInput,
  RecordSupportActivityInput,
  RecordTimelineEventInput,
  SearchTimelineHistoryInput,
  TimelineCockpitSnapshot,
  CustomerTimelineEngineState,
  TimelineRunReport,
} from "./types.js";
import { CustomerTimelineController } from "./customer-timeline-controller.js";
import { CustomerTimelineManager } from "./customer-timeline-manager.js";

export interface CustomerTimelineEngineOptions {
  configuration?: Partial<CustomerTimelineEngineConfiguration>;
}

/**
 * Customer Timeline Engine (PILLOW-CTE-001 / R4-03).
 * Unified chronological customer interaction history consuming R4-01 and R4-02.
 */
export class CustomerTimelineEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerTimelineController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    options: CustomerTimelineEngineOptions = {},
  ) {
    const config = buildCustomerTimelineEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerTimelineManager(identityEngine, crmFoundation);
    this.controller = new CustomerTimelineController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerTimelineEngineState> {
    const doc = await this.reader.readText(CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Customer Timeline Engine")) {
      throw new Error(
        `${CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH} missing — Customer Timeline Engine requires R4-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCteLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-03 Customer Timeline Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerTimelineEngineState {
    if (!this.initializedAt) {
      throw new Error("Customer Timeline Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const timelineRecords = this.controller.getManager().getTimelineRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalTimelineRecords: timelineRecords.length,
      uniqueCustomers: this.controller.getManager().getRegistry().countUniqueCustomers(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CTE-001",
      missionId: "R4-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCustomerTimelineEngine(
    input: ConnectCustomerTimelineEngineInput = {},
  ): TimelineRunReport {
    return this.controller.connectCustomerTimelineEngine(input);
  }

  recordTimelineEvent(input: RecordTimelineEventInput): TimelineRunReport {
    return this.controller.recordTimelineEvent(input);
  }

  recordCustomerInteraction(input: RecordCustomerInteractionInput): TimelineRunReport {
    return this.controller.recordCustomerInteraction(input);
  }

  recordPurchase(input: RecordPurchaseInput): TimelineRunReport {
    return this.controller.recordPurchase(input);
  }

  recordSupportActivity(input: RecordSupportActivityInput): TimelineRunReport {
    return this.controller.recordSupportActivity(input);
  }

  recordCommunication(input: RecordCommunicationInput): TimelineRunReport {
    return this.controller.recordCommunication(input);
  }

  recordAccountChange(input: RecordAccountChangeInput): TimelineRunReport {
    return this.controller.recordAccountChange(input);
  }

  recordCustomerMilestone(input: RecordCustomerMilestoneInput): TimelineRunReport {
    return this.controller.recordCustomerMilestone(input);
  }

  searchTimelineHistory(input: SearchTimelineHistoryInput): TimelineRunReport {
    return this.controller.searchTimelineHistory(input);
  }

  getCustomerTimeline(customerId: string) {
    return this.controller.getManager().getAggregationEngine().aggregateByCustomer(
      this.controller.getManager().getRegistry(),
      customerId,
    );
  }

  getLatestReport(): TimelineRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getTimelineRecords() {
    return this.controller.getManager().getTimelineRecords();
  }

  getMachineReadableRecord(timelineRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().get(timelineRecordId);
    if (!record) return null;
    return this.controller.getManager().getAggregationEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerTimelineEngineConfiguration>,
  ): CustomerTimelineEngineState {
    const next = buildCustomerTimelineEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Timeline status: ${state.status}`,
        `Timeline records: ${state.health.totalTimelineRecords}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No timeline operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TimelineCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalTimelineRecords: state.health.totalTimelineRecords,
      uniqueCustomers: state.health.uniqueCustomers,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      recentLogs: getCteLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerTimelineEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  options?: CustomerTimelineEngineOptions,
): CustomerTimelineEngine {
  return new CustomerTimelineEngine(bootstrap, identityEngine, crmFoundation, options);
}

export function resetCustomerTimelineEngineForTesting(): void {
  resetCteLogsForTesting();
  new CustomerTimelineManager(null, null).resetForTesting();
}
