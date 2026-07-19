import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAttributionEngineConfiguration,
  type AttributionEngineConfiguration,
} from "./configuration.js";
import { appendAttLog, getAttLogs, resetAttLogsForTesting } from "./att-logging.js";
import { ATTRIBUTION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AttributeInput,
  AttributionCockpitSnapshot,
  AttributionEngineState,
  AttributionRunReport,
  CalculateRoiInput,
  ConnectAttributionEngineInput,
  MeasureContributionInput,
  TrackAcquisitionSourceInput,
  TrackConversionJourneyInput,
  TrackTouchpointInput,
} from "./types.js";
import { AttributionEngineController } from "./attribution-engine-controller.js";
import {
  AttributionManager,
  type AttributionEngineDependencies,
} from "./attribution-manager.js";

export interface AttributionEngineOptions {
  configuration?: Partial<AttributionEngineConfiguration>;
}

export type { AttributionEngineDependencies };

/**
 * Attribution Engine (PILLOW-ATT-001 / R5-09).
 * Marketing attribution for accurate ROI measurement — structural analytics only.
 */
export class AttributionEngine {
  private initializedAt: string | null = null;
  private readonly controller: AttributionEngineController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AttributionEngineDependencies,
    options: AttributionEngineOptions = {},
  ) {
    const config = buildAttributionEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AttributionManager(dependencies);
    this.controller = new AttributionEngineController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AttributionEngineState> {
    const doc = await this.reader.readText(ATTRIBUTION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Attribution Engine")) {
      throw new Error(
        `${ATTRIBUTION_ENGINE_SYSTEM_PATH} missing — Attribution Engine requires R5-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAttLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-09 Attribution Engine initialized",
    });
    return this.getState();
  }

  getState(): AttributionEngineState {
    if (!this.initializedAt) {
      throw new Error("Attribution Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const attributions = this.controller.getManager().getAttributionRecords();
    const touchpoints = this.controller.getManager().getTouchpoints();
    const averageRoiContribution =
      attributions.length === 0
        ? 0
        : attributions.reduce((sum, a) => sum + a.roiContribution, 0) / attributions.length;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAttributions: attributions.length,
      totalTouchpoints: touchpoints.length,
      averageRoiContribution,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ATT-001",
      missionId: "R5-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAttributionEngine(input: ConnectAttributionEngineInput = {}): AttributionRunReport {
    return this.controller.connectAttributionEngine(input);
  }

  trackAcquisitionSource(input: TrackAcquisitionSourceInput): AttributionRunReport {
    return this.controller.trackAcquisitionSource(input);
  }

  trackTouchpoint(input: TrackTouchpointInput): AttributionRunReport {
    return this.controller.trackTouchpoint(input);
  }

  trackConversionJourney(input: TrackConversionJourneyInput): AttributionRunReport {
    return this.controller.trackConversionJourney(input);
  }

  attribute(input: AttributeInput): AttributionRunReport {
    return this.controller.attribute(input);
  }

  measureCampaignContribution(input: MeasureContributionInput = {}): AttributionRunReport {
    return this.controller.measureCampaignContribution(input);
  }

  measureChannelContribution(input: MeasureContributionInput = {}): AttributionRunReport {
    return this.controller.measureChannelContribution(input);
  }

  measureAdvertisementContribution(input: MeasureContributionInput = {}): AttributionRunReport {
    return this.controller.measureAdvertisementContribution(input);
  }

  calculateRoas(input: CalculateRoiInput = {}): AttributionRunReport {
    return this.controller.calculateRoas(input);
  }

  calculateMarketingRoi(input: CalculateRoiInput = {}): AttributionRunReport {
    return this.controller.calculateMarketingRoi(input);
  }

  getLatestReport(): AttributionRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAttributionRecords() {
    return this.controller.getManager().getAttributionRecords();
  }

  getTouchpoints() {
    return this.controller.getManager().getTouchpoints();
  }

  updateConfiguration(
    overrides: Partial<AttributionEngineConfiguration>,
  ): AttributionEngineState {
    const next = buildAttributionEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Attribution Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No attribution operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AttributionCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      attributionsCalculated: state.performance.attributionsCalculated,
      touchpointsTracked: state.performance.touchpointsTracked,
      averageRoiContribution: state.health.averageRoiContribution,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getAttLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAttributionEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: AttributionEngineDependencies,
  options?: AttributionEngineOptions,
): AttributionEngine {
  return new AttributionEngine(bootstrap, dependencies, options);
}

export function resetAttributionEngineForTesting(): void {
  resetAttLogsForTesting();
  new AttributionManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    campaignManager: null,
    audienceIntelligence: null,
  }).resetForTesting();
}
