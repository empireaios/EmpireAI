import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceCertificationMonitorConfiguration,
  type WorkforceCertificationMonitorConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { WORKFORCE_CERTIFICATION_MONITOR_SYSTEM_PATH } from "./paths.js";
import { WorkforceCertificationMonitorController } from "./workforce-certification-monitor-controller.js";
import { WorkforceCertificationMonitorCore } from "./workforce-certification-monitor-core.js";
import { resetWcmLogsForTesting } from "./wcm-logging.js";
import type {
  WorkforceCertificationMonitorCockpitSnapshot,
  WorkforceCertificationMonitorInput,
  WorkforceCertificationMonitorState,
} from "./types.js";

export interface WorkforceCertificationMonitorOptions {
  configuration?: Partial<WorkforceCertificationMonitorConfiguration>;
}

/** Authoritative Q0-29 Workforce Certification Monitor — certify readiness only. */
export class WorkforceCertificationMonitor {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceCertificationMonitorController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkforceCertificationMonitorOptions = {},
  ) {
    this.controller = new WorkforceCertificationMonitorController(
      new WorkforceCertificationMonitorCore(),
      buildWorkforceCertificationMonitorConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKFORCE_CERTIFICATION_MONITOR_SYSTEM_PATH,
    );
    if (!doc?.includes("Workforce Certification Monitor")) {
      throw new Error(
        `${WORKFORCE_CERTIFICATION_MONITOR_SYSTEM_PATH} missing — Q0-29 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkforceCertificationMonitorState {
    if (!this.initializedAt) {
      throw new Error(
        "Workforce Certification Monitor not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WCM-001",
      missionId: "Q0-29",
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
        totalCertificationRecords: this.getRecords().length,
        certifiedCount: engineRecord?.certifiedCount ?? 0,
        decertifiedCount: engineRecord?.decertifiedCount ?? 0,
        failureCount: engineRecord?.failureCount ?? 0,
        lastMonitorCycleAt: engineRecord?.lastMonitorCycleAt ?? null,
        lastStatus: engineRecord?.lastStatus ?? null,
        notes: [
          "Certify only: does not execute worker tasks, repair workers automatically, replace Worker Quality Standard, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkforceCertificationMonitor(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  certifyWorker(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.certifyWorker(input);
  }

  monitorWorkforce(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.monitorWorkforce(input);
  }

  verifyAvailability(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifyAvailability(input);
  }

  verifyReachability(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifyReachability(input);
  }

  verifyCapabilities(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifyCapabilities(input);
  }

  verifyToolAccess(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifyToolAccess(input);
  }

  verifyGovernance(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifyGovernance(input);
  }

  verifyQualityCompliance(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifyQualityCompliance(input);
  }

  verifySelfCritiqueCompliance(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.verifySelfCritiqueCompliance(input);
  }

  detectFailures(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.detectFailures(input);
  }

  decertifyWorker(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.decertifyWorker(input);
  }

  recertifyWorker(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.recertifyWorker(input);
  }

  listCertifications() {
    return this.controller.list();
  }

  validateWorkforceCertificationMonitor(input: WorkforceCertificationMonitorInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
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
        `Certification records: ${state.health.totalCertificationRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkforceCertificationMonitorCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-29",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationRecords: state.health.totalCertificationRecords,
      latestCertificationId: this.getLatestRecord()?.certificationId ?? null,
      certifiedCount: state.health.certifiedCount,
      neverExecuteWorkerTasks: true,
      neverRepairWorkersAutomatically: true,
      neverReplaceWorkerQualityStandard: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkforceCertificationMonitor(
  bootstrap: EmpireBootstrapContext,
  options?: WorkforceCertificationMonitorOptions,
) {
  return new WorkforceCertificationMonitor(bootstrap, options);
}

export function resetWorkforceCertificationMonitorForTesting() {
  resetWcmLogsForTesting();
  resetCertificationSequenceForTesting();
}
