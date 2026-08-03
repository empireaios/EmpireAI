import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCommerceCertificationConfiguration,
  type CommerceCertificationConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { COMMERCE_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { CommerceCertificationController } from "./commerce-certification-controller.js";
import { CommerceCertificationCore } from "./commerce-certification-core.js";
import { resetCmcLogsForTesting } from "./cmc-logging.js";
import type {
  CommerceCertificationCockpitSnapshot,
  CommerceCertificationInput,
  CommerceCertificationState,
} from "./types.js";

export interface CommerceCertificationOptions {
  configuration?: Partial<CommerceCertificationConfiguration>;
}

/** Authoritative Q3-14 Commerce Certification — final Q3 acceptance gate. */
export class CommerceCertification {
  private initializedAt: string | null = null;
  private readonly controller: CommerceCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CommerceCertificationOptions = {},
  ) {
    this.controller = new CommerceCertificationController(
      new CommerceCertificationCore(),
      buildCommerceCertificationConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COMMERCE_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Commerce Certification")) {
      throw new Error(
        `${COMMERCE_CERTIFICATION_SYSTEM_PATH} missing — Q3-14 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CommerceCertificationState {
    if (!this.initializedAt) {
      throw new Error("Commerce Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CMC-001",
      missionId: "Q3-14",
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
        q3ProductionReady: engineRecord?.q3ProductionReady ?? false,
        q4ReadinessConfirmed: engineRecord?.q4ReadinessConfirmed ?? false,
        notes: [
          "Acceptance gate only: does not operate a live commerce business, modify Commerce Factory components, repair failures, begin Q4, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectCommerceCertification(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  certifyFactory(input: CommerceCertificationInput = {}) {
    return this.controller.certifyFactory(input);
  }

  verifyComponent(input: CommerceCertificationInput = {}) {
    return this.controller.verifyComponent(input);
  }

  verifyIntegration(input: CommerceCertificationInput = {}) {
    return this.controller.verifyIntegration(input);
  }

  verifyGovernance(input: CommerceCertificationInput = {}) {
    return this.controller.verifyGovernance(input);
  }

  verifyTraceability(input: CommerceCertificationInput = {}) {
    return this.controller.verifyTraceability(input);
  }

  assessReadiness(input: CommerceCertificationInput = {}) {
    return this.controller.assessReadiness(input);
  }

  produceReport(input: CommerceCertificationInput = {}) {
    return this.controller.produceReport(input);
  }

  listReports() {
    return this.controller.list();
  }

  listCertificationReports() {
    return this.listReports();
  }

  validateCommerceCertification(input: CommerceCertificationInput = {}) {
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

  getLatestCertificationId() {
    return this.getLatestCertificationReport()?.certificationId ?? null;
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAuditTrail(limit = 50) {
    return this.controller.getManager().getAuditTrail(limit);
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
        `Commerce Certification reports: ${state.health.totalCertificationReports}`,
        `Q3 production ready: ${state.health.q3ProductionReady}`,
        `Q4 readiness confirmed: ${state.health.q4ReadinessConfirmed}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CommerceCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-14",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationReports: state.health.totalCertificationReports,
      latestCertificationId: this.getLatestCertificationId(),
      q3ProductionReady: state.health.q3ProductionReady,
      q4ReadinessConfirmed: state.health.q4ReadinessConfirmed,
      neverOperateLiveCommerceBusiness: true,
      neverModifyCommerceFactoryComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ4Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createCommerceCertification(
  bootstrap: EmpireBootstrapContext,
  options?: CommerceCertificationOptions,
) {
  return new CommerceCertification(bootstrap, options);
}

export function resetCommerceCertificationForTesting() {
  resetCmcLogsForTesting();
  resetCertificationSequenceForTesting();
}
