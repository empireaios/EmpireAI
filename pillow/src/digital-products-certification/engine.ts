import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDigitalProductsCertificationConfiguration,
  type DigitalProductsCertificationConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { DIGITAL_PRODUCTS_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { DigitalProductsCertificationController } from "./digital-products-certification-controller.js";
import { DigitalProductsCertificationCore } from "./digital-products-certification-core.js";
import { resetDpcLogsForTesting } from "./dpc-logging.js";
import type { DigitalProductsCertificationDependencies } from "./integrations.js";
import type {
  DigitalProductsCertificationCockpitSnapshot,
  DigitalProductsCertificationInput,
  DigitalProductsCertificationState,
} from "./types.js";

export interface DigitalProductsCertificationOptions {
  configuration?: Partial<DigitalProductsCertificationConfiguration>;
  dependencies?: DigitalProductsCertificationDependencies;
}

/** Authoritative Q5-12 Digital Products Certification — final Q5 acceptance gate. */
export class DigitalProductsCertification {
  private initializedAt: string | null = null;
  private readonly controller: DigitalProductsCertificationController;
  private readonly core: DigitalProductsCertificationCore;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DigitalProductsCertificationOptions = {},
  ) {
    this.core = new DigitalProductsCertificationCore();
    this.core.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) {
      this.core.bindIntegrations(options.dependencies);
    }
    this.controller = new DigitalProductsCertificationController(
      this.core,
      buildDigitalProductsCertificationConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DIGITAL_PRODUCTS_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Digital Products Certification")) {
      throw new Error(
        `${DIGITAL_PRODUCTS_CERTIFICATION_SYSTEM_PATH} missing — Q5-12 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): DigitalProductsCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Digital Products Certification not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DPC-001",
      missionId: "Q5-12",
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
        lastCertificationStatus: engineRecord?.lastCertificationStatus ?? null,
        q5ProductionReady: engineRecord?.q5ProductionReady ?? false,
        q6ReadinessConfirmed: false,
        notes: [
          "Acceptance gate only: does not auto-fix failures, auto-certify incomplete work, override Pillow/Grand King, or begin Q6.",
        ],
      },
    };
  }

  bindIntegrations(deps: DigitalProductsCertificationDependencies) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  connectDigitalProductsCertification(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  connect(input: Record<string, unknown> = {}) {
    return this.connectDigitalProductsCertification(input);
  }

  certifyFactory(input: DigitalProductsCertificationInput = {}) {
    return this.controller.certifyFactory(input);
  }

  verifyWorkerRegistration(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyWorkerRegistration(input);
  }

  verifyWorkerInvocation(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyWorkerInvocation(input);
  }

  verifyWorkerDependencies(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyWorkerDependencies(input);
  }

  verifyEndToEndWorkflow(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyEndToEndWorkflow(input);
  }

  verifyReportGeneration(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyReportGeneration(input);
  }

  verifyExecutiveReportingIntegration(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyExecutiveReportingIntegration(input);
  }

  verifyGovernanceCompliance(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyGovernanceCompliance(input);
  }

  verifyFailureHandlingAndRecovery(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyFailureHandlingAndRecovery(input);
  }

  verifyAuditTrailCompleteness(input: DigitalProductsCertificationInput = {}) {
    return this.controller.verifyAuditTrailCompleteness(input);
  }

  assessReadiness(input: DigitalProductsCertificationInput = {}) {
    return this.controller.assessReadiness(input);
  }

  produceReport(input: DigitalProductsCertificationInput = {}) {
    return this.controller.produceReport(input);
  }

  produceDigitalProductsCertificationReport(input: DigitalProductsCertificationInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: DigitalProductsCertificationInput = {}) {
    return this.controller.submitReport(input);
  }

  listReports() {
    return this.controller.list();
  }

  listCertificationReports() {
    return this.listReports();
  }

  validateDigitalProductsCertification(input: DigitalProductsCertificationInput = {}) {
    return this.controller.validate(input);
  }

  validate(input: DigitalProductsCertificationInput = {}) {
    return this.validateDigitalProductsCertification(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  diagnostics() {
    return this.runDiagnostics();
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
        `Digital Products Certification reports: ${state.health.totalCertificationReports}`,
        `Q5 production ready: ${state.health.q5ProductionReady}`,
        `Q6 readiness confirmed: false`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DigitalProductsCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-12",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationReports: state.health.totalCertificationReports,
      latestCertificationId: this.getLatestCertificationId(),
      q5ProductionReady: state.health.q5ProductionReady,
      q6ReadinessConfirmed: false,
      neverAutomaticallyFixFailures: true,
      neverAutomaticallyCertifyIncompleteWork: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBeginQ6Implementation: true,
      neverAssumeImplementation: true,
    };
  }
}

export function createDigitalProductsCertification(
  bootstrap: EmpireBootstrapContext,
  options?: DigitalProductsCertificationOptions,
) {
  return new DigitalProductsCertification(bootstrap, options);
}

export function resetDigitalProductsCertificationForTesting() {
  resetDpcLogsForTesting();
  resetCertificationSequenceForTesting();
}
