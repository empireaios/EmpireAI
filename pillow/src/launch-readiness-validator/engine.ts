import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLaunchReadinessValidatorConfiguration,
  type LaunchReadinessValidatorConfiguration,
} from "./configuration.js";
import { appendLrvLog, getLrvLogs, resetLrvLogsForTesting } from "./lrv-logging.js";
import { LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectLaunchReadinessValidatorInput,
  LaunchActionInput,
  LaunchCockpitSnapshot,
  LaunchReadinessValidatorState,
  LaunchRunReport,
  ValidateLaunchReadinessInput,
} from "./types.js";
import { LaunchReadinessController } from "./launch-readiness-controller.js";
import {
  LaunchReadinessManager,
  type LaunchReadinessValidatorDependencies,
} from "./launch-readiness-manager.js";

export interface LaunchReadinessValidatorOptions {
  configuration?: Partial<LaunchReadinessValidatorConfiguration>;
}

export type { LaunchReadinessValidatorDependencies };

/**
 * Launch Readiness Validator (PILLOW-LRV-001 / X1-10).
 * Launch certification — structural signals only; never certify without validation.
 */
export class LaunchReadinessValidator {
  private initializedAt: string | null = null;
  private readonly controller: LaunchReadinessController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: LaunchReadinessValidatorDependencies,
    options: LaunchReadinessValidatorOptions = {},
  ) {
    const config = buildLaunchReadinessValidatorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LaunchReadinessManager(dependencies);
    this.controller = new LaunchReadinessController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LaunchReadinessValidatorState> {
    const doc = await this.reader.readText(LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH);
    if (!doc?.includes("Launch Readiness Validator")) {
      throw new Error(
        `${LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH} missing — requires X1-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLrvLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-10 Launch Readiness Validator initialized",
    });
    return this.getState();
  }

  getState(): LaunchReadinessValidatorState {
    if (!this.initializedAt) {
      throw new Error("Launch Readiness Validator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const readinessRecords = this.controller.getManager().getReadinessRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalReadinessRecords: readinessRecords.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LRV-001",
      missionId: "X1-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectLaunchReadinessValidator(
    input: ConnectLaunchReadinessValidatorInput = {},
  ): LaunchRunReport {
    return this.controller.connectLaunchReadinessValidator(input);
  }

  validateLaunchReadiness(input: ValidateLaunchReadinessInput = {}): LaunchRunReport {
    return this.controller.validateLaunchReadiness(input);
  }

  validateBusinessConfiguration(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.validateBusinessConfiguration(input);
  }

  validateBrandReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.validateBrandReadiness(input);
  }

  validateDigitalAssetReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.validateDigitalAssetReadiness(input);
  }

  validateStorefrontReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.validateStorefrontReadiness(input);
  }

  validateProductPortfolioReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.validateProductPortfolioReadiness(input);
  }

  validatePricingReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.validatePricingReadiness(input);
  }

  detectLaunchBlockers(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.detectLaunchBlockers(input);
  }

  calculateReadinessScore(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.calculateReadinessScore(input);
  }

  generateLaunchRecommendations(input: LaunchActionInput = {}): LaunchRunReport {
    return this.controller.generateLaunchRecommendations(input);
  }

  getLatestReport(): LaunchRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getReadinessRecords() {
    return this.controller.getManager().getReadinessRecords();
  }

  updateConfiguration(
    overrides: Partial<LaunchReadinessValidatorConfiguration>,
  ): LaunchReadinessValidatorState {
    const next = buildLaunchReadinessValidatorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Launch Readiness Validator status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No launch readiness operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LaunchCockpitSnapshot {
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
      totalReadinessRecords: state.health.totalReadinessRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getLrvLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLaunchReadinessValidator(
  bootstrap: EmpireBootstrapContext,
  dependencies: LaunchReadinessValidatorDependencies,
  options?: LaunchReadinessValidatorOptions,
): LaunchReadinessValidator {
  return new LaunchReadinessValidator(bootstrap, dependencies, options);
}

export function resetLaunchReadinessValidatorForTesting(): void {
  resetLrvLogsForTesting();
  new LaunchReadinessManager({
    companyFactoryFramework: null,
    businessModelGenerator: null,
    brandCreationEngine: null,
    domainDigitalAssetPlanner: null,
    storeGenerationEngine: null,
    productPortfolioBuilder: null,
    pricingStrategyEngine: null,
  }).resetForTesting();
}
