import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceFactoryCertificationConfiguration,
  type WorkforceFactoryCertificationConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { WORKFORCE_FACTORY_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { WorkforceFactoryCertificationController } from "./workforce-factory-certification-controller.js";
import { WorkforceFactoryCertificationCore } from "./workforce-factory-certification-core.js";
import { resetWfcLogsForTesting } from "./wfc-logging.js";
import type {
  WorkforceFactoryCertificationCockpitSnapshot,
  WorkforceFactoryCertificationInput,
  WorkforceFactoryCertificationState,
} from "./types.js";

export interface WorkforceFactoryCertificationOptions {
  configuration?: Partial<WorkforceFactoryCertificationConfiguration>;
}

/** Authoritative Q1-13 Workforce Factory Certification — final Q1 acceptance gate. */
export class WorkforceFactoryCertification {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceFactoryCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkforceFactoryCertificationOptions = {},
  ) {
    this.controller = new WorkforceFactoryCertificationController(
      new WorkforceFactoryCertificationCore(),
      buildWorkforceFactoryCertificationConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKFORCE_FACTORY_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Workforce Factory Certification")) {
      throw new Error(
        `${WORKFORCE_FACTORY_CERTIFICATION_SYSTEM_PATH} missing — Q1-13 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkforceFactoryCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Workforce Factory Certification not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WFC-001",
      missionId: "Q1-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalCertificationReports: this.getReports().length,
        certifiedCount: engineRecord?.certifiedCount ?? 0,
        failedCount: engineRecord?.failedCount ?? 0,
        lastFinalResult: engineRecord?.lastFinalResult ?? null,
        q1ProductionReady: engineRecord?.q1ProductionReady ?? false,
        q2ReadinessConfirmed: engineRecord?.q2ReadinessConfirmed ?? false,
        notes: [
          "Acceptance gate only: does not execute worker tasks, modify workforce components, repair failures, begin Q2, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkforceFactoryCertification(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  certifyFactory(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.certifyFactory(input);
  }

  verifyComponent(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.verifyComponent(input);
  }

  verifyIntegration(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.verifyIntegration(input);
  }

  verifyGovernance(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.verifyGovernance(input);
  }

  assessReadiness(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.assessReadiness(input);
  }

  produceReport(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.produceReport(input);
  }

  listCertificationReports() {
    return this.controller.list();
  }

  validateWorkforceFactoryCertification(input: WorkforceFactoryCertificationInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getLatestCertificationReport() {
    return this.controller.getManager().getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Workforce Factory reports: ${state.health.totalCertificationReports}`,
        `Q1 production ready: ${state.health.q1ProductionReady}`,
        `Q2 readiness confirmed: ${state.health.q2ReadinessConfirmed}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkforceFactoryCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-13",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationReports: state.health.totalCertificationReports,
      latestCertificationId: this.getLatestCertificationReport()?.certificationId ?? null,
      q1ProductionReady: state.health.q1ProductionReady,
      q2ReadinessConfirmed: state.health.q2ReadinessConfirmed,
      neverExecuteWorkerTasks: true,
      neverModifyWorkforceComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ2Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkforceFactoryCertification(
  bootstrap: EmpireBootstrapContext,
  options?: WorkforceFactoryCertificationOptions,
) {
  return new WorkforceFactoryCertification(bootstrap, options);
}

export function resetWorkforceFactoryCertificationForTesting() {
  resetWfcLogsForTesting();
  resetCertificationSequenceForTesting();
}
