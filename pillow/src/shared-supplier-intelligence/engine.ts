import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSharedSupplierIntelligenceConfiguration,
  type SharedSupplierIntelligenceConfiguration,
} from "./configuration.js";
import { appendSsiLog, getSsiLogs, resetSsiLogsForTesting } from "./ssi-logging.js";
import { SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectSharedSupplierIntelligenceInput,
  ConsolidateSupplierKnowledgeInput,
  DetectSupplierDuplicatesInput,
  DetectSupplierRisksInput,
  RecommendSupplierInput,
  RunSupplierIntelligenceDiagnosticsInput,
  ShareSupplierIntelligenceInput,
  SharedSupplierIntelligenceState,
  SupplierIntelligenceCockpitSnapshot,
  SupplierIntelligenceRunReport,
  TrackSupplierPerformanceInput,
} from "./types.js";
import { SharedSupplierIntelligenceController } from "./shared-supplier-intelligence-controller.js";
import {
  SharedSupplierIntelligenceManager,
  type SharedSupplierIntelligenceDependencies,
} from "./shared-supplier-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SharedSupplierIntelligenceOptions {
  configuration?: Partial<SharedSupplierIntelligenceConfiguration>;
}

export type { SharedSupplierIntelligenceDependencies };

/**
 * Shared Supplier Intelligence (PILLOW-SSI-001 / X2-13).
 * Supplier optimization — structural signals only; agreement-safe.
 */
export class SharedSupplierIntelligence {
  private initializedAt: string | null = null;
  private readonly controller: SharedSupplierIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: SharedSupplierIntelligenceDependencies,
    options: SharedSupplierIntelligenceOptions = {},
  ) {
    const config = buildSharedSupplierIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SharedSupplierIntelligenceManager(dependencies);
    this.controller = new SharedSupplierIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SharedSupplierIntelligenceState> {
    const doc = await this.reader.readText(SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Shared Supplier Intelligence")) {
      throw new Error(
        `${SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH} missing — requires X2-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSsiLog({
      event: "SHARED_SUPPLIER_INTELLIGENCE_ready",
      level: "info",
      details: "X2-13 Shared Supplier Intelligence initialized",
    });
    return this.getState();
  }

  getState(): SharedSupplierIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Shared Supplier Intelligence not initialized. Call initialize() first.",
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
      sharedSuppliers: this.controller.getManager().sharedCount(),
      highRiskSuppliers: this.controller.getManager().highRiskCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SSI-001",
      missionId: "X2-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSharedSupplierIntelligence(
    input: ConnectSharedSupplierIntelligenceInput = {},
  ): SupplierIntelligenceRunReport {
    return this.controller.connectSharedSupplierIntelligence(input);
  }

  consolidateSupplierKnowledge(
    input: ConsolidateSupplierKnowledgeInput,
  ): SupplierIntelligenceRunReport {
    return this.controller.consolidateSupplierKnowledge(input);
  }

  trackSupplierPerformance(input: TrackSupplierPerformanceInput): SupplierIntelligenceRunReport {
    return this.controller.trackSupplierPerformance(input);
  }

  detectSupplierRisks(input: DetectSupplierRisksInput = {}): SupplierIntelligenceRunReport {
    return this.controller.detectSupplierRisks(input);
  }

  detectSupplierDuplicates(
    input: DetectSupplierDuplicatesInput = {},
  ): SupplierIntelligenceRunReport {
    return this.controller.detectSupplierDuplicates(input);
  }

  generateRecommendations(input: RecommendSupplierInput = {}): SupplierIntelligenceRunReport {
    return this.controller.generateRecommendations(input);
  }

  shareSupplierIntelligence(input: ShareSupplierIntelligenceInput): SupplierIntelligenceRunReport {
    return this.controller.shareSupplierIntelligence(input);
  }

  runDiagnostics(
    input: RunSupplierIntelligenceDiagnosticsInput = {},
  ): SupplierIntelligenceRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): SupplierIntelligenceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getIntelligenceRecords() {
    return this.controller.getManager().getIntelligenceRecords();
  }

  updateConfiguration(
    overrides: Partial<SharedSupplierIntelligenceConfiguration>,
  ): SharedSupplierIntelligenceState {
    const next = buildSharedSupplierIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Shared: ${state.health.sharedSuppliers} · high-risk: ${state.health.highRiskSuppliers}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No supplier intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierIntelligenceCockpitSnapshot {
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
      sharedSuppliers: state.health.sharedSuppliers,
      highRiskSuppliers: state.health.highRiskSuppliers,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.crossCompanyResourceEngine ? 1 : 0) +
        (deps?.supplierFramework ? 1 : 0) +
        (deps?.supplierOperationsCertification ? 1 : 0),
      recentLogs: getSsiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSharedSupplierIntelligence(
  bootstrap: EmpireBootstrapContext,
  dependencies: SharedSupplierIntelligenceDependencies,
  options?: SharedSupplierIntelligenceOptions,
): SharedSupplierIntelligence {
  return new SharedSupplierIntelligence(bootstrap, dependencies, options);
}

export function resetSharedSupplierIntelligenceForTesting(): void {
  resetSsiLogsForTesting();
  new SharedSupplierIntelligenceManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    crossBusinessKnowledgeEngine: null,
    crossCompanyResourceEngine: null,
    supplierFramework: null,
    supplierOperationsCertification: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
