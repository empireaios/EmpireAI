import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLocalBusinessLaunchPackConfiguration,
  type LocalBusinessLaunchPackConfiguration,
} from "./configuration.js";
import type { LocalBusinessLaunchPackDependencies } from "./integrations.js";
import { LaunchPackageManager } from "./launch-pack-manager.js";
import { LocalBusinessLaunchPackController } from "./local-business-launch-pack-controller.js";
import { resetLblpLogsForTesting } from "./lblp-logging.js";
import { LOCAL_BUSINESS_LAUNCH_PACK_SYSTEM_PATH } from "./paths.js";
import { resetLblpSequenceForTesting } from "./package-builder.js";
import type {
  LblpInput,
  LocalBusinessLaunchPackCockpitSnapshot,
  LocalBusinessLaunchPackState,
  Q711ConsumableContract,
} from "./types.js";

export interface LocalBusinessLaunchPackOptions {
  configuration?: Partial<LocalBusinessLaunchPackConfiguration>;
  dependencies?: LocalBusinessLaunchPackDependencies;
}

/**
 * Authoritative Q7-10 Local Business Launch Pack.
 *
 * Assembles and verifies local business launch readiness from Q7-01..Q7-09
 * factory outputs. It NEVER launches or deploys the business, NEVER replaces
 * certification, and NEVER overrides Pillow, Grand King, or approved
 * architecture. Readiness is always derived from collected evidence — empty
 * or missing artefacts always yield not_ready / outstanding issues, never a
 * fabricated pass.
 */
export class LocalBusinessLaunchPack {
  private initializedAt: string | null = null;
  private readonly controller: LocalBusinessLaunchPackController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LocalBusinessLaunchPackOptions = {},
  ) {
    const manager = new LaunchPackageManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new LocalBusinessLaunchPackController(
      manager,
      buildLocalBusinessLaunchPackConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LOCAL_BUSINESS_LAUNCH_PACK_SYSTEM_PATH,
    );
    if (!doc?.includes("Local Business Launch Pack")) {
      throw new Error(
        `${LOCAL_BUSINESS_LAUNCH_PACK_SYSTEM_PATH} missing — Q7-10 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LocalBusinessLaunchPackDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): LocalBusinessLaunchPackState {
    if (!this.initializedAt) {
      throw new Error("Local Business Launch Pack not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LBLP-001",
      missionId: "Q7-10",
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
        totalPackages: engineRecord?.totalPackages ?? 0,
        totalReports: engineRecord?.totalReports ?? 0,
        lastPackageId: engineRecord?.lastPackageId ?? null,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Local Business Launch Pack assembles and verifies Q7-01..Q7-09 launch readiness evidence only: it never launches or deploys the business, never replaces certification, never fabricates readiness without evidence, and never overrides Pillow, Grand King, or approved architecture.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  collectFactoryOutputs(input: LblpInput = {}) {
    return this.controller.collectFactoryOutputs(input);
  }

  verifyDeliverables(input: LblpInput = {}) {
    return this.controller.verifyDeliverables(input);
  }

  generateExecutiveLaunchPackage(input: LblpInput = {}) {
    return this.controller.generateExecutiveLaunchPackage(input);
  }

  summarizeBusinessOpportunity(input: LblpInput = {}) {
    return this.controller.summarizeBusinessOpportunity(input);
  }

  summarizeServicesAndPricing(input: LblpInput = {}) {
    return this.controller.summarizeServicesAndPricing(input);
  }

  summarizeBookingCrmCommunicationReadiness(input: LblpInput = {}) {
    return this.controller.summarizeBookingCrmCommunicationReadiness(input);
  }

  summarizeSeoAndLeadGenerationReadiness(input: LblpInput = {}) {
    return this.controller.summarizeSeoAndLeadGenerationReadiness(input);
  }

  summarizeOperationalReadiness(input: LblpInput = {}) {
    return this.controller.summarizeOperationalReadiness(input);
  }

  identifyRisksAndOutstandingIssues(input: LblpInput = {}) {
    return this.controller.identifyRisksAndOutstandingIssues(input);
  }

  produceLocalBusinessLaunchReport(input: LblpInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: LblpInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: LblpInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getPackages() {
    return this.controller.getManager().getPackages();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  validate(input: LblpInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
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
        `Launch reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LocalBusinessLaunchPackCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-10",
      status: state.status,
      healthStatus: state.health.status,
      totalPackages: state.health.totalPackages,
      totalReports: state.health.totalReports,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverLaunchBusinessAutomatically: true,
      neverOverrideGovernance: true,
      neverReplaceCertification: true,
      neverClaimReadinessWithoutEvidence: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ711OrLater: true,
      consumableByQ711: true,
    };
  }

  getQ711ConsumableContract(): Q711ConsumableContract {
    return {
      contractVersion: "LBLP-Q711-v1",
      consumableByQ711: true,
      fields: [
        "reportId",
        "businessProjectId",
        "businessName",
        "businessType",
        "executiveSummary",
        "deliverableVerification",
        "readinessStatus",
        "riskSummary",
        "outstandingIssues",
        "approvalRecommendation",
        "auditStatus",
        "confidenceScore",
        "packageId",
        "launchPackage",
        "readinessAssessment",
        "traceabilityRefs",
      ] as const,
      types: {
        LocalBusinessLaunchReport: "LocalBusinessLaunchReport",
        LaunchPackage: "LaunchPackage",
        LaunchPackageSections: "LaunchPackageSections",
        DeliverableVerification: "DeliverableVerification",
        ReadinessAssessment: "ReadinessAssessment",
      },
      notes: [
        "Q7-11 may consume assembled launch packages and launch reports only.",
        "Readiness is always derived from collected Q7-01..Q7-09 evidence — never fabricated.",
        "Local Business Launch Pack never launches or deploys the business, never replaces certification, and never overrides Pillow/Grand King.",
      ],
      neverLaunchBusinessAutomatically: true,
      neverOverrideGovernance: true,
      neverReplaceCertification: true,
      neverClaimReadinessWithoutEvidence: true,
    };
  }
}

export function createLocalBusinessLaunchPack(
  bootstrap: EmpireBootstrapContext,
  options?: LocalBusinessLaunchPackOptions,
) {
  return new LocalBusinessLaunchPack(bootstrap, options);
}

export function resetLocalBusinessLaunchPackForTesting() {
  resetLblpLogsForTesting();
  resetLblpSequenceForTesting();
}
