import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { EmailFunnelWorkerController } from "./email-funnel-worker-controller.js";
import {
  buildEmailFunnelWorkerConfiguration,
  type EmailFunnelWorkerConfiguration,
} from "./configuration.js";
import type { EmailFunnelWorkerDependencies } from "./integrations.js";
import { resetEfwLogsForTesting } from "./efw-logging.js";
import { FunnelManager } from "./funnel-manager.js";
import { resetEfwSequenceForTesting } from "./funnel-store.js";
import { EMAIL_FUNNEL_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  EfwInput,
  EmailFunnelWorkerCockpitSnapshot,
  EmailFunnelWorkerState,
  Q807ConsumableContract,
} from "./types.js";

export interface EmailFunnelWorkerOptions {
  configuration?: Partial<EmailFunnelWorkerConfiguration>;
  dependencies?: EmailFunnelWorkerDependencies;
}

/** Authoritative Q8-06 Email Funnel Worker — evidence-based funnel assets only. */
export class EmailFunnelWorker {
  private initializedAt: string | null = null;
  private readonly controller: EmailFunnelWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EmailFunnelWorkerOptions = {},
  ) {
    const manager = new FunnelManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new EmailFunnelWorkerController(
      manager,
      buildEmailFunnelWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EMAIL_FUNNEL_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Email Funnel Worker")) {
      throw new Error(
        `${EMAIL_FUNNEL_WORKER_SYSTEM_PATH} missing — Q8-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: EmailFunnelWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): EmailFunnelWorkerState {
    if (!this.initializedAt) {
      throw new Error("Email Funnel Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EFW-001",
      missionId: "Q8-06",
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
        totalFunnels: engineRecord.totalFunnels,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "Email Funnel Worker creates lead magnets, capture strategies, welcome/nurture sequences, and CTA plans from opportunity/SEO evidence only: does not send live emails, manage email infrastructure, fabricate conversion claims, replace Analytics Worker, override Pillow or Grand King, or implement Q8-07 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAffiliateOpportunityReport(input: EfwInput = {}) {
    return this.controller.consumeAffiliateOpportunityReport(input);
  }

  consumeSeoContentReport(input: EfwInput = {}) {
    return this.controller.consumeSeoContentReport(input);
  }

  generateLeadMagnet(input: EfwInput = {}) {
    return this.controller.generateLeadMagnet(input);
  }

  generateEmailCaptureStrategy(input: EfwInput = {}) {
    return this.controller.generateEmailCaptureStrategy(input);
  }

  defineFunnelStages(input: EfwInput = {}) {
    return this.controller.defineFunnelStages(input);
  }

  generateWelcomeSequence(input: EfwInput = {}) {
    return this.controller.generateWelcomeSequence(input);
  }

  generateNurtureSequence(input: EfwInput = {}) {
    return this.controller.generateNurtureSequence(input);
  }

  generateCallToActionStrategy(input: EfwInput = {}) {
    return this.controller.generateCallToActionStrategy(input);
  }

  produceEmailFunnelReport(input: EfwInput = {}) {
    return this.controller.produceEmailFunnelReport(input);
  }

  produceReport(input: EfwInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: EfwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getStore().listReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getStore().getAuditTrail();
  }

  getVersionHistory() {
    return this.controller.getManager().getStore().getVersionHistory();
  }

  validate(input: EfwInput = {}) {
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
        `Email funnel reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EmailFunnelWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-06",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalFunnels: state.health.totalFunnels,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateConversionOrPerformanceClaims: true,
      neverSendLiveMarketingEmails: true,
      neverManageEmailInfrastructure: true,
      neverReplaceAnalyticsWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ807OrLater: true,
      consumableByQ807: true,
    };
  }

  getQ807ConsumableContract(): Q807ConsumableContract {
    return this.controller.getManager().getQ807ConsumableContract();
  }
}

export function createEmailFunnelWorker(
  bootstrap: EmpireBootstrapContext,
  options?: EmailFunnelWorkerOptions,
) {
  return new EmailFunnelWorker(bootstrap, options);
}

export function resetEmailFunnelWorkerForTesting() {
  resetEfwLogsForTesting();
  resetEfwSequenceForTesting();
}
