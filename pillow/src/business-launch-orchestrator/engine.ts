import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessLaunchOrchestratorConfiguration,
  type BusinessLaunchOrchestratorConfiguration,
} from "./configuration.js";
import { appendBloLog, getBloLogs, resetBloLogsForTesting } from "./blo-logging.js";
import { BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM_PATH } from "./paths.js";
import type {
  BusinessLaunchOrchestratorState,
  ConnectBusinessLaunchOrchestratorInput,
  LaunchActionInput,
  LaunchOrchestratorCockpitSnapshot,
  LaunchOrchestratorRunReport,
  OrchestrateLaunchInput,
} from "./types.js";
import { BusinessLaunchOrchestratorController } from "./business-launch-orchestrator-controller.js";
import {
  BusinessLaunchOrchestratorManager,
  type BusinessLaunchOrchestratorDependencies,
} from "./business-launch-orchestrator-manager.js";

export interface BusinessLaunchOrchestratorOptions {
  configuration?: Partial<BusinessLaunchOrchestratorConfiguration>;
}

export type { BusinessLaunchOrchestratorDependencies };

/**
 * Business Launch Orchestrator (PILLOW-BLO-001 / X1-11).
 * Automated launch workflow — structural signals only; never launch without readiness validation.
 */
export class BusinessLaunchOrchestrator {
  private initializedAt: string | null = null;
  private readonly controller: BusinessLaunchOrchestratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BusinessLaunchOrchestratorDependencies,
    options: BusinessLaunchOrchestratorOptions = {},
  ) {
    const config = buildBusinessLaunchOrchestratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BusinessLaunchOrchestratorManager(dependencies);
    this.controller = new BusinessLaunchOrchestratorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BusinessLaunchOrchestratorState> {
    const doc = await this.reader.readText(BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM_PATH);
    if (!doc?.includes("Business Launch Orchestrator")) {
      throw new Error(
        `${BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM_PATH} missing — requires X1-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBloLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-11 Business Launch Orchestrator initialized",
    });
    return this.getState();
  }

  getState(): BusinessLaunchOrchestratorState {
    if (!this.initializedAt) {
      throw new Error("Business Launch Orchestrator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const launchRecords = this.controller.getManager().getLaunchRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalLaunchRecords: launchRecords.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BLO-001",
      missionId: "X1-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBusinessLaunchOrchestrator(
    input: ConnectBusinessLaunchOrchestratorInput = {},
  ): LaunchOrchestratorRunReport {
    return this.controller.connectBusinessLaunchOrchestrator(input);
  }

  orchestrateLaunch(input: OrchestrateLaunchInput = {}): LaunchOrchestratorRunReport {
    return this.controller.orchestrateLaunch(input);
  }

  executeLaunchWorkflow(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.executeLaunchWorkflow(input);
  }

  manageLaunchStages(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.manageLaunchStages(input);
  }

  coordinateDependencies(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.coordinateDependencies(input);
  }

  trackLaunchProgress(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.trackLaunchProgress(input);
  }

  detectLaunchFailures(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.detectLaunchFailures(input);
  }

  coordinateLaunchRecovery(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.coordinateLaunchRecovery(input);
  }

  generateLaunchReport(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    return this.controller.generateLaunchReport(input);
  }

  getLatestReport(): LaunchOrchestratorRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLaunchRecords() {
    return this.controller.getManager().getLaunchRecords();
  }

  updateConfiguration(
    overrides: Partial<BusinessLaunchOrchestratorConfiguration>,
  ): BusinessLaunchOrchestratorState {
    const next = buildBusinessLaunchOrchestratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Business Launch Orchestrator status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No launch orchestration operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LaunchOrchestratorCockpitSnapshot {
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
      totalLaunchRecords: state.health.totalLaunchRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getBloLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBusinessLaunchOrchestrator(
  bootstrap: EmpireBootstrapContext,
  dependencies: BusinessLaunchOrchestratorDependencies,
  options?: BusinessLaunchOrchestratorOptions,
): BusinessLaunchOrchestrator {
  return new BusinessLaunchOrchestrator(bootstrap, dependencies, options);
}

export function resetBusinessLaunchOrchestratorForTesting(): void {
  resetBloLogsForTesting();
  new BusinessLaunchOrchestratorManager({
    companyFactoryFramework: null,
    brandCreationEngine: null,
    domainDigitalAssetPlanner: null,
    storeGenerationEngine: null,
    pricingStrategyEngine: null,
    launchReadinessValidator: null,
  }).resetForTesting();
}
