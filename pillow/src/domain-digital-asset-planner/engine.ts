import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDomainDigitalAssetPlannerConfiguration,
  type DomainDigitalAssetPlannerConfiguration,
} from "./configuration.js";
import { appendDapLog, getDapLogs, resetDapLogsForTesting } from "./dap-logging.js";
import { DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectDomainDigitalAssetPlannerInput,
  CreateDigitalAssetPlanInput,
  DigitalAssetActionInput,
  DigitalAssetCockpitSnapshot,
  DomainDigitalAssetPlannerState,
  DigitalAssetRunReport,
} from "./types.js";
import { DigitalAssetPlanningController } from "./digital-asset-planning-controller.js";
import {
  DigitalAssetPlanningManager,
  type DomainDigitalAssetPlannerDependencies,
} from "./digital-asset-planning-manager.js";

export interface DomainDigitalAssetPlannerOptions {
  configuration?: Partial<DomainDigitalAssetPlannerConfiguration>;
}

export type { DomainDigitalAssetPlannerDependencies };

/**
 * Domain & Digital Asset Planner (PILLOW-DAP-001 / X1-06).
 * Digital asset planning — structural signals only; no auto-registration/purchase.
 */
export class DomainDigitalAssetPlanner {
  private initializedAt: string | null = null;
  private readonly controller: DigitalAssetPlanningController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: DomainDigitalAssetPlannerDependencies,
    options: DomainDigitalAssetPlannerOptions = {},
  ) {
    const config = buildDomainDigitalAssetPlannerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new DigitalAssetPlanningManager(dependencies);
    this.controller = new DigitalAssetPlanningController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<DomainDigitalAssetPlannerState> {
    const doc = await this.reader.readText(DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH);
    if (!doc?.includes("Domain & Digital Asset Planner")) {
      throw new Error(
        `${DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH} missing — requires X1-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendDapLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-06 Domain & Digital Asset Planner initialized",
    });
    return this.getState();
  }

  getState(): DomainDigitalAssetPlannerState {
    if (!this.initializedAt) {
      throw new Error("Domain & Digital Asset Planner not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const plans = this.controller.getManager().getPlanRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPlanRecords: plans.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-DAP-001",
      missionId: "X1-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectDomainDigitalAssetPlanner(
    input: ConnectDomainDigitalAssetPlannerInput = {},
  ): DigitalAssetRunReport {
    return this.controller.connectDomainDigitalAssetPlanner(input);
  }

  createPlan(input: CreateDigitalAssetPlanInput = {}): DigitalAssetRunReport {
    return this.controller.createPlan(input);
  }

  planCompanyDomains(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planCompanyDomains(input);
  }

  planDomainAlternatives(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planDomainAlternatives(input);
  }

  planSocialHandles(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planSocialHandles(input);
  }

  planEmailDomains(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planEmailDomains(input);
  }

  planBrandAssetStructure(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planBrandAssetStructure(input);
  }

  planWebsiteArchitecture(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planWebsiteArchitecture(input);
  }

  planDigitalIdentityConsistency(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.planDigitalIdentityConsistency(input);
  }

  detectNamingConflicts(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.detectNamingConflicts(input);
  }

  generateRecommendations(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    return this.controller.generateRecommendations(input);
  }

  getLatestReport(): DigitalAssetRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPlanRecords() {
    return this.controller.getManager().getPlanRecords();
  }

  updateConfiguration(
    overrides: Partial<DomainDigitalAssetPlannerConfiguration>,
  ): DomainDigitalAssetPlannerState {
    const next = buildDomainDigitalAssetPlannerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Domain & Digital Asset Planner status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No digital asset planning operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DigitalAssetCockpitSnapshot {
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
      totalPlanRecords: state.health.totalPlanRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getDapLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createDomainDigitalAssetPlanner(
  bootstrap: EmpireBootstrapContext,
  dependencies: DomainDigitalAssetPlannerDependencies,
  options?: DomainDigitalAssetPlannerOptions,
): DomainDigitalAssetPlanner {
  return new DomainDigitalAssetPlanner(bootstrap, dependencies, options);
}

export function resetDomainDigitalAssetPlannerForTesting(): void {
  resetDapLogsForTesting();
  new DigitalAssetPlanningManager({
    companyFactoryFramework: null,
    businessModelGenerator: null,
    brandCreationEngine: null,
  }).resetForTesting();
}
