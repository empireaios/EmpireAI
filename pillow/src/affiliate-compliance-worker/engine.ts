import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { AffiliateComplianceWorkerController } from "./affiliate-compliance-worker-controller.js";
import {
  buildAffiliateComplianceWorkerConfiguration,
  type AffiliateComplianceWorkerConfiguration,
} from "./configuration.js";
import type { AffiliateComplianceWorkerDependencies } from "./integrations.js";
import { resetAcwLogsForTesting } from "./acw-logging.js";
import { ComplianceManager } from "./compliance-manager.js";
import { resetAcwSequenceForTesting } from "./compliance-store.js";
import { AFFILIATE_COMPLIANCE_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  AcwInput,
  AffiliateComplianceWorkerCockpitSnapshot,
  AffiliateComplianceWorkerState,
  Q809ConsumableContract,
} from "./types.js";

export interface AffiliateComplianceWorkerOptions {
  configuration?: Partial<AffiliateComplianceWorkerConfiguration>;
  dependencies?: AffiliateComplianceWorkerDependencies;
}

/** Authoritative Q8-08 Affiliate Compliance Worker — evidence-based compliance validation only. */
export class AffiliateComplianceWorker {
  private initializedAt: string | null = null;
  private readonly controller: AffiliateComplianceWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AffiliateComplianceWorkerOptions = {},
  ) {
    const manager = new ComplianceManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new AffiliateComplianceWorkerController(
      manager,
      buildAffiliateComplianceWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      AFFILIATE_COMPLIANCE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Affiliate Compliance Worker")) {
      throw new Error(
        `${AFFILIATE_COMPLIANCE_WORKER_SYSTEM_PATH} missing — Q8-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AffiliateComplianceWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): AffiliateComplianceWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Affiliate Compliance Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ACW-001",
      missionId: "Q8-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord.healthStatus ?? "standby",
        healthScore: engineRecord.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord.totalReports,
        totalHistoryEntries: engineRecord.totalHistoryEntries,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "Affiliate Compliance Worker validates disclosures/platform rules/disclaimers from evidenced checks only: does not publish content, provide legal advice, replace legal professionals, auto-approve assets, override Pillow or Grand King, or implement Q8-09 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAffiliateOpportunityReport(input: AcwInput = {}) {
    return this.controller.consumeAffiliateOpportunityReport(input);
  }

  consumeReviewContentReport(input: AcwInput = {}) {
    return this.controller.consumeReviewContentReport(input);
  }

  consumeSeoContentReport(input: AcwInput = {}) {
    return this.controller.consumeSeoContentReport(input);
  }

  validateAffiliateDisclosures(input: AcwInput = {}) {
    return this.controller.validateAffiliateDisclosures(input);
  }

  validatePlatformPolicyCompliance(input: AcwInput = {}) {
    return this.controller.validatePlatformPolicyCompliance(input);
  }

  validateRequiredDisclaimers(input: AcwInput = {}) {
    return this.controller.validateRequiredDisclaimers(input);
  }

  detectComplianceViolations(input: AcwInput = {}) {
    return this.controller.detectComplianceViolations(input);
  }

  recommendCorrectiveActions(input: AcwInput = {}) {
    return this.controller.recommendCorrectiveActions(input);
  }

  assessApprovalReadiness(input: AcwInput = {}) {
    return this.controller.assessApprovalReadiness(input);
  }

  produceAffiliateComplianceReport(input: AcwInput = {}) {
    return this.controller.produceAffiliateComplianceReport(input);
  }

  produceReport(input: AcwInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: AcwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getStore().listReports();
  }

  getHistory() {
    return this.controller.getManager().getStore().getHistory();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getStore().getAuditTrail();
  }

  validate(input: AcwInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
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
        `Compliance reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AffiliateComplianceWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-08",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalHistoryEntries: state.health.totalHistoryEntries,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateComplianceResults: true,
      neverProvideUnverifiedLegalConclusions: true,
      neverPublishAffiliateContent: true,
      neverReplaceLegalProfessionals: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ809OrLater: true,
      consumableByQ809: true,
    };
  }

  getQ809ConsumableContract(): Q809ConsumableContract {
    return this.controller.getManager().getQ809ConsumableContract();
  }
}

export function createAffiliateComplianceWorker(
  bootstrap: EmpireBootstrapContext,
  options?: AffiliateComplianceWorkerOptions,
) {
  return new AffiliateComplianceWorker(bootstrap, options);
}

export function resetAffiliateComplianceWorkerForTesting() {
  resetAcwLogsForTesting();
  resetAcwSequenceForTesting();
}
