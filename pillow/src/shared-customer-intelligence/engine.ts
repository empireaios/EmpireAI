import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSharedCustomerIntelligenceConfiguration,
  type SharedCustomerIntelligenceConfiguration,
} from "./configuration.js";
import { appendSciLog, getSciLogs, resetSciLogsForTesting } from "./sci-logging.js";
import { SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeCustomerBehaviourInput,
  ConnectSharedCustomerIntelligenceInput,
  ConsolidateCustomerKnowledgeInput,
  CustomerIntelligenceCockpitSnapshot,
  CustomerIntelligenceRunReport,
  DetectCrossSellInput,
  DetectCustomerRisksInput,
  GenerateCustomerInsightsInput,
  RecommendCustomerIntelligenceInput,
  ResolveCustomerIdentityInput,
  RunCustomerIntelligenceDiagnosticsInput,
  SharedCustomerIntelligenceState,
} from "./types.js";
import { SharedCustomerIntelligenceController } from "./shared-customer-intelligence-controller.js";
import {
  SharedCustomerIntelligenceManager,
  type SharedCustomerIntelligenceDependencies,
} from "./shared-customer-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SharedCustomerIntelligenceOptions {
  configuration?: Partial<SharedCustomerIntelligenceConfiguration>;
}

export type { SharedCustomerIntelligenceDependencies };

/**
 * Shared Customer Intelligence (PILLOW-SCI-001 / X2-12).
 * Unified customer knowledge — structural signals only; privacy-safe.
 */
export class SharedCustomerIntelligence {
  private initializedAt: string | null = null;
  private readonly controller: SharedCustomerIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: SharedCustomerIntelligenceDependencies,
    options: SharedCustomerIntelligenceOptions = {},
  ) {
    const config = buildSharedCustomerIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SharedCustomerIntelligenceManager(dependencies);
    this.controller = new SharedCustomerIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SharedCustomerIntelligenceState> {
    const doc = await this.reader.readText(SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Shared Customer Intelligence")) {
      throw new Error(
        `${SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH} missing — requires X2-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSciLog({
      event: "SHARED_CUSTOMER_INTELLIGENCE_ready",
      level: "info",
      details: "X2-12 Shared Customer Intelligence initialized",
    });
    return this.getState();
  }

  getState(): SharedCustomerIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Shared Customer Intelligence not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const intelligence = this.controller.getManager().getIntelligenceRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalIntelligenceRecords: intelligence.length,
      crossCompanyRelationships: this.controller.getManager().crossCompanyCount(),
      highRiskCustomers: this.controller.getManager().highRiskCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SCI-001",
      missionId: "X2-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSharedCustomerIntelligence(
    input: ConnectSharedCustomerIntelligenceInput = {},
  ): CustomerIntelligenceRunReport {
    return this.controller.connectSharedCustomerIntelligence(input);
  }

  consolidateCustomerKnowledge(
    input: ConsolidateCustomerKnowledgeInput,
  ): CustomerIntelligenceRunReport {
    return this.controller.consolidateCustomerKnowledge(input);
  }

  resolveCustomerIdentity(input: ResolveCustomerIdentityInput): CustomerIntelligenceRunReport {
    return this.controller.resolveCustomerIdentity(input);
  }

  analyzeCustomerBehaviour(input: AnalyzeCustomerBehaviourInput): CustomerIntelligenceRunReport {
    return this.controller.analyzeCustomerBehaviour(input);
  }

  generateInsights(input: GenerateCustomerInsightsInput = {}): CustomerIntelligenceRunReport {
    return this.controller.generateInsights(input);
  }

  detectCrossSell(input: DetectCrossSellInput = {}): CustomerIntelligenceRunReport {
    return this.controller.detectCrossSell(input);
  }

  detectCustomerRisks(input: DetectCustomerRisksInput = {}): CustomerIntelligenceRunReport {
    return this.controller.detectCustomerRisks(input);
  }

  generateRecommendations(
    input: RecommendCustomerIntelligenceInput = {},
  ): CustomerIntelligenceRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(
    input: RunCustomerIntelligenceDiagnosticsInput = {},
  ): CustomerIntelligenceRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): CustomerIntelligenceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getIntelligenceRecords() {
    return this.controller.getManager().getIntelligenceRecords();
  }

  updateConfiguration(
    overrides: Partial<SharedCustomerIntelligenceConfiguration>,
  ): SharedCustomerIntelligenceState {
    const next = buildSharedCustomerIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Engine status: ${state.status}`,
        `Intelligence records: ${state.health.totalIntelligenceRecords}`,
        `Cross-company: ${state.health.crossCompanyRelationships} · high-risk: ${state.health.highRiskCustomers}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No customer intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CustomerIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalIntelligenceRecords: state.health.totalIntelligenceRecords,
      crossCompanyRelationships: state.health.crossCompanyRelationships,
      highRiskCustomers: state.health.highRiskCustomers,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.crossCompanyResourceEngine ? 1 : 0) +
        (deps?.customerIdentityEngine ? 1 : 0) +
        (deps?.customerOperationsCertification ? 1 : 0),
      recentLogs: getSciLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSharedCustomerIntelligence(
  bootstrap: EmpireBootstrapContext,
  dependencies: SharedCustomerIntelligenceDependencies,
  options?: SharedCustomerIntelligenceOptions,
): SharedCustomerIntelligence {
  return new SharedCustomerIntelligence(bootstrap, dependencies, options);
}

export function resetSharedCustomerIntelligenceForTesting(): void {
  resetSciLogsForTesting();
  new SharedCustomerIntelligenceManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    crossBusinessKnowledgeEngine: null,
    crossCompanyResourceEngine: null,
    customerIdentityEngine: null,
    customerOperationsCertification: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
