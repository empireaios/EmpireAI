import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  LEAD_GENERATION_WORKER_IDENTITY,
  LGW_METADATA_VERSION,
} from "./paths.js";
import type { LeadGenerationReport } from "./types.js";

export type LeadGenerationWorkerConfiguration = {
  enabled: boolean;
  leadRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: LeadGenerationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-08 hard boundaries — force-locked true. */
  neverExecuteAdvertisingCampaigns: true;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverDeliverCustomerJobs: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateLeadOrConversionResults: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ709OrLater: true;
  preserveCompleteLeadTraceability: true;
  preserveFunnelAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_LEAD_GENERATION_WORKER_CONFIGURATION: LeadGenerationWorkerConfiguration =
  {
    enabled: true,
    leadRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: LEAD_GENERATION_WORKER_IDENTITY.workerId,
    workerName: LEAD_GENERATION_WORKER_IDENTITY.workerName,
    factory: LEAD_GENERATION_WORKER_IDENTITY.factory,
    department: LEAD_GENERATION_WORKER_IDENTITY.department,
    role: LEAD_GENERATION_WORKER_IDENTITY.role,
    reportingLine: [...LEAD_GENERATION_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteAdvertisingCampaigns: true,
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverDeliverCustomerJobs: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateLeadOrConversionResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ709OrLater: true,
    preserveCompleteLeadTraceability: true,
    preserveFunnelAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildLeadGenerationWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LeadGenerationWorkerConfiguration> = {},
): LeadGenerationWorkerConfiguration {
  let file: Partial<LeadGenerationWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "lead-generation-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.LEAD_GENERATION_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.LEAD_GENERATION_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  return {
    ...DEFAULT_LEAD_GENERATION_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_LEAD_GENERATION_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LEAD_GENERATION_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteAdvertisingCampaigns: true,
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverDeliverCustomerJobs: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateLeadOrConversionResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ709OrLater: true,
    preserveCompleteLeadTraceability: true,
    preserveFunnelAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: LeadGenerationReport): LeadGenerationReport {
  return {
    ...report,
    forms: report.forms.map((f) => ({
      ...f,
      fields: f.fields.map((field) => ({
        ...field,
        options: field.options ? [...field.options] : undefined,
      })),
      neverExposeProhibitedPersonalData: true,
    })),
    capturedLeads: report.capturedLeads.map((l) => ({
      ...l,
      formSubmission: { ...l.formSubmission },
      tags: [...l.tags],
      fabricated: false,
      score: l.score
        ? { ...l.score, factors: [...l.score.factors], fabricated: false }
        : null,
    })),
    funnelPerformanceSummary: {
      ...report.funnelPerformanceSummary,
      leadsBySource: { ...report.funnelPerformanceSummary.leadsBySource },
      leadsByQualification: {
        ...report.funnelPerformanceSummary.leadsByQualification,
      },
      leadsByConversionStage: {
        ...report.funnelPerformanceSummary.leadsByConversionStage,
      },
      notes: [...report.funnelPerformanceSummary.notes],
      derivedFromObservedCapturesOnly: true,
      neverFabricated: true,
    },
    sourceAttribution: {
      ...report.sourceAttribution,
      seoKeywordHints: [...report.sourceAttribution.seoKeywordHints],
    },
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    leadScore: report.leadScore
      ? {
          ...report.leadScore,
          factors: [...report.leadScore.factors],
          fabricated: false,
        }
      : null,
    metadataVersion: report.metadataVersion || LGW_METADATA_VERSION,
    consumableByQ709: true,
    neverExecuteAdvertisingCampaigns: true,
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverDeliverCustomerJobs: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateLeadOrConversionResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ709OrLater: true,
    preserveCompleteLeadTraceability: true,
    preserveFunnelAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
