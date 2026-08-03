import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildUnifiedWorkforceCertificationConfiguration,
  type UnifiedWorkforceCertificationConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { UNIFIED_WORKFORCE_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { UnifiedWorkforceCertificationController } from "./unified-workforce-certification-controller.js";
import { UnifiedWorkforceCertificationCore } from "./unified-workforce-certification-core.js";
import { resetUwcLogsForTesting } from "./uwc-logging.js";
import type {
  UnifiedWorkforceCertificationCockpitSnapshot,
  UnifiedWorkforceCertificationInput,
  UnifiedWorkforceCertificationState,
} from "./types.js";

export interface UnifiedWorkforceCertificationOptions {
  configuration?: Partial<UnifiedWorkforceCertificationConfiguration>;
}

/** Authoritative Q0-30 Unified Workforce Certification — final Q0 acceptance gate. */
export class UnifiedWorkforceCertification {
  private initializedAt: string | null = null;
  private readonly controller: UnifiedWorkforceCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: UnifiedWorkforceCertificationOptions = {},
  ) {
    this.controller = new UnifiedWorkforceCertificationController(
      new UnifiedWorkforceCertificationCore(),
      buildUnifiedWorkforceCertificationConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      UNIFIED_WORKFORCE_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Unified Workforce Certification")) {
      throw new Error(
        `${UNIFIED_WORKFORCE_CERTIFICATION_SYSTEM_PATH} missing — Q0-30 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): UnifiedWorkforceCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Unified Workforce Certification not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-UWC-001",
      missionId: "Q0-30",
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
        q0ProductionReady: engineRecord?.q0ProductionReady ?? false,
        notes: [
          "Acceptance gate only: does not execute worker tasks, modify executive components, repair failures, begin Q1, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectUnifiedWorkforceCertification(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  certifyFactory(input: UnifiedWorkforceCertificationInput = {}) {
    return this.controller.certifyFactory(input);
  }

  verifyComponent(input: UnifiedWorkforceCertificationInput = {}) {
    return this.controller.verifyComponent(input);
  }

  verifyIntegration(input: UnifiedWorkforceCertificationInput = {}) {
    return this.controller.verifyIntegration(input);
  }

  assessReadiness(input: UnifiedWorkforceCertificationInput = {}) {
    return this.controller.assessReadiness(input);
  }

  produceReport(input: UnifiedWorkforceCertificationInput = {}) {
    return this.controller.produceReport(input);
  }

  listCertificationReports() {
    return this.controller.list();
  }

  validateUnifiedWorkforceCertification(input: UnifiedWorkforceCertificationInput = {}) {
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
        `Unified reports: ${state.health.totalCertificationReports}`,
        `Q0 production ready: ${state.health.q0ProductionReady}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): UnifiedWorkforceCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-30",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationReports: state.health.totalCertificationReports,
      latestCertificationId: this.getLatestCertificationReport()?.certificationId ?? null,
      q0ProductionReady: state.health.q0ProductionReady,
      neverExecuteWorkerTasks: true,
      neverModifyExecutiveComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ1Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createUnifiedWorkforceCertification(
  bootstrap: EmpireBootstrapContext,
  options?: UnifiedWorkforceCertificationOptions,
) {
  return new UnifiedWorkforceCertification(bootstrap, options);
}

export function resetUnifiedWorkforceCertificationForTesting() {
  resetUwcLogsForTesting();
  resetCertificationSequenceForTesting();
}
