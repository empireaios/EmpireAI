import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import {
  buildCustomerSegmentationEngineConfiguration,
  type CustomerSegmentationEngineConfiguration,
} from "./configuration.js";
import { appendCsegLog, getCsegLogs, resetCsegLogsForTesting } from "./cseg-logging.js";
import { CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AssignCustomerToSegmentsInput,
  ConnectSegmentationEngineInput,
  CreateCustomerSegmentInput,
  CustomerSegmentationEngineState,
  DetectSegmentChangesInput,
  DetectSegmentationFailuresInput,
  SegmentationCockpitSnapshot,
  SegmentationRunReport,
  SegmentCustomerInput,
} from "./types.js";
import { CustomerSegmentationController } from "./customer-segmentation-controller.js";
import { CustomerSegmentationManager } from "./customer-segmentation-manager.js";

export interface CustomerSegmentationEngineOptions {
  configuration?: Partial<CustomerSegmentationEngineConfiguration>;
}

/** Customer Segmentation Engine (PILLOW-CSEG-001 / R4-16). */
export class CustomerSegmentationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerSegmentationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    sentimentEngine: CustomerSentimentEngine,
    loyaltyProgrammeEngine: LoyaltyProgrammeEngine,
    customerRiskEngine: CustomerRiskEngine,
    customerLifetimeValueEngine: CustomerLifetimeValueEngine,
    options: CustomerSegmentationEngineOptions = {},
  ) {
    const config = buildCustomerSegmentationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerSegmentationManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      sentimentEngine,
      loyaltyProgrammeEngine,
      customerRiskEngine,
      customerLifetimeValueEngine,
    );
    this.controller = new CustomerSegmentationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerSegmentationEngineState> {
    const doc = await this.reader.readText(CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Customer Segmentation Engine")) {
      throw new Error(
        `${CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH} missing — Segmentation Engine requires R4-16 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCsegLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-16 Customer Segmentation Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerSegmentationEngineState {
    if (!this.initializedAt) {
      throw new Error("Customer Segmentation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const segmentationRecords = this.controller.getManager().getSegmentationRecords();
    const segments = this.controller.getManager().getRegistry().listSegments();
    const changes = this.controller.getManager().getRegistry().listChanges();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSegmentationRecords: segmentationRecords.length,
      activeSegments: segments.filter((s) => s.active).length,
      segmentChangesDetected: changes.length,
      failedRecords: segmentationRecords.filter((r) => r.validationStatus === "failed").length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CSEG-001",
      missionId: "R4-16",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSegmentationEngine(input: ConnectSegmentationEngineInput = {}): SegmentationRunReport {
    return this.controller.connectSegmentationEngine(input);
  }

  createCustomerSegment(input: CreateCustomerSegmentInput): SegmentationRunReport {
    return this.controller.createCustomerSegment(input);
  }

  assignCustomerToSegments(input: AssignCustomerToSegmentsInput): SegmentationRunReport {
    return this.controller.assignCustomerToSegments(input);
  }

  segmentByDemographics(input: SegmentCustomerInput): SegmentationRunReport {
    return this.controller.segmentByDemographics(input);
  }

  segmentByPurchasingBehaviour(input: SegmentCustomerInput): SegmentationRunReport {
    return this.controller.segmentByPurchasingBehaviour(input);
  }

  segmentByCustomerValue(input: SegmentCustomerInput): SegmentationRunReport {
    return this.controller.segmentByCustomerValue(input);
  }

  segmentByLoyaltyStatus(input: SegmentCustomerInput): SegmentationRunReport {
    return this.controller.segmentByLoyaltyStatus(input);
  }

  segmentByCustomerSentiment(input: SegmentCustomerInput): SegmentationRunReport {
    return this.controller.segmentByCustomerSentiment(input);
  }

  segmentByCustomerRisk(input: SegmentCustomerInput): SegmentationRunReport {
    return this.controller.segmentByCustomerRisk(input);
  }

  detectSegmentChanges(input: DetectSegmentChangesInput = {}): SegmentationRunReport {
    return this.controller.detectSegmentChanges(input);
  }

  detectSegmentationFailures(input: DetectSegmentationFailuresInput = {}): SegmentationRunReport {
    return this.controller.detectSegmentationFailures(input);
  }

  reportSegmentationStatus(): SegmentationRunReport {
    return this.controller.reportSegmentationStatus();
  }

  reportSegmentationHealth(): SegmentationRunReport {
    return this.controller.reportSegmentationHealth();
  }

  getLatestReport(): SegmentationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSegmentationRecords() {
    return this.controller.getManager().getSegmentationRecords();
  }

  getSegments() {
    return this.controller.getManager().getRegistry().listSegments();
  }

  getSegmentChanges() {
    return this.controller.getManager().getRegistry().listChanges();
  }

  getFailures() {
    return this.controller.getManager().getRegistry().listFailures();
  }

  getMachineReadableRecord(segmentationRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(segmentationRecordId);
    if (!record) return null;
    return this.controller.getManager().getMetadataGenerator().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerSegmentationEngineConfiguration>,
  ): CustomerSegmentationEngineState {
    const next = buildCustomerSegmentationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Segmentation status: ${state.status}`,
        `Records: ${state.health.totalSegmentationRecords} · Segments: ${state.health.activeSegments}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No segmentation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SegmentationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSegmentationRecords: state.health.totalSegmentationRecords,
      activeSegments: state.health.activeSegments,
      segmentChangesDetected: state.health.segmentChangesDetected,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      recentLogs: getCsegLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerSegmentationEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  sentimentEngine: CustomerSentimentEngine,
  loyaltyProgrammeEngine: LoyaltyProgrammeEngine,
  customerRiskEngine: CustomerRiskEngine,
  customerLifetimeValueEngine: CustomerLifetimeValueEngine,
  options?: CustomerSegmentationEngineOptions,
): CustomerSegmentationEngine {
  return new CustomerSegmentationEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    sentimentEngine,
    loyaltyProgrammeEngine,
    customerRiskEngine,
    customerLifetimeValueEngine,
    options,
  );
}

export function resetCustomerSegmentationEngineForTesting(): void {
  resetCsegLogsForTesting();
  new CustomerSegmentationManager(null, null, null, null, null, null, null).resetForTesting();
}
