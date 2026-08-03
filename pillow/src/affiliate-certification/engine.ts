import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAffiliateCertificationConfiguration,
  type AffiliateCertificationConfiguration,
} from "./configuration.js";
import type { AffiliateCertificationDependencies } from "./integrations.js";
import { AffiliateCertificationManager } from "./certification-manager.js";
import { AffiliateCertificationController } from "./affiliate-certification-controller.js";
import { resetAfcrtLogsForTesting } from "./afcrt-logging.js";
import { COMPONENT_STATUSES, AFFILIATE_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { resetAfcrtSequenceForTesting } from "./certification-store.js";
import type {
  AfcrtInput,
  AffiliateCertificationCockpitSnapshot,
  AffiliateCertificationState,
} from "./types.js";

export interface AffiliateCertificationOptions {
  configuration?: Partial<AffiliateCertificationConfiguration>;
  dependencies?: AffiliateCertificationDependencies;
}

/**
 * Authoritative Q8-09 Affiliate Certification — the final Q8 acceptance
 * gate for the Affiliate Factory (Q8-01..Q8-08).
 *
 * Certification is evidence-based from repository state + optional runtime
 * probes only. It NEVER fabricates verification results, NEVER certifies
 * unsupported functionality, NEVER implements missing functionality, NEVER
 * auto-corrects failed implementations, and NEVER overrides governance,
 * approved architecture, Pillow, or Grand King. It NEVER implements Q8-01 or
 * later — this module ends the Q8 series.
 */
export class AffiliateCertification {
  private initializedAt: string | null = null;
  private readonly manager: AffiliateCertificationManager;
  private readonly controller: AffiliateCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AffiliateCertificationOptions = {},
  ) {
    this.manager = new AffiliateCertificationManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new AffiliateCertificationController(
      this.manager,
      buildAffiliateCertificationConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      AFFILIATE_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Affiliate Certification")) {
      throw new Error(
        `${AFFILIATE_CERTIFICATION_SYSTEM_PATH} missing — Q8-09 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AffiliateCertificationDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): AffiliateCertificationState {
    if (!this.initializedAt) {
      throw new Error("Affiliate Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-AFCRT-001",
      missionId: "Q8-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastCertificationDecision: engineRecord?.lastCertificationDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Affiliate Certification is the final Q8 acceptance gate: it certifies Q8-01..Q8-08 from observed repository and runtime evidence only, never fabricates results, never implements missing functionality, and never overrides Pillow, Grand King, or approved architecture. It never implements Q9-01 or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  auditQ8Workers(input: AfcrtInput = {}) {
    return this.controller.auditQ8Workers(input);
  }

  verifyMissions(input: AfcrtInput = {}) {
    return this.controller.verifyMissions(input);
  }

  verifyDeliverables(input: AfcrtInput = {}) {
    return this.controller.verifyDeliverables(input);
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  verifyWorkflowCompleteness(input: AfcrtInput = {}) {
    return this.controller.verifyWorkflowCompleteness(input);
  }

  verifyProductionReadiness(input: AfcrtInput = {}) {
    return this.controller.verifyProductionReadiness(input);
  }

  verifyGovernanceCompliance() {
    return this.controller.verifyGovernanceCompliance();
  }

  verifyReportingCapability() {
    return this.controller.verifyReportingCapability();
  }

  verifyOperationalReadiness() {
    return this.controller.verifyOperationalReadiness();
  }

  produceCertificationFindings(input: AfcrtInput = {}) {
    return this.controller.produceCertificationFindings(input);
  }

  produceAffiliateCertificationReport(input: AfcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: AfcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  certifyAffiliateFactory(input: AfcrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: AfcrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getComponentStatusMatrix() {
    return this.manager.getLatestReport()?.componentStatusMatrix ?? [];
  }

  validate(input: AfcrtInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getIntegrations() {
    return this.manager.getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Certification reports: ${state.health.totalReports}`,
        `Last certification decision: ${state.health.lastCertificationDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AffiliateCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-09",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCertificationDecision: state.health.lastCertificationDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      componentStatusOptions: [...COMPONENT_STATUSES],
      neverFabricateVerificationResults: true,
      neverCertifyUnsupportedFunctionality: true,
      neverImplementMissingFunctionality: true,
      neverAutoCorrectFailedImplementations: true,
      neverOverrideGovernance: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ901OrLater: true,
      finalQ8Gate: true,
    };
  }
}

export function createAffiliateCertification(
  bootstrap: EmpireBootstrapContext,
  options?: AffiliateCertificationOptions,
) {
  return new AffiliateCertification(bootstrap, options);
}

export function resetAffiliateCertificationForTesting() {
  resetAfcrtLogsForTesting();
  resetAfcrtSequenceForTesting();
}
