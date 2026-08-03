import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBrandCreationEngineConfiguration,
  type BrandCreationEngineConfiguration,
} from "./configuration.js";
import { appendBceLog, getBceLogs, resetBceLogsForTesting } from "./bce-logging.js";
import { BRAND_CREATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  BrandActionInput,
  BrandCockpitSnapshot,
  BrandCreationEngineState,
  BrandRunReport,
  ConnectBrandCreationEngineInput,
  CreateBrandInput,
} from "./types.js";
import { BrandCreationController } from "./brand-creation-controller.js";
import {
  BrandCreationManager,
  type BrandCreationEngineDependencies,
} from "./brand-creation-manager.js";

export interface BrandCreationEngineOptions {
  configuration?: Partial<BrandCreationEngineConfiguration>;
}

export type { BrandCreationEngineDependencies };

/**
 * Brand Creation Engine (PILLOW-BCE-001 / X1-05).
 * Automated branding — structural signals only.
 */
export class BrandCreationEngine {
  private initializedAt: string | null = null;
  private readonly controller: BrandCreationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BrandCreationEngineDependencies,
    options: BrandCreationEngineOptions = {},
  ) {
    const config = buildBrandCreationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BrandCreationManager(dependencies);
    this.controller = new BrandCreationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BrandCreationEngineState> {
    const doc = await this.reader.readText(BRAND_CREATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Brand Creation Engine")) {
      throw new Error(
        `${BRAND_CREATION_ENGINE_SYSTEM_PATH} missing — requires X1-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBceLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-05 Brand Creation Engine initialized",
    });
    return this.getState();
  }

  getState(): BrandCreationEngineState {
    if (!this.initializedAt) {
      throw new Error("Brand Creation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const brands = this.controller.getManager().getBrandRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBrandRecords: brands.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BCE-001",
      missionId: "X1-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBrandCreationEngine(
    input: ConnectBrandCreationEngineInput = {},
  ): BrandRunReport {
    return this.controller.connectBrandCreationEngine(input);
  }

  createBrand(input: CreateBrandInput = {}): BrandRunReport {
    return this.controller.createBrand(input);
  }

  generateCompanyName(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateCompanyName(input);
  }

  generateBrandIdentity(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateBrandIdentity(input);
  }

  generateBrandPositioning(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateBrandPositioning(input);
  }

  generateBrandMessaging(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateBrandMessaging(input);
  }

  generateBrandValues(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateBrandValues(input);
  }

  generateBrandVoice(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateBrandVoice(input);
  }

  generateColourRecommendations(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateColourRecommendations(input);
  }

  generateTypographyRecommendations(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateTypographyRecommendations(input);
  }

  generateBrandGuidelines(input: BrandActionInput = {}): BrandRunReport {
    return this.controller.generateBrandGuidelines(input);
  }

  getLatestReport(): BrandRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBrandRecords() {
    return this.controller.getManager().getBrandRecords();
  }

  updateConfiguration(
    overrides: Partial<BrandCreationEngineConfiguration>,
  ): BrandCreationEngineState {
    const next = buildBrandCreationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Brand Creation Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No brand creation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BrandCockpitSnapshot {
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
      totalBrandRecords: state.health.totalBrandRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getBceLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBrandCreationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: BrandCreationEngineDependencies,
  options?: BrandCreationEngineOptions,
): BrandCreationEngine {
  return new BrandCreationEngine(bootstrap, dependencies, options);
}

export function resetBrandCreationEngineForTesting(): void {
  resetBceLogsForTesting();
  new BrandCreationManager({
    companyFactoryFramework: null,
    businessOpportunityDiscovery: null,
    marketValidationEngine: null,
    businessModelGenerator: null,
  }).resetForTesting();
}
