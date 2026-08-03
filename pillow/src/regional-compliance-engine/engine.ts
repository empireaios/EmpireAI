/** X4-06 — Regional Compliance Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRegionalComplianceEngineConfiguration,
  type RegionalComplianceEngineConfiguration,
} from "./configuration.js";
import { appendRceLog, getRceLogs, resetRceLogsForTesting } from "./rce-logging.js";
import { REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ComplianceAnalysisInput,
  ConnectRegionalComplianceEngineInput,
  RegionalComplianceEngineState,
  RceCockpitSnapshot,
  RceRunReport,
  RunRceDiagnosticsInput,
} from "./types.js";
import { RegionalComplianceController } from "./regional-compliance-controller.js";
import {
  RegionalComplianceManager,
  type RegionalComplianceEngineDependencies,
} from "./regional-compliance-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface RegionalComplianceEngineOptions {
  configuration?: Partial<RegionalComplianceEngineConfiguration>;
}

export type { RegionalComplianceEngineDependencies };

/**
 * Regional Compliance Engine (PILLOW-RCE-001 / X4-06).
 * Enterprise regional compliance — structural signals only; never falsely certify.
 */
export class RegionalComplianceEngine {
  private initializedAt: string | null = null;
  private readonly controller: RegionalComplianceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: RegionalComplianceEngineDependencies,
    options: RegionalComplianceEngineOptions = {},
  ) {
    const config = buildRegionalComplianceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RegionalComplianceManager(dependencies);
    this.controller = new RegionalComplianceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RegionalComplianceEngineState> {
    const doc = await this.reader.readText(REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Regional Compliance Engine")) {
      throw new Error(
        `${REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH} missing — Regional Compliance Engine requires X4-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRceLog({
      event: "REGIONAL_COMPLIANCE_ENGINE_ready",
      level: "info",
      details:
        "X4-06 Regional Compliance Engine initialized — structural signals only; never falsely certify compliance",
    });
    return this.getState();
  }

  getState(): RegionalComplianceEngineState {
    if (!this.initializedAt) {
      throw new Error("Regional Compliance Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getComplianceRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalComplianceRecords: records.length,
      violationCount: this.controller.getManager().violationCount(),
      highRiskCount: this.controller.getManager().highRiskCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RCE-001",
      missionId: "X4-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectRegionalComplianceEngine(
    input: ConnectRegionalComplianceEngineInput = {},
  ): RceRunReport {
    return this.controller.connectRegionalComplianceEngine(input);
  }

  manageCountryRequirements(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.manageCountryRequirements(input);
  }

  monitorRegulatoryChanges(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.monitorRegulatoryChanges(input);
  }

  manageBusinessRules(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.manageBusinessRules(input);
  }

  assessOperational(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.assessOperational(input);
  }

  assessMarketplace(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.assessMarketplace(input);
  }

  assessDataProtection(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.assessDataProtection(input);
  }

  detectViolations(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.detectViolations(input);
  }

  assessRisks(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.assessRisks(input);
  }

  recommendCompliance(input: ComplianceAnalysisInput = {}): RceRunReport {
    return this.controller.recommendCompliance(input);
  }

  runDiagnostics(input: RunRceDiagnosticsInput = {}): RceRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): RceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getComplianceRecords() {
    return this.controller.getManager().getComplianceRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<RegionalComplianceEngineConfiguration>,
  ): RegionalComplianceEngineState {
    const next = buildRegionalComplianceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Compliance records: ${state.health.totalComplianceRecords}`,
        `Violations: ${state.health.violationCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No regional compliance operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalComplianceRecords: state.health.totalComplianceRecords,
      violationCount: state.health.violationCount,
      highRiskCount: state.health.highRiskCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getRceLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createRegionalComplianceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: RegionalComplianceEngineDependencies,
  options?: RegionalComplianceEngineOptions,
): RegionalComplianceEngine {
  return new RegionalComplianceEngine(bootstrap, dependencies, options);
}

export function resetRegionalComplianceEngineForTesting(): void {
  resetRceLogsForTesting();
  new RegionalComplianceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
