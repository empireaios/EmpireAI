import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCustomerOperationsCertificationConfiguration,
  type CustomerOperationsCertificationConfiguration,
} from "./configuration.js";
import {
  appendCocLog,
  getCocLogs,
  resetCocLogsForTesting,
} from "./coc-logging.js";
import {
  CUSTOMER_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
} from "./paths.js";
import type {
  RunCustomerOperationsCertificationInput,
  CustomerOperationsCertificationCockpitSnapshot,
  CustomerOperationsCertificationReport,
  CustomerOperationsCertificationState,
} from "./types.js";
import { CustomerOperationsCertificationController } from "./customer-operations-certification-controller.js";
import { CustomerOperationsCertificationManager } from "./customer-operations-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerOperationsCertificationContext } from "./customer-operations-certification-context.js";

export interface CustomerOperationsCertificationEngineOptions {
  configuration?: Partial<CustomerOperationsCertificationConfiguration>;
}

/**
 * Customer Operations Certification (PILLOW-COC-001 / R4-19).
 * Validates the complete Customer Operations programme (R4-01 through R4-18).
 */
export class CustomerOperationsCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerOperationsCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    ctx: CustomerOperationsCertificationContext,
    options: CustomerOperationsCertificationEngineOptions = {},
  ) {
    const config = buildCustomerOperationsCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerOperationsCertificationManager();
    this.controller = new CustomerOperationsCertificationController(ctx, manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerOperationsCertificationState> {
    const doc = await this.reader.readText(CUSTOMER_OPERATIONS_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Customer Operations Certification")) {
      throw new Error(
        `${CUSTOMER_OPERATIONS_CERTIFICATION_SYSTEM_PATH} missing — Customer Operations Certification requires R4-19 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCocLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-19 Customer Operations Certification initialized",
    });
    return this.getState();
  }

  getState(): CustomerOperationsCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Customer Operations Certification not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-COC-001",
      missionId: "R4-19",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runCustomerOperationsCertification(
    input: RunCustomerOperationsCertificationInput = {},
  ): Promise<CustomerOperationsCertificationReport> {
    return this.controller.runCustomerOperationsCertification(input);
  }

  validateLatestReport() {
    return this.controller.validateLatestReport();
  }

  getLatestReport(): CustomerOperationsCertificationReport | null {
    return this.controller.getLatestReport();
  }

  getCertifiedMissionCatalog() {
    return this.controller.getManager().getCertifiedMissionCatalog();
  }

  updateConfiguration(
    overrides: Partial<CustomerOperationsCertificationConfiguration>,
  ): CustomerOperationsCertificationState {
    const next = buildCustomerOperationsCertificationConfiguration(this.bootstrap.repositoryRoot, {
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

  getCockpitSnapshot(): CustomerOperationsCertificationCockpitSnapshot {
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
      recentLogs: getCocLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createCustomerOperationsCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  ctx: CustomerOperationsCertificationContext,
  options?: CustomerOperationsCertificationEngineOptions,
): CustomerOperationsCertificationEngine {
  return new CustomerOperationsCertificationEngine(bootstrap, ctx, options);
}

export function resetCustomerOperationsCertificationForTesting(): void {
  resetCocLogsForTesting();
  new CustomerOperationsCertificationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
