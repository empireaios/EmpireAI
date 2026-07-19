import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketValidationEngineConfiguration,
  type MarketValidationEngineConfiguration,
} from "./configuration.js";
import { appendMveLog, getMveLogs, resetMveLogsForTesting } from "./mve-logging.js";
import { MARKET_VALIDATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectMarketValidationEngineInput,
  MarketValidationActionInput,
  MarketValidationCockpitSnapshot,
  MarketValidationEngineState,
  MarketValidationRunReport,
  ValidateOpportunityInput,
} from "./types.js";
import { MarketValidationController } from "./market-validation-controller.js";
import {
  MarketValidationManager,
  type MarketValidationEngineDependencies,
} from "./market-validation-manager.js";

export interface MarketValidationEngineOptions {
  configuration?: Partial<MarketValidationEngineConfiguration>;
}

export type { MarketValidationEngineDependencies };

/**
 * Market Validation Engine (PILLOW-MVE-001 / X1-03).
 * Verifies opportunities before investment — structural signals only.
 */
export class MarketValidationEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketValidationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: MarketValidationEngineDependencies,
    options: MarketValidationEngineOptions = {},
  ) {
    const config = buildMarketValidationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketValidationManager(dependencies);
    this.controller = new MarketValidationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketValidationEngineState> {
    const doc = await this.reader.readText(MARKET_VALIDATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Market Validation Engine")) {
      throw new Error(
        `${MARKET_VALIDATION_ENGINE_SYSTEM_PATH} missing — requires X1-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMveLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-03 Market Validation Engine initialized",
    });
    return this.getState();
  }

  getState(): MarketValidationEngineState {
    if (!this.initializedAt) {
      throw new Error("Market Validation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const validations = this.controller.getManager().getValidationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalValidationRecords: validations.length,
      averageValidationConfidence: this.controller.getManager().averageValidationConfidence(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MVE-001",
      missionId: "X1-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectMarketValidationEngine(
    input: ConnectMarketValidationEngineInput = {},
  ): MarketValidationRunReport {
    return this.controller.connectMarketValidationEngine(input);
  }

  validateOpportunity(input: ValidateOpportunityInput = {}): MarketValidationRunReport {
    return this.controller.validateOpportunity(input);
  }

  validateMarketDemand(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    return this.controller.validateMarketDemand(input);
  }

  validateCustomerInterest(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    return this.controller.validateCustomerInterest(input);
  }

  validateCompetitiveLandscape(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    return this.controller.validateCompetitiveLandscape(input);
  }

  validateMarketSize(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    return this.controller.validateMarketSize(input);
  }

  validateProfitabilityPotential(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    return this.controller.validateProfitabilityPotential(input);
  }

  calculateValidationConfidence(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    return this.controller.calculateValidationConfidence(input);
  }

  identifyMarketRisks(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    return this.controller.identifyMarketRisks(input);
  }

  generateInvestmentRecommendation(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    return this.controller.generateInvestmentRecommendation(input);
  }

  getLatestReport(): MarketValidationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getValidationRecords() {
    return this.controller.getManager().getValidationRecords();
  }

  updateConfiguration(
    overrides: Partial<MarketValidationEngineConfiguration>,
  ): MarketValidationEngineState {
    const next = buildMarketValidationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Market Validation Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No market validation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MarketValidationCockpitSnapshot {
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
      totalValidationRecords: state.health.totalValidationRecords,
      averageValidationConfidence: state.health.averageValidationConfidence,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getMveLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMarketValidationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: MarketValidationEngineDependencies,
  options?: MarketValidationEngineOptions,
): MarketValidationEngine {
  return new MarketValidationEngine(bootstrap, dependencies, options);
}

export function resetMarketValidationEngineForTesting(): void {
  resetMveLogsForTesting();
  new MarketValidationManager({
    companyFactoryFramework: null,
    businessOpportunityDiscovery: null,
  }).resetForTesting();
}
