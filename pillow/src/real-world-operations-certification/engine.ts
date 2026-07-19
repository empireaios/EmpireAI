import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRealWorldOperationsCertificationConfiguration,
  type RealWorldOperationsCertificationConfiguration,
} from "./configuration.js";
import { appendRwocLog, getRwocLogs, resetRwocLogsForTesting } from "./rwoc-logging.js";
import {
  REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
} from "./paths.js";
import type {
  RealWorldOperationsCertificationCockpitSnapshot,
  RealWorldOperationsCertificationReport,
  RealWorldOperationsCertificationState,
  RunRealWorldOperationsCertificationInput,
} from "./types.js";
import { RealWorldOperationsCertificationController } from "./real-world-operations-certification-controller.js";
import { RealWorldOperationsCertificationManager } from "./real-world-operations-certification-manager.js";
import type { RealWorldOperationsCertificationContext } from "./real-world-operations-certification-context.js";
import { EMPTY_REAL_WORLD_CERTIFICATION_CONTEXT } from "./real-world-operations-certification-context.js";

export interface RealWorldOperationsCertificationEngineOptions {
  configuration?: Partial<RealWorldOperationsCertificationConfiguration>;
}

/**
 * Real World Operations Certification (PILLOW-RWOC-001 / R5-20).
 * Final platform certification across R1–R5 under Grand King governance.
 */
export class RealWorldOperationsCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: RealWorldOperationsCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    ctx: RealWorldOperationsCertificationContext,
    options: RealWorldOperationsCertificationEngineOptions = {},
  ) {
    const config = buildRealWorldOperationsCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RealWorldOperationsCertificationManager();
    this.controller = new RealWorldOperationsCertificationController(ctx, manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RealWorldOperationsCertificationState> {
    const doc = await this.reader.readText(REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Real World Operations Certification")) {
      throw new Error(
        `${REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH} missing — requires R5-20 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRwocLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-20 Real World Operations Certification initialized",
    });
    return this.getState();
  }

  getState(): RealWorldOperationsCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Real World Operations Certification not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-RWOC-001",
      missionId: "R5-20",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runRealWorldOperationsCertification(
    input: RunRealWorldOperationsCertificationInput = {},
  ): Promise<RealWorldOperationsCertificationReport> {
    return this.controller.runRealWorldOperationsCertification(input);
  }

  validateLatestReport() {
    return this.controller.validateLatestReport();
  }

  getLatestReport(): RealWorldOperationsCertificationReport | null {
    return this.controller.getLatestReport();
  }

  getCertifiedProgrammeCatalog() {
    return this.controller.getManager().getCertifiedProgrammeCatalog();
  }

  updateConfiguration(
    overrides: Partial<RealWorldOperationsCertificationConfiguration>,
  ): RealWorldOperationsCertificationState {
    const next = buildRealWorldOperationsCertificationConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.operationalReadinessScore
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Real World Operations Certification status: ${state.status}`,
        report
          ? `Last certification: ${report.overallCertificationStatus} · readiness=${report.operationalReadinessScore}`
          : "No real-world certification runs yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RealWorldOperationsCertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastCertificationAt: state.health.lastCertificationAt,
      lastCertificationStatus: state.health.lastCertificationStatus,
      programmesCertified: state.health.programmesCertified,
      operationalReadinessScore: report?.operationalReadinessScore ?? null,
      overallCertificationStatus: report?.overallCertificationStatus ?? null,
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      recentLogs: getRwocLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createRealWorldOperationsCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  ctx: RealWorldOperationsCertificationContext,
  options?: RealWorldOperationsCertificationEngineOptions,
): RealWorldOperationsCertificationEngine {
  return new RealWorldOperationsCertificationEngine(bootstrap, ctx, options);
}

export function resetRealWorldOperationsCertificationForTesting(): void {
  resetRwocLogsForTesting();
  // Context is owned by callers; logging reset is sufficient for test isolation.
  void EMPTY_REAL_WORLD_CERTIFICATION_CONTEXT;
}
