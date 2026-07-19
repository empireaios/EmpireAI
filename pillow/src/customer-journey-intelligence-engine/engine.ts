import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import {
  buildCustomerJourneyIntelligenceConfiguration,
  type CustomerJourneyIntelligenceConfiguration,
} from "./configuration.js";
import { appendCjiLog, getCjiLogs, resetCjiLogsForTesting } from "./cji-logging.js";
import { CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectJourneyIntelligenceInput,
  CustomerJourneyIntelligenceState,
  DetectDropOffPointsInput,
  DetectFrictionPointsInput,
  DetectJourneyFailuresInput,
  IdentifyJourneyStagesInput,
  JourneyCockpitSnapshot,
  JourneyRunReport,
  MapCustomerJourneyInput,
  MeasureConversionRatesInput,
  MeasureJourneyPerformanceInput,
  PredictCustomerProgressionInput,
  RecommendJourneyImprovementsInput,
  TrackCustomerTouchpointsInput,
} from "./types.js";
import { CustomerJourneyIntelligenceController } from "./customer-journey-intelligence-controller.js";
import { CustomerJourneyIntelligenceManager } from "./customer-journey-intelligence-manager.js";

export interface CustomerJourneyIntelligenceEngineOptions {
  configuration?: Partial<CustomerJourneyIntelligenceConfiguration>;
}

/** Customer Journey Intelligence Engine (PILLOW-CJI-001 / R4-17). */
export class CustomerJourneyIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerJourneyIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    sentimentEngine: CustomerSentimentEngine,
    customerLifetimeValueEngine: CustomerLifetimeValueEngine,
    customerSegmentationEngine: CustomerSegmentationEngine,
    options: CustomerJourneyIntelligenceEngineOptions = {},
  ) {
    const config = buildCustomerJourneyIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerJourneyIntelligenceManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      sentimentEngine,
      customerLifetimeValueEngine,
      customerSegmentationEngine,
    );
    this.controller = new CustomerJourneyIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerJourneyIntelligenceState> {
    const doc = await this.reader.readText(CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Customer Journey Intelligence")) {
      throw new Error(
        `${CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH} missing — Journey Intelligence requires R4-17 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCjiLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-17 Customer Journey Intelligence Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerJourneyIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Customer Journey Intelligence Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const journeyRecords = this.controller.getManager().getJourneyRecords();
    const insights = this.controller.getManager().getRegistry().listInsights();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalJourneyRecords: journeyRecords.length,
      activeInsights: insights.length,
      dropOffDetected: insights.filter((i) => i.insightType === "dropoff").length,
      failedRecords: journeyRecords.filter((r) => r.validationStatus === "failed").length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CJI-001",
      missionId: "R4-17",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectJourneyIntelligenceEngine(
    input: ConnectJourneyIntelligenceInput = {},
  ): JourneyRunReport {
    return this.controller.connectJourneyIntelligenceEngine(input);
  }

  mapCustomerJourney(input: MapCustomerJourneyInput): JourneyRunReport {
    return this.controller.mapCustomerJourney(input);
  }

  trackCustomerTouchpoints(input: TrackCustomerTouchpointsInput): JourneyRunReport {
    return this.controller.trackCustomerTouchpoints(input);
  }

  identifyJourneyStages(input: IdentifyJourneyStagesInput): JourneyRunReport {
    return this.controller.identifyJourneyStages(input);
  }

  detectDropOffPoints(input: DetectDropOffPointsInput): JourneyRunReport {
    return this.controller.detectDropOffPoints(input);
  }

  detectFrictionPoints(input: DetectFrictionPointsInput): JourneyRunReport {
    return this.controller.detectFrictionPoints(input);
  }

  measureJourneyPerformance(input: MeasureJourneyPerformanceInput): JourneyRunReport {
    return this.controller.measureJourneyPerformance(input);
  }

  measureConversionRates(input: MeasureConversionRatesInput = {}): JourneyRunReport {
    return this.controller.measureConversionRates(input);
  }

  recommendJourneyImprovements(input: RecommendJourneyImprovementsInput): JourneyRunReport {
    return this.controller.recommendJourneyImprovements(input);
  }

  predictCustomerProgression(input: PredictCustomerProgressionInput): JourneyRunReport {
    return this.controller.predictCustomerProgression(input);
  }

  detectJourneyFailures(input: DetectJourneyFailuresInput = {}): JourneyRunReport {
    return this.controller.detectJourneyFailures(input);
  }

  reportJourneyStatus(): JourneyRunReport {
    return this.controller.reportJourneyStatus();
  }

  reportJourneyHealth(): JourneyRunReport {
    return this.controller.reportJourneyHealth();
  }

  getLatestReport(): JourneyRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getJourneyRecords() {
    return this.controller.getManager().getJourneyRecords();
  }

  getInsights() {
    return this.controller.getManager().getRegistry().listInsights();
  }

  getFailures() {
    return this.controller.getManager().getRegistry().listFailures();
  }

  getMachineReadableRecord(journeyRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(journeyRecordId);
    if (!record) return null;
    return this.controller.getManager().getMetadataGenerator().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerJourneyIntelligenceConfiguration>,
  ): CustomerJourneyIntelligenceState {
    const next = buildCustomerJourneyIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Journey intelligence status: ${state.status}`,
        `Records: ${state.health.totalJourneyRecords} · Insights: ${state.health.activeInsights}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No journey operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): JourneyCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalJourneyRecords: state.health.totalJourneyRecords,
      activeInsights: state.health.activeInsights,
      dropOffDetected: state.health.dropOffDetected,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getCjiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerJourneyIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  sentimentEngine: CustomerSentimentEngine,
  customerLifetimeValueEngine: CustomerLifetimeValueEngine,
  customerSegmentationEngine: CustomerSegmentationEngine,
  options?: CustomerJourneyIntelligenceEngineOptions,
): CustomerJourneyIntelligenceEngine {
  return new CustomerJourneyIntelligenceEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    sentimentEngine,
    customerLifetimeValueEngine,
    customerSegmentationEngine,
    options,
  );
}

export function resetCustomerJourneyIntelligenceEngineForTesting(): void {
  resetCjiLogsForTesting();
  new CustomerJourneyIntelligenceManager(null, null, null, null, null, null).resetForTesting();
}
