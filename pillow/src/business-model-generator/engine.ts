import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessModelGeneratorConfiguration,
  type BusinessModelGeneratorConfiguration,
} from "./configuration.js";
import { appendBmgLog, getBmgLogs, resetBmgLogsForTesting } from "./bmg-logging.js";
import { BUSINESS_MODEL_GENERATOR_SYSTEM_PATH } from "./paths.js";
import type {
  BusinessModelActionInput,
  BusinessModelCockpitSnapshot,
  BusinessModelGeneratorState,
  BusinessModelRunReport,
  ConnectBusinessModelGeneratorInput,
  GenerateBusinessModelInput,
} from "./types.js";
import { BusinessModelGeneratorController } from "./business-model-generator-controller.js";
import {
  BusinessModelGeneratorManager,
  type BusinessModelGeneratorDependencies,
} from "./business-model-generator-manager.js";

export interface BusinessModelGeneratorOptions {
  configuration?: Partial<BusinessModelGeneratorConfiguration>;
}

export type { BusinessModelGeneratorDependencies };

/**
 * Business Model Generator (PILLOW-BMG-001 / X1-04).
 * AI generates viable business models — structural signals only.
 */
export class BusinessModelGenerator {
  private initializedAt: string | null = null;
  private readonly controller: BusinessModelGeneratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BusinessModelGeneratorDependencies,
    options: BusinessModelGeneratorOptions = {},
  ) {
    const config = buildBusinessModelGeneratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BusinessModelGeneratorManager(dependencies);
    this.controller = new BusinessModelGeneratorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BusinessModelGeneratorState> {
    const doc = await this.reader.readText(BUSINESS_MODEL_GENERATOR_SYSTEM_PATH);
    if (!doc?.includes("Business Model Generator")) {
      throw new Error(
        `${BUSINESS_MODEL_GENERATOR_SYSTEM_PATH} missing — requires X1-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBmgLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-04 Business Model Generator initialized",
    });
    return this.getState();
  }

  getState(): BusinessModelGeneratorState {
    if (!this.initializedAt) {
      throw new Error("Business Model Generator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const models = this.controller.getManager().getBusinessModelRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBusinessModelRecords: models.length,
      averageBusinessModelScore: this.controller.getManager().averageBusinessModelScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BMG-001",
      missionId: "X1-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBusinessModelGenerator(
    input: ConnectBusinessModelGeneratorInput = {},
  ): BusinessModelRunReport {
    return this.controller.connectBusinessModelGenerator(input);
  }

  generateBusinessModel(input: GenerateBusinessModelInput = {}): BusinessModelRunReport {
    return this.controller.generateBusinessModel(input);
  }

  generateRevenueModel(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generateRevenueModel(input);
  }

  generateCostStructure(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generateCostStructure(input);
  }

  generateValueProposition(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generateValueProposition(input);
  }

  generateCustomerSegments(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generateCustomerSegments(input);
  }

  generateDistributionChannels(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generateDistributionChannels(input);
  }

  generatePartnershipStrategies(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generatePartnershipStrategies(input);
  }

  generateOperationalModels(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.generateOperationalModels(input);
  }

  scoreBusinessModels(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    return this.controller.scoreBusinessModels(input);
  }

  getLatestReport(): BusinessModelRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBusinessModelRecords() {
    return this.controller.getManager().getBusinessModelRecords();
  }

  updateConfiguration(
    overrides: Partial<BusinessModelGeneratorConfiguration>,
  ): BusinessModelGeneratorState {
    const next = buildBusinessModelGeneratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Business Model Generator status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No business model generation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BusinessModelCockpitSnapshot {
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
      totalBusinessModelRecords: state.health.totalBusinessModelRecords,
      averageBusinessModelScore: state.health.averageBusinessModelScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getBmgLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBusinessModelGenerator(
  bootstrap: EmpireBootstrapContext,
  dependencies: BusinessModelGeneratorDependencies,
  options?: BusinessModelGeneratorOptions,
): BusinessModelGenerator {
  return new BusinessModelGenerator(bootstrap, dependencies, options);
}

export function resetBusinessModelGeneratorForTesting(): void {
  resetBmgLogsForTesting();
  new BusinessModelGeneratorManager({
    companyFactoryFramework: null,
    businessOpportunityDiscovery: null,
    marketValidationEngine: null,
  }).resetForTesting();
}
