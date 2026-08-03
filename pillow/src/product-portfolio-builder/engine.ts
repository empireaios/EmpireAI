import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductPortfolioBuilderConfiguration,
  type ProductPortfolioBuilderConfiguration,
} from "./configuration.js";
import { appendPpbLog, getPpbLogs, resetPpbLogsForTesting } from "./ppb-logging.js";
import { PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH } from "./paths.js";
import type {
  BuildPortfolioInput,
  ConnectProductPortfolioBuilderInput,
  PortfolioActionInput,
  ProductPortfolioBuilderState,
  ProductPortfolioCockpitSnapshot,
  ProductPortfolioRunReport,
} from "./types.js";
import { ProductPortfolioController } from "./product-portfolio-controller.js";
import {
  ProductPortfolioManager,
  type ProductPortfolioBuilderDependencies,
} from "./product-portfolio-manager.js";

export interface ProductPortfolioBuilderOptions {
  configuration?: Partial<ProductPortfolioBuilderConfiguration>;
}

export type { ProductPortfolioBuilderDependencies };

/**
 * Product Portfolio Builder (PILLOW-PPB-001 / X1-08).
 * Product portfolio generation — structural signals only; never auto-publishes.
 */
export class ProductPortfolioBuilder {
  private initializedAt: string | null = null;
  private readonly controller: ProductPortfolioController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ProductPortfolioBuilderDependencies,
    options: ProductPortfolioBuilderOptions = {},
  ) {
    const config = buildProductPortfolioBuilderConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ProductPortfolioManager(dependencies);
    this.controller = new ProductPortfolioController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ProductPortfolioBuilderState> {
    const doc = await this.reader.readText(PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH);
    if (!doc?.includes("Product Portfolio Builder")) {
      throw new Error(
        `${PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH} missing — requires X1-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPpbLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-08 Product Portfolio Builder initialized",
    });
    return this.getState();
  }

  getState(): ProductPortfolioBuilderState {
    if (!this.initializedAt) {
      throw new Error("Product Portfolio Builder not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const portfolios = this.controller.getManager().getPortfolioRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPortfolioRecords: portfolios.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PPB-001",
      missionId: "X1-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectProductPortfolioBuilder(
    input: ConnectProductPortfolioBuilderInput = {},
  ): ProductPortfolioRunReport {
    return this.controller.connectProductPortfolioBuilder(input);
  }

  buildPortfolio(input: BuildPortfolioInput = {}): ProductPortfolioRunReport {
    return this.controller.buildPortfolio(input);
  }

  discoverProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.discoverProducts(input);
  }

  evaluateProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.evaluateProducts(input);
  }

  categorizeProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.categorizeProducts(input);
  }

  rankProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.rankProducts(input);
  }

  estimateProfitability(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.estimateProfitability(input);
  }

  estimateDemand(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.estimateDemand(input);
  }

  detectOverlappingProducts(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.detectOverlappingProducts(input);
  }

  optimizePortfolio(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.optimizePortfolio(input);
  }

  recommendImprovements(input: PortfolioActionInput = {}): ProductPortfolioRunReport {
    return this.controller.recommendImprovements(input);
  }

  getLatestReport(): ProductPortfolioRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPortfolioRecords() {
    return this.controller.getManager().getPortfolioRecords();
  }

  updateConfiguration(
    overrides: Partial<ProductPortfolioBuilderConfiguration>,
  ): ProductPortfolioBuilderState {
    const next = buildProductPortfolioBuilderConfiguration(this.bootstrap.repositoryRoot, {
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
        `Product Portfolio Builder status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No portfolio generation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProductPortfolioCockpitSnapshot {
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
      totalPortfolioRecords: state.health.totalPortfolioRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getPpbLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createProductPortfolioBuilder(
  bootstrap: EmpireBootstrapContext,
  dependencies: ProductPortfolioBuilderDependencies,
  options?: ProductPortfolioBuilderOptions,
): ProductPortfolioBuilder {
  return new ProductPortfolioBuilder(bootstrap, dependencies, options);
}

export function resetProductPortfolioBuilderForTesting(): void {
  resetPpbLogsForTesting();
  new ProductPortfolioManager({
    companyFactoryFramework: null,
    businessOpportunityDiscovery: null,
    marketValidationEngine: null,
    businessModelGenerator: null,
    storeGenerationEngine: null,
  }).resetForTesting();
}
