import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildStoreGenerationEngineConfiguration,
  type StoreGenerationEngineConfiguration,
} from "./configuration.js";
import { appendSgeLog, getSgeLogs, resetSgeLogsForTesting } from "./sge-logging.js";
import { STORE_GENERATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectStoreGenerationEngineInput,
  GenerateStorefrontInput,
  StorefrontActionInput,
  StorefrontCockpitSnapshot,
  StoreGenerationEngineState,
  StorefrontRunReport,
} from "./types.js";
import { StoreGenerationController } from "./store-generation-controller.js";
import {
  StoreGenerationManager,
  type StoreGenerationEngineDependencies,
} from "./store-generation-manager.js";

export interface StoreGenerationEngineOptions {
  configuration?: Partial<StoreGenerationEngineConfiguration>;
}

export type { StoreGenerationEngineDependencies };

/**
 * Store Generation Engine (PILLOW-SGE-001 / X1-07).
 * Automated storefront creation — structural signals only; never auto-deploys.
 */
export class StoreGenerationEngine {
  private initializedAt: string | null = null;
  private readonly controller: StoreGenerationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: StoreGenerationEngineDependencies,
    options: StoreGenerationEngineOptions = {},
  ) {
    const config = buildStoreGenerationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new StoreGenerationManager(dependencies);
    this.controller = new StoreGenerationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<StoreGenerationEngineState> {
    const doc = await this.reader.readText(STORE_GENERATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Store Generation Engine")) {
      throw new Error(
        `${STORE_GENERATION_ENGINE_SYSTEM_PATH} missing — requires X1-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSgeLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-07 Store Generation Engine initialized",
    });
    return this.getState();
  }

  getState(): StoreGenerationEngineState {
    if (!this.initializedAt) {
      throw new Error("Store Generation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const storefronts = this.controller.getManager().getStorefrontRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalStorefrontRecords: storefronts.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SGE-001",
      missionId: "X1-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectStoreGenerationEngine(
    input: ConnectStoreGenerationEngineInput = {},
  ): StorefrontRunReport {
    return this.controller.connectStoreGenerationEngine(input);
  }

  generateStorefront(input: GenerateStorefrontInput = {}): StorefrontRunReport {
    return this.controller.generateStorefront(input);
  }

  createWebsiteStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.createWebsiteStructure(input);
  }

  createNavigationStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.createNavigationStructure(input);
  }

  createHomepageLayout(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.createHomepageLayout(input);
  }

  createProductCatalogueStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.createProductCatalogueStructure(input);
  }

  createCategoryStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.createCategoryStructure(input);
  }

  createCompanyInformationPages(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.createCompanyInformationPages(input);
  }

  prepareLegalPageTemplates(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.prepareLegalPageTemplates(input);
  }

  prepareDeploymentPackage(input: StorefrontActionInput = {}): StorefrontRunReport {
    return this.controller.prepareDeploymentPackage(input);
  }

  getLatestReport(): StorefrontRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getStorefrontRecords() {
    return this.controller.getManager().getStorefrontRecords();
  }

  updateConfiguration(
    overrides: Partial<StoreGenerationEngineConfiguration>,
  ): StoreGenerationEngineState {
    const next = buildStoreGenerationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Store Generation Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No storefront generation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): StorefrontCockpitSnapshot {
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
      totalStorefrontRecords: state.health.totalStorefrontRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getSgeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createStoreGenerationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: StoreGenerationEngineDependencies,
  options?: StoreGenerationEngineOptions,
): StoreGenerationEngine {
  return new StoreGenerationEngine(bootstrap, dependencies, options);
}

export function resetStoreGenerationEngineForTesting(): void {
  resetSgeLogsForTesting();
  new StoreGenerationManager({
    companyFactoryFramework: null,
    businessModelGenerator: null,
    brandCreationEngine: null,
    domainDigitalAssetPlanner: null,
  }).resetForTesting();
}
