import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEmpireBuilderCertificationConfiguration,
  type EmpireBuilderCertificationConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { EMPIRE_BUILDER_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { EmpireBuilderCertificationController } from "./empire-builder-certification-controller.js";
import { EmpireBuilderCertificationCore } from "./empire-builder-certification-core.js";
import { resetEbcLogsForTesting } from "./ebc-logging.js";
import type {
  EmpireBuilderCertificationCockpitSnapshot,
  EmpireBuilderCertificationInput,
  EmpireBuilderCertificationState,
} from "./types.js";

export interface EmpireBuilderCertificationOptions {
  configuration?: Partial<EmpireBuilderCertificationConfiguration>;
}

/** Authoritative Q2-10 Empire Builder Certification — final Q2 acceptance gate. */
export class EmpireBuilderCertification {
  private initializedAt: string | null = null;
  private readonly controller: EmpireBuilderCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EmpireBuilderCertificationOptions = {},
  ) {
    this.controller = new EmpireBuilderCertificationController(
      new EmpireBuilderCertificationCore(),
      buildEmpireBuilderCertificationConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EMPIRE_BUILDER_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Empire Builder Certification")) {
      throw new Error(
        `${EMPIRE_BUILDER_CERTIFICATION_SYSTEM_PATH} missing — Q2-10 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpireBuilderCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Empire Builder Certification not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EBC-001",
      missionId: "Q2-10",
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
        q2ProductionReady: engineRecord?.q2ProductionReady ?? false,
        q3ReadinessConfirmed: engineRecord?.q3ReadinessConfirmed ?? false,
        notes: [
          "Acceptance gate only: does not execute business implementation, modify factory components, repair failures, begin Q3, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectEmpireBuilderCertification(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  certifyFactory(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.certifyFactory(input);
  }

  verifyComponent(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.verifyComponent(input);
  }

  verifyIntegration(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.verifyIntegration(input);
  }

  verifyGovernance(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.verifyGovernance(input);
  }

  verifyTraceability(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.verifyTraceability(input);
  }

  assessReadiness(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.assessReadiness(input);
  }

  produceReport(input: EmpireBuilderCertificationInput = {}) {
    return this.controller.produceReport(input);
  }

  listCertificationReports() {
    return this.controller.list();
  }

  validateEmpireBuilderCertification(input: EmpireBuilderCertificationInput = {}) {
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
        `Empire Builder reports: ${state.health.totalCertificationReports}`,
        `Q2 production ready: ${state.health.q2ProductionReady}`,
        `Q3 readiness confirmed: ${state.health.q3ReadinessConfirmed}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EmpireBuilderCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-10",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationReports: state.health.totalCertificationReports,
      latestCertificationId: this.getLatestCertificationReport()?.certificationId ?? null,
      q2ProductionReady: state.health.q2ProductionReady,
      q3ReadinessConfirmed: state.health.q3ReadinessConfirmed,
      neverExecuteBusinessImplementation: true,
      neverModifyFactoryComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ3Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createEmpireBuilderCertification(
  bootstrap: EmpireBootstrapContext,
  options?: EmpireBuilderCertificationOptions,
) {
  return new EmpireBuilderCertification(bootstrap, options);
}

export function resetEmpireBuilderCertificationForTesting() {
  resetEbcLogsForTesting();
  resetCertificationSequenceForTesting();
}
