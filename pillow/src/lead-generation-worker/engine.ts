import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLeadGenerationWorkerConfiguration,
  type LeadGenerationWorkerConfiguration,
} from "./configuration.js";
import { resetLgwSequenceForTesting } from "./funnel-builder.js";
import type { LeadGenerationWorkerDependencies } from "./integrations.js";
import { LeadGenerationWorkerController } from "./lead-generation-worker-controller.js";
import { LeadManager } from "./lead-manager.js";
import { resetLgwLogsForTesting } from "./lgw-logging.js";
import { LEAD_GENERATION_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  LeadGenInput,
  LeadGenerationWorkerCockpitSnapshot,
  LeadGenerationWorkerState,
  Q709ConsumableContract,
} from "./types.js";

export interface LeadGenerationWorkerOptions {
  configuration?: Partial<LeadGenerationWorkerConfiguration>;
  dependencies?: LeadGenerationWorkerDependencies;
}

/** Authoritative Q7-08 Lead Generation Worker — structural lead funnel signals only. */
export class LeadGenerationWorker {
  private initializedAt: string | null = null;
  private readonly controller: LeadGenerationWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LeadGenerationWorkerOptions = {},
  ) {
    const manager = new LeadManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new LeadGenerationWorkerController(
      manager,
      buildLeadGenerationWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LEAD_GENERATION_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Lead Generation Worker")) {
      throw new Error(
        `${LEAD_GENERATION_WORKER_SYSTEM_PATH} missing — Q7-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LeadGenerationWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): LeadGenerationWorkerState {
    if (!this.initializedAt) {
      throw new Error("Lead Generation Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LGW-001",
      missionId: "Q7-08",
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
        totalReports: engineRecord?.totalReports ?? 0,
        totalFunnels: engineRecord?.totalFunnels ?? 0,
        totalLeads: engineRecord?.totalLeads ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastFunnelId: engineRecord?.lastFunnelId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Lead Generation Worker prepares structural lead funnels and capture signals only: does not execute advertising campaigns, replace CRM or booking, deliver customer jobs, fabricate lead/conversion results, override approved architecture, override Pillow or Grand King, or implement Q7-09 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createLeadFunnel(input: LeadGenInput = {}) {
    return this.controller.createLeadFunnel(input);
  }

  generateEnquiryForm(input: LeadGenInput = {}) {
    return this.controller.generateEnquiryForm(input);
  }

  captureLead(input: LeadGenInput = {}) {
    return this.controller.captureLead(input);
  }

  qualifyLead(input: LeadGenInput = {}) {
    return this.controller.qualifyLead(input);
  }

  scoreLead(input: LeadGenInput = {}) {
    return this.controller.scoreLead(input);
  }

  routeLeadToCrm(input: LeadGenInput = {}) {
    return this.controller.routeLeadToCrm(input);
  }

  routeLeadToBooking(input: LeadGenInput = {}) {
    return this.controller.routeLeadToBooking(input);
  }

  trackConversionStage(input: LeadGenInput = {}) {
    return this.controller.trackConversionStage(input);
  }

  measureFunnelPerformance(input: LeadGenInput = {}) {
    return this.controller.measureFunnelPerformance(input);
  }

  produceLeadGenerationReport(input: LeadGenInput = {}) {
    return this.controller.produceLeadGenerationReport(input);
  }

  produceReport(input: LeadGenInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: LeadGenInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getFunnels() {
    return this.controller.getManager().getFunnels();
  }

  getLeads() {
    return this.controller.getManager().getLeads();
  }

  getForms() {
    return this.controller.getManager().getForms();
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

  validate(input: LeadGenInput = {}) {
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
        `Lead generation reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LeadGenerationWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-08",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalFunnels: state.health.totalFunnels,
      totalLeads: state.health.totalLeads,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverExecuteAdvertisingCampaigns: true,
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverDeliverCustomerJobs: true,
      neverFabricateLeadOrConversionResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ709OrLater: true,
      consumableByQ709: true,
    };
  }

  getQ709ConsumableContract(): Q709ConsumableContract {
    return {
      contractVersion: "LGW-Q709-v1",
      consumableByQ709: true,
      fields: [
        "reportId",
        "businessProjectId",
        "funnelId",
        "leadSource",
        "leadQualificationStatus",
        "leadScore",
        "crmIntegrationStatus",
        "bookingIntegrationStatus",
        "conversionStage",
        "funnelPerformanceSummary",
        "forms",
        "capturedLeads",
        "sourceAttribution",
        "sourceSeoReportId",
        "outstandingIssues",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        LeadGenerationReport: "LeadGenerationReport",
        LeadFunnel: "LeadFunnel",
        EnquiryForm: "EnquiryForm",
        CapturedLead: "CapturedLead",
        FunnelMetrics: "FunnelMetrics",
        LeadScore: "LeadScore",
        ConversionStageRecord: "ConversionStageRecord",
      },
      notes: [
        "Q7-09 may consume structural lead funnel and capture packages only.",
        "Funnel metrics reflect observed captures in store — never fabricated conversions or ad performance.",
        "LGW never executes advertising, replaces CRM/booking, or delivers customer jobs.",
      ],
      neverExecuteAdvertisingCampaigns: true,
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverDeliverCustomerJobs: true,
      neverFabricateLeadOrConversionResults: true,
    };
  }
}

export function createLeadGenerationWorker(
  bootstrap: EmpireBootstrapContext,
  options?: LeadGenerationWorkerOptions,
) {
  return new LeadGenerationWorker(bootstrap, options);
}

export function resetLeadGenerationWorkerForTesting() {
  resetLgwLogsForTesting();
  resetLgwSequenceForTesting();
}
