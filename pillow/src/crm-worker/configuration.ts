import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CRM_WORKER_IDENTITY,
  CRMW_METADATA_VERSION,
  CUSTOMER_STATUSES,
  INTEGRATION_TARGETS,
  LEAD_STATUSES,
  LIFECYCLE_STAGES,
} from "./paths.js";
import type {
  CrmReport,
  CustomerStatus,
  LeadStatus,
  LifecycleStage,
} from "./types.js";

export type CrmWorkerConfiguration = {
  enabled: boolean;
  crmRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  leadStatuses: LeadStatus[];
  lifecycleStages: LifecycleStage[];
  customerStatuses: CustomerStatus[];
  seedReports: CrmReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-05 hard boundaries — force-locked true. */
  neverExecuteMarketingCampaigns: true;
  neverDeliverCustomerJobs: true;
  neverReplaceBookingFunctionality: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateCustomerInteractions: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ706OrLater: true;
  preserveCompleteCustomerHistory: true;
  preserveCompleteTraceability: true;
  preserveCrmAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_CRM_WORKER_CONFIGURATION: CrmWorkerConfiguration = {
  enabled: true,
  crmRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: CRM_WORKER_IDENTITY.workerId,
  workerName: CRM_WORKER_IDENTITY.workerName,
  factory: CRM_WORKER_IDENTITY.factory,
  department: CRM_WORKER_IDENTITY.department,
  role: CRM_WORKER_IDENTITY.role,
  reportingLine: [...CRM_WORKER_IDENTITY.reportingLine],
  leadStatuses: [...LEAD_STATUSES],
  lifecycleStages: [...LIFECYCLE_STAGES],
  customerStatuses: [...CUSTOMER_STATUSES],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteMarketingCampaigns: true,
  neverDeliverCustomerJobs: true,
  neverReplaceBookingFunctionality: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverFabricateCustomerInteractions: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ706OrLater: true,
  preserveCompleteCustomerHistory: true,
  preserveCompleteTraceability: true,
  preserveCrmAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeProhibitedPersonalData: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildCrmWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CrmWorkerConfiguration> = {},
): CrmWorkerConfiguration {
  let file: Partial<CrmWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "crm-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CRM_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CRM_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "integrationTargets" | "leadStatuses" | "lifecycleStages" | "customerStatuses",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_CRM_WORKER_CONFIGURATION[key],
        ...((file[key] as string[] | undefined) ?? []),
        ...((overrides[key] as string[] | undefined) ?? []),
      ]),
    );

  return {
    ...DEFAULT_CRM_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    leadStatuses: mergeList("leadStatuses") as LeadStatus[],
    lifecycleStages: mergeList("lifecycleStages") as LifecycleStage[],
    customerStatuses: mergeList("customerStatuses") as CustomerStatus[],
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CRM_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteMarketingCampaigns: true,
    neverDeliverCustomerJobs: true,
    neverReplaceBookingFunctionality: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateCustomerInteractions: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ706OrLater: true,
    preserveCompleteCustomerHistory: true,
    preserveCompleteTraceability: true,
    preserveCrmAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: CrmReport): CrmReport {
  return {
    ...report,
    outstandingTasks: [...report.outstandingTasks],
    tags: [...report.tags],
    segments: [...report.segments],
    contactHistory: report.contactHistory.map((c) => ({ ...c, tags: [...c.tags], fabricated: false as const })),
    communicationHistory: report.communicationHistory.map((c) => ({
      ...c,
      tags: [...c.tags],
      fabricated: false as const,
    })),
    bookingHistory: report.bookingHistory.map((b) => ({
      ...b,
      traceabilityRefs: [...b.traceabilityRefs],
    })),
    followUpSchedule: report.followUpSchedule.map((f) => ({ ...f })),
    opportunities: report.opportunities.map((o) => ({ ...o })),
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || CRMW_METADATA_VERSION,
    consumableByQ706: true,
    neverExecuteMarketingCampaigns: true,
    neverDeliverCustomerJobs: true,
    neverReplaceBookingFunctionality: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateCustomerInteractions: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ706OrLater: true,
    preserveCompleteCustomerHistory: true,
    preserveCompleteTraceability: true,
    preserveCrmAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
