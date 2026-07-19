import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSupplierOperationsCertificationConfiguration,
  type SupplierOperationsCertificationConfiguration,
} from "./configuration.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./soc-logging.js";
import {
  SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
} from "./paths.js";
import type {
  RunSupplierCertificationInput,
  SupplierOperationsCertificationCockpitSnapshot,
  SupplierOperationsCertificationReport,
  SupplierOperationsCertificationState,
} from "./types.js";
import { SupplierOperationsCertificationController } from "./supplier-operations-certification-controller.js";
import { SupplierOperationsCertificationManager } from "./supplier-operations-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";

export interface SupplierOperationsCertificationEngineOptions {
  configuration?: Partial<SupplierOperationsCertificationConfiguration>;
}

/**
 * Supplier Operations Certification (PILLOW-SOC-001 / R2-20).
 * Validates the complete Supplier & Fulfilment programme (R2-01 through R2-19).
 */
export class SupplierOperationsCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierOperationsCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    ctx: SupplierOperationsCertificationContext,
    options: SupplierOperationsCertificationEngineOptions = {},
  ) {
    const config = buildSupplierOperationsCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierOperationsCertificationManager();
    this.controller = new SupplierOperationsCertificationController(ctx, manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierOperationsCertificationState> {
    const doc = await this.reader.readText(SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Supplier Operations Certification")) {
      throw new Error(
        `${SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM_PATH} missing — Supplier Operations Certification requires R2-20 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-20 Supplier Operations Certification initialized",
    });
    return this.getState();
  }

  getState(): SupplierOperationsCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Supplier Operations Certification not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-SOC-001",
      missionId: "R2-20",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runSupplierCertification(
    input: RunSupplierCertificationInput = {},
  ): Promise<SupplierOperationsCertificationReport> {
    return this.controller.runSupplierCertification(input);
  }

  validateLatestReport() {
    return this.controller.validateLatestReport();
  }

  getLatestReport(): SupplierOperationsCertificationReport | null {
    return this.controller.getLatestReport();
  }

  getCertifiedMissionCatalog() {
    return this.controller.getManager().getCertifiedMissionCatalog();
  }

  updateConfiguration(
    overrides: Partial<SupplierOperationsCertificationConfiguration>,
  ): SupplierOperationsCertificationState {
    const next = buildSupplierOperationsCertificationConfiguration(this.bootstrap.repositoryRoot, {
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

  getCockpitSnapshot(): SupplierOperationsCertificationCockpitSnapshot {
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

export function createSupplierOperationsCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  ctx: SupplierOperationsCertificationContext,
  options?: SupplierOperationsCertificationEngineOptions,
): SupplierOperationsCertificationEngine {
  return new SupplierOperationsCertificationEngine(bootstrap, ctx, options);
}

export function resetSupplierOperationsCertificationForTesting(): void {
  resetCertificationLogsForTesting();
  new SupplierOperationsCertificationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
