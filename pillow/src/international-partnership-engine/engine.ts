/** X4-12 — International Partnership Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildInternationalPartnershipEngineConfiguration,
  type InternationalPartnershipEngineConfiguration,
} from "./configuration.js";
import { appendIpeLog, getIpeLogs, resetIpeLogsForTesting } from "./ipe-logging.js";
import { INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectInternationalPartnershipEngineInput,
  InternationalPartnershipEngineState,
  IpeCockpitSnapshot,
  IpeRunReport,
  PartnershipAnalysisInput,
  RunIpeDiagnosticsInput,
} from "./types.js";
import { InternationalPartnershipController } from "./international-partnership-controller.js";
import {
  InternationalPartnershipManager,
  type InternationalPartnershipEngineDependencies,
} from "./international-partnership-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface InternationalPartnershipEngineOptions {
  configuration?: Partial<InternationalPartnershipEngineConfiguration>;
}

export type { InternationalPartnershipEngineDependencies };

/**
 * International Partnership Engine (PILLOW-IPE-001 / X4-12).
 * Enterprise international partnership management — structural signals only;
 * never approve strategic partnerships without validation.
 */
export class InternationalPartnershipEngine {
  private initializedAt: string | null = null;
  private readonly controller: InternationalPartnershipController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: InternationalPartnershipEngineDependencies,
    options: InternationalPartnershipEngineOptions = {},
  ) {
    const config = buildInternationalPartnershipEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new InternationalPartnershipManager(dependencies);
    this.controller = new InternationalPartnershipController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<InternationalPartnershipEngineState> {
    const doc = await this.reader.readText(INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("International Partnership Engine")) {
      throw new Error(
        `${INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH} missing — International Partnership Engine requires X4-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendIpeLog({
      event: "INTERNATIONAL_PARTNERSHIP_ENGINE_ready",
      level: "info",
      details:
        "X4-12 International Partnership Engine initialized — structural signals only; never approve strategic partnerships without validation",
    });
    return this.getState();
  }

  getState(): InternationalPartnershipEngineState {
    if (!this.initializedAt) {
      throw new Error("International Partnership Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getPartnershipRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPartnershipRecords: records.length,
      riskCount: this.controller.getManager().riskCount(),
      opportunityCount: this.controller.getManager().opportunityCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-IPE-001",
      missionId: "X4-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectInternationalPartnershipEngine(
    input: ConnectInternationalPartnershipEngineInput = {},
  ): IpeRunReport {
    return this.controller.connectInternationalPartnershipEngine(input);
  }

  manageStrategicPartnerships(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.manageStrategicPartnerships(input);
  }

  manageRegionalPartnerNetworks(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.manageRegionalPartnerNetworks(input);
  }

  evaluateProspectivePartners(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.evaluateProspectivePartners(input);
  }

  monitorPartnerPerformance(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.monitorPartnerPerformance(input);
  }

  monitorPartnerReliability(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.monitorPartnerReliability(input);
  }

  monitorPartnershipValue(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.monitorPartnershipValue(input);
  }

  detectPartnershipRisks(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.detectPartnershipRisks(input);
  }

  detectPartnershipOpportunities(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.detectPartnershipOpportunities(input);
  }

  recommendPartnership(input: PartnershipAnalysisInput = {}): IpeRunReport {
    return this.controller.recommendPartnership(input);
  }

  runDiagnostics(input: RunIpeDiagnosticsInput = {}): IpeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): IpeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPartnershipRecords() {
    return this.controller.getManager().getPartnershipRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<InternationalPartnershipEngineConfiguration>,
  ): InternationalPartnershipEngineState {
    const next = buildInternationalPartnershipEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Partnership records: ${state.health.totalPartnershipRecords}`,
        `Risks: ${state.health.riskCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No international partnership operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): IpeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalPartnershipRecords: state.health.totalPartnershipRecords,
      riskCount: state.health.riskCount,
      opportunityCount: state.health.opportunityCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getIpeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createInternationalPartnershipEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: InternationalPartnershipEngineDependencies,
  options?: InternationalPartnershipEngineOptions,
): InternationalPartnershipEngine {
  return new InternationalPartnershipEngine(bootstrap, dependencies, options);
}

export function resetInternationalPartnershipEngineForTesting(): void {
  resetIpeLogsForTesting();
  new InternationalPartnershipManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
