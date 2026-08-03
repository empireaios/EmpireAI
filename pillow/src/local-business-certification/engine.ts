import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLocalBusinessCertificationConfiguration,
  type LocalBusinessCertificationConfiguration,
} from "./configuration.js";
import type { LocalBusinessCertificationDependencies } from "./integrations.js";
import { LocalBusinessCertificationManager } from "./certification-manager.js";
import { LocalBusinessCertificationController } from "./local-business-certification-controller.js";
import { resetLbcLogsForTesting } from "./lbc-logging.js";
import { COMPONENT_STATUSES, LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { resetLbcSequenceForTesting } from "./certification-store.js";
import type {
  LbcInput,
  LocalBusinessCertificationCockpitSnapshot,
  LocalBusinessCertificationState,
} from "./types.js";

export interface LocalBusinessCertificationOptions {
  configuration?: Partial<LocalBusinessCertificationConfiguration>;
  dependencies?: LocalBusinessCertificationDependencies;
}

/**
 * Authoritative Q7-11 Local Business Certification — the final Q7 acceptance
 * gate for the Local Business Factory (Q7-01..Q7-10).
 *
 * Certification is evidence-based from repository state + optional runtime
 * probes only. It NEVER fabricates verification results, NEVER certifies
 * unsupported functionality, NEVER implements missing functionality, NEVER
 * auto-corrects failed implementations, and NEVER overrides governance,
 * approved architecture, Pillow, or Grand King. It NEVER implements Q8-01 or
 * later — this module ends the Q7 series.
 */
export class LocalBusinessCertification {
  private initializedAt: string | null = null;
  private readonly manager: LocalBusinessCertificationManager;
  private readonly controller: LocalBusinessCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LocalBusinessCertificationOptions = {},
  ) {
    this.manager = new LocalBusinessCertificationManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new LocalBusinessCertificationController(
      this.manager,
      buildLocalBusinessCertificationConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Local Business Certification")) {
      throw new Error(
        `${LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH} missing — Q7-11 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LocalBusinessCertificationDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): LocalBusinessCertificationState {
    if (!this.initializedAt) {
      throw new Error("Local Business Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LBC-001",
      missionId: "Q7-11",
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
          "Local Business Certification is the final Q7 acceptance gate: it certifies Q7-01..Q7-10 from observed repository and runtime evidence only, never fabricates results, never implements missing functionality, and never overrides Pillow, Grand King, or approved architecture. It never implements Q8-01 or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  auditQ7Workers(input: LbcInput = {}) {
    return this.controller.auditQ7Workers(input);
  }

  verifyMissions(input: LbcInput = {}) {
    return this.controller.verifyMissions(input);
  }

  verifyDeliverables(input: LbcInput = {}) {
    return this.controller.verifyDeliverables(input);
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  verifyWorkflowCompleteness(input: LbcInput = {}) {
    return this.controller.verifyWorkflowCompleteness(input);
  }

  verifyProductionReadiness(input: LbcInput = {}) {
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

  produceCertificationFindings(input: LbcInput = {}) {
    return this.controller.produceCertificationFindings(input);
  }

  produceLocalBusinessCertificationReport(input: LbcInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: LbcInput = {}) {
    return this.controller.produceReport(input);
  }

  certifyLocalBusiness(input: LbcInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: LbcInput = {}) {
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

  validate(input: LbcInput = {}) {
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

  getCockpitSnapshot(): LocalBusinessCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-11",
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
      neverImplementQ801OrLater: true,
      finalQ7Gate: true,
    };
  }
}

export function createLocalBusinessCertification(
  bootstrap: EmpireBootstrapContext,
  options?: LocalBusinessCertificationOptions,
) {
  return new LocalBusinessCertification(bootstrap, options);
}

export function resetLocalBusinessCertificationForTesting() {
  resetLbcLogsForTesting();
  resetLbcSequenceForTesting();
}
