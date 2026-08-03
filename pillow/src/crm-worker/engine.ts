import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCrmWorkerConfiguration,
  type CrmWorkerConfiguration,
} from "./configuration.js";
import type { CrmWorkerDependencies } from "./integrations.js";
import { resetCrmSequenceForTesting } from "./crm-builder.js";
import { CrmManager } from "./crm-manager.js";
import { CRM_WORKER_SYSTEM_PATH } from "./paths.js";
import { CrmWorkerController } from "./crm-worker-controller.js";
import { resetCrmwLogsForTesting } from "./crmw-logging.js";
import type {
  CrmInput,
  CrmWorkerCockpitSnapshot,
  CrmWorkerState,
  Q706ConsumableContract,
} from "./types.js";

export interface CrmWorkerOptions {
  configuration?: Partial<CrmWorkerConfiguration>;
  dependencies?: CrmWorkerDependencies;
}

/** Authoritative Q7-05 CRM Worker — structural CRM signals only. */
export class CrmWorker {
  private initializedAt: string | null = null;
  private readonly controller: CrmWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CrmWorkerOptions = {},
  ) {
    const manager = new CrmManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CrmWorkerController(
      manager,
      buildCrmWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CRM_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("CRM Worker")) {
      throw new Error(
        `${CRM_WORKER_SYSTEM_PATH} missing — Q7-05 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CrmWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CrmWorkerState {
    if (!this.initializedAt) {
      throw new Error("CRM Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CRMW-001",
      missionId: "Q7-05",
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
        totalCustomers: engineRecord?.totalCustomers ?? 0,
        totalLeads: engineRecord?.totalLeads ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastCustomerId: engineRecord?.lastCustomerId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "CRM Worker produces structural customer, lead, contact, and booking-history signals only: does not execute marketing campaigns, deliver customer jobs, replace booking functionality, fabricate customer interactions, override approved architecture, override Pillow or Grand King, or implement Q7-06 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createCustomerProfile(input: CrmInput = {}) {
    return this.controller.createCustomerProfile(input);
  }

  updateCustomerProfile(input: CrmInput = {}) {
    return this.controller.updateCustomerProfile(input);
  }

  captureLead(input: CrmInput = {}) {
    return this.controller.captureLead(input);
  }

  updateLeadStatus(input: CrmInput = {}) {
    return this.controller.updateLeadStatus(input);
  }

  recordContact(input: CrmInput = {}) {
    return this.controller.recordContact(input);
  }

  recordInteraction(input: CrmInput = {}) {
    return this.controller.recordInteraction(input);
  }

  linkBookingHistory(input: CrmInput = {}) {
    return this.controller.linkBookingHistory(input);
  }

  scheduleFollowUp(input: CrmInput = {}) {
    return this.controller.scheduleFollowUp(input);
  }

  completeFollowUp(input: CrmInput = {}) {
    return this.controller.completeFollowUp(input);
  }

  trackOpportunity(input: CrmInput = {}) {
    return this.controller.trackOpportunity(input);
  }

  updateLifecycleStage(input: CrmInput = {}) {
    return this.controller.updateLifecycleStage(input);
  }

  generateCrmAnalytics(input: CrmInput = {}) {
    return this.controller.generateCrmAnalytics(input);
  }

  produceCrmReport(input: CrmInput = {}) {
    return this.controller.produceCrmReport(input);
  }

  produceReport(input: CrmInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: CrmInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getCustomers() {
    return this.controller.getManager().getCustomers();
  }

  getLeads() {
    return this.controller.getManager().getLeads();
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

  validate(input: CrmInput = {}) {
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

  getLatestCustomerId() {
    return this.controller.getManager().getLatestCustomerId();
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
        `CRM reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CrmWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-05",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalCustomers: state.health.totalCustomers,
      totalLeads: state.health.totalLeads,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverExecuteMarketingCampaigns: true,
      neverDeliverCustomerJobs: true,
      neverReplaceBookingFunctionality: true,
      neverFabricateCustomerInteractions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ706OrLater: true,
      consumableByQ706: true,
    };
  }

  getQ706ConsumableContract(): Q706ConsumableContract {
    return {
      contractVersion: "CRMW-Q706-v1",
      consumableByQ706: true,
      fields: [
        "reportId",
        "businessProjectId",
        "customerId",
        "leadStatus",
        "contactHistory",
        "bookingHistory",
        "followUpSchedule",
        "customerLifecycleStage",
        "outstandingTasks",
        "opportunities",
        "tags",
        "segments",
        "referralSource",
        "repeatCustomer",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        CrmReport: "CrmReport",
        CustomerProfile: "CustomerProfile",
        LeadRecord: "LeadRecord",
        ContactHistoryEntry: "ContactHistoryEntry",
        BookingHistoryLink: "BookingHistoryLink",
        FollowUp: "FollowUp",
        CrmAnalytics: "CrmAnalytics",
      },
      notes: [
        "Q7-06 may consume structural CRM records and reports only.",
        "CRMW never executes marketing campaigns, delivers jobs, replaces booking, or fabricates interactions.",
      ],
      neverExecuteMarketingCampaigns: true,
      neverDeliverCustomerJobs: true,
      neverReplaceBookingFunctionality: true,
      neverFabricateCustomerInteractions: true,
    };
  }
}

export function createCrmWorker(
  bootstrap: EmpireBootstrapContext,
  options?: CrmWorkerOptions,
) {
  return new CrmWorker(bootstrap, options);
}

export function resetCrmWorkerForTesting() {
  resetCrmwLogsForTesting();
  resetCrmSequenceForTesting();
}
