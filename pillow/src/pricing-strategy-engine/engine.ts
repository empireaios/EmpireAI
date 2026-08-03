import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPricingStrategyEngineConfiguration,
  type PricingStrategyEngineConfiguration,
} from "./configuration.js";
import { appendPseLog, getPseLogs, resetPseLogsForTesting } from "./pse-logging.js";
import { PRICING_STRATEGY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectPricingStrategyEngineInput,
  GeneratePricingStrategyInput,
  PricingActionInput,
  PricingCockpitSnapshot,
  PricingRunReport,
  PricingStrategyEngineState,
} from "./types.js";
import { PricingStrategyController } from "./pricing-strategy-controller.js";
import {
  PricingStrategyManager,
  type PricingStrategyEngineDependencies,
} from "./pricing-strategy-manager.js";

export interface PricingStrategyEngineOptions {
  configuration?: Partial<PricingStrategyEngineConfiguration>;
}

export type { PricingStrategyEngineDependencies };

/**
 * Pricing Strategy Engine (PILLOW-PSE-001 / X1-09).
 * Dynamic pricing strategy — structural signals only; never auto-publishes.
 */
export class PricingStrategyEngine {
  private initializedAt: string | null = null;
  private readonly controller: PricingStrategyController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PricingStrategyEngineDependencies,
    options: PricingStrategyEngineOptions = {},
  ) {
    const config = buildPricingStrategyEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PricingStrategyManager(dependencies);
    this.controller = new PricingStrategyController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PricingStrategyEngineState> {
    const doc = await this.reader.readText(PRICING_STRATEGY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Pricing Strategy Engine")) {
      throw new Error(
        `${PRICING_STRATEGY_ENGINE_SYSTEM_PATH} missing — requires X1-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPseLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-09 Pricing Strategy Engine initialized",
    });
    return this.getState();
  }

  getState(): PricingStrategyEngineState {
    if (!this.initializedAt) {
      throw new Error("Pricing Strategy Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const pricingRecords = this.controller.getManager().getPricingRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPricingRecords: pricingRecords.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PSE-001",
      missionId: "X1-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPricingStrategyEngine(
    input: ConnectPricingStrategyEngineInput = {},
  ): PricingRunReport {
    return this.controller.connectPricingStrategyEngine(input);
  }

  generatePricingStrategy(input: GeneratePricingStrategyInput = {}): PricingRunReport {
    return this.controller.generatePricingStrategy(input);
  }

  calculateSellingPrice(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.calculateSellingPrice(input);
  }

  calculateProfitMargin(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.calculateProfitMargin(input);
  }

  evaluateCompetitorPricing(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.evaluateCompetitorPricing(input);
  }

  evaluateWillingnessToPay(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.evaluateWillingnessToPay(input);
  }

  selectPricingModel(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.selectPricingModel(input);
  }

  detectPricingConflicts(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.detectPricingConflicts(input);
  }

  detectUnprofitablePricing(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.detectUnprofitablePricing(input);
  }

  recommendImprovements(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.recommendImprovements(input);
  }

  analyzePricing(input: PricingActionInput = {}): PricingRunReport {
    return this.controller.analyzePricing(input);
  }

  getLatestReport(): PricingRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPricingRecords() {
    return this.controller.getManager().getPricingRecords();
  }

  updateConfiguration(
    overrides: Partial<PricingStrategyEngineConfiguration>,
  ): PricingStrategyEngineState {
    const next = buildPricingStrategyEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Pricing Strategy Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No pricing strategy operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PricingCockpitSnapshot {
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
      totalPricingRecords: state.health.totalPricingRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getPseLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPricingStrategyEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PricingStrategyEngineDependencies,
  options?: PricingStrategyEngineOptions,
): PricingStrategyEngine {
  return new PricingStrategyEngine(bootstrap, dependencies, options);
}

export function resetPricingStrategyEngineForTesting(): void {
  resetPseLogsForTesting();
  new PricingStrategyManager({
    companyFactoryFramework: null,
    marketValidationEngine: null,
    businessModelGenerator: null,
    productPortfolioBuilder: null,
  }).resetForTesting();
}
