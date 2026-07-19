import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCreativeAssetManagerConfiguration,
  type CreativeAssetManagerConfiguration,
} from "./configuration.js";
import { appendCraLog, getCraLogs, resetCraLogsForTesting } from "./cra-logging.js";
import { CREATIVE_ASSET_MANAGER_SYSTEM_PATH } from "./paths.js";
import type {
  ApproveAssetInput,
  ClassifyAssetInput,
  ConnectCreativeAssetManagerInput,
  CreateAssetInput,
  CreateVersionInput,
  CreativeAssetManagerState,
  CreativeCockpitSnapshot,
  CreativeRunReport,
  SearchAssetsInput,
  TagAssetInput,
  TrackUsageInput,
  UpdateAssetInput,
} from "./types.js";
import { CreativeAssetManagerController } from "./creative-asset-manager-controller.js";
import {
  CreativeAssetManagerCore,
  type CreativeAssetManagerDependencies,
} from "./creative-asset-manager-core.js";

export interface CreativeAssetManagerOptions {
  configuration?: Partial<CreativeAssetManagerConfiguration>;
}

export type { CreativeAssetManagerDependencies };

/**
 * Creative Asset Manager (PILLOW-CRA-001 / R5-11).
 * Marketing asset library for centralized creative management — structural only.
 */
export class CreativeAssetManager {
  private initializedAt: string | null = null;
  private readonly controller: CreativeAssetManagerController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CreativeAssetManagerDependencies,
    options: CreativeAssetManagerOptions = {},
  ) {
    const config = buildCreativeAssetManagerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CreativeAssetManagerCore(dependencies);
    this.controller = new CreativeAssetManagerController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CreativeAssetManagerState> {
    const doc = await this.reader.readText(CREATIVE_ASSET_MANAGER_SYSTEM_PATH);
    if (!doc?.includes("Creative Asset Manager")) {
      throw new Error(
        `${CREATIVE_ASSET_MANAGER_SYSTEM_PATH} missing — Creative Asset Manager requires R5-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCraLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-11 Creative Asset Manager initialized",
    });
    return this.getState();
  }

  getState(): CreativeAssetManagerState {
    if (!this.initializedAt) {
      throw new Error("Creative Asset Manager not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const assets = this.controller.getManager().getAssetRecords();
    const approvedAssets = assets.filter((a) => a.approvalStatus === "approved").length;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAssets: assets.length,
      approvedAssets,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CRA-001",
      missionId: "R5-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCreativeAssetManager(
    input: ConnectCreativeAssetManagerInput = {},
  ): CreativeRunReport {
    return this.controller.connectCreativeAssetManager(input);
  }

  createAsset(input: CreateAssetInput): CreativeRunReport {
    return this.controller.createAsset(input);
  }

  updateAsset(input: UpdateAssetInput): CreativeRunReport {
    return this.controller.updateAsset(input);
  }

  createVersion(input: CreateVersionInput): CreativeRunReport {
    return this.controller.createVersion(input);
  }

  approveAsset(input: ApproveAssetInput): CreativeRunReport {
    return this.controller.approveAsset(input);
  }

  tagAsset(input: TagAssetInput): CreativeRunReport {
    return this.controller.tagAsset(input);
  }

  trackUsage(input: TrackUsageInput): CreativeRunReport {
    return this.controller.trackUsage(input);
  }

  searchAssets(input: SearchAssetsInput = {}): CreativeRunReport {
    return this.controller.searchAssets(input);
  }

  classifyAsset(input: ClassifyAssetInput): CreativeRunReport {
    return this.controller.classifyAsset(input);
  }

  getLatestReport(): CreativeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAssetRecords() {
    return this.controller.getManager().getAssetRecords();
  }

  updateConfiguration(
    overrides: Partial<CreativeAssetManagerConfiguration>,
  ): CreativeAssetManagerState {
    const next = buildCreativeAssetManagerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Creative Asset Manager status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No creative asset operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CreativeCockpitSnapshot {
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
      totalAssets: state.health.totalAssets,
      approvedAssets: state.health.approvedAssets,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getCraLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCreativeAssetManager(
  bootstrap: EmpireBootstrapContext,
  dependencies: CreativeAssetManagerDependencies,
  options?: CreativeAssetManagerOptions,
): CreativeAssetManager {
  return new CreativeAssetManager(bootstrap, dependencies, options);
}

export function resetCreativeAssetManagerForTesting(): void {
  resetCraLogsForTesting();
  new CreativeAssetManagerCore({
    marketingFramework: null,
    campaignManager: null,
    marketingAnalyticsDashboard: null,
  }).resetForTesting();
}
