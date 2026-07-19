import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildFinancialOperationsCertificationConfiguration,
  type FinancialOperationsCertificationConfiguration,
} from "./configuration.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./foc-logging.js";
import {
  FINANCIAL_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
} from "./paths.js";
import type {
  RunFinancialOperationsCertificationInput,
  FinancialOperationsCertificationCockpitSnapshot,
  FinancialOperationsCertificationReport,
  FinancialOperationsCertificationState,
} from "./types.js";
import { FinancialOperationsCertificationController } from "./financial-operations-certification-controller.js";
import { FinancialOperationsCertificationManager } from "./financial-operations-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FinancialOperationsCertificationContext } from "./financial-operations-certification-context.js";

export interface FinancialOperationsCertificationEngineOptions {
  configuration?: Partial<FinancialOperationsCertificationConfiguration>;
}

/**
 * Financial Operations Certification (PILLOW-FOC-001 / R3-18).
 * Validates the complete Financial Infrastructure programme (R3-01 through R3-17).
 */
export class FinancialOperationsCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: FinancialOperationsCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    ctx: FinancialOperationsCertificationContext,
    options: FinancialOperationsCertificationEngineOptions = {},
  ) {
    const config = buildFinancialOperationsCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FinancialOperationsCertificationManager();
    this.controller = new FinancialOperationsCertificationController(ctx, manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FinancialOperationsCertificationState> {
    const doc = await this.reader.readText(FINANCIAL_OPERATIONS_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Financial Operations Certification")) {
      throw new Error(
        `${FINANCIAL_OPERATIONS_CERTIFICATION_SYSTEM_PATH} missing — Financial Operations Certification requires R3-18 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-18 Financial Operations Certification initialized",
    });
    return this.getState();
  }

  getState(): FinancialOperationsCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Financial Operations Certification not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FOC-001",
      missionId: "R3-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runFinancialOperationsCertification(
    input: RunFinancialOperationsCertificationInput = {},
  ): Promise<FinancialOperationsCertificationReport> {
    return this.controller.runFinancialOperationsCertification(input);
  }

  validateLatestReport() {
    return this.controller.validateLatestReport();
  }

  getLatestReport(): FinancialOperationsCertificationReport | null {
    return this.controller.getLatestReport();
  }

  getCertifiedMissionCatalog() {
    return this.controller.getManager().getCertifiedMissionCatalog();
  }

  updateConfiguration(
    overrides: Partial<FinancialOperationsCertificationConfiguration>,
  ): FinancialOperationsCertificationState {
    const next = buildFinancialOperationsCertificationConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.overallCertificationStatus === "certified"
        ? 100
        : report.overallCertificationStatus === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Certification status: ${state.status}`,
        report
          ? `Last certification: ${report.overallCertificationStatus} · ${report.certificationId}`
          : "No certification runs yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FinancialOperationsCertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastCertificationAt: state.health.lastCertificationAt,
      lastCertificationStatus: state.health.lastCertificationStatus,
      missionsCertified: state.health.missionsCertified,
      overallCertificationStatus: report?.overallCertificationStatus ?? null,
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createFinancialOperationsCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  ctx: FinancialOperationsCertificationContext,
  options?: FinancialOperationsCertificationEngineOptions,
): FinancialOperationsCertificationEngine {
  return new FinancialOperationsCertificationEngine(bootstrap, ctx, options);
}

export function resetFinancialOperationsCertificationForTesting(): void {
  resetCertificationLogsForTesting();
  new FinancialOperationsCertificationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
