import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EFW_METADATA_VERSION,
  EMAIL_FUNNEL_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { EmailFunnelReport } from "./types.js";

export type EmailFunnelWorkerConfiguration = {
  enabled: boolean;
  funnelRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: EmailFunnelReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateConversionOrPerformanceClaims: true;
  neverSendLiveMarketingEmails: true;
  neverManageEmailInfrastructure: true;
  neverReplaceAnalyticsWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ807OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_EMAIL_FUNNEL_WORKER_CONFIGURATION: EmailFunnelWorkerConfiguration = {
  enabled: true,
  funnelRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: EMAIL_FUNNEL_WORKER_IDENTITY.workerId,
  workerName: EMAIL_FUNNEL_WORKER_IDENTITY.workerName,
  factory: EMAIL_FUNNEL_WORKER_IDENTITY.factory,
  department: EMAIL_FUNNEL_WORKER_IDENTITY.department,
  role: EMAIL_FUNNEL_WORKER_IDENTITY.role,
  reportingLine: [...EMAIL_FUNNEL_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateConversionOrPerformanceClaims: true,
  neverSendLiveMarketingEmails: true,
  neverManageEmailInfrastructure: true,
  neverReplaceAnalyticsWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ807OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildEmailFunnelWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmailFunnelWorkerConfiguration> = {},
): EmailFunnelWorkerConfiguration {
  let file: Partial<EmailFunnelWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "email-funnel-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* defaults */
    }
  }
  return {
    ...DEFAULT_EMAIL_FUNNEL_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_EMAIL_FUNNEL_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_EMAIL_FUNNEL_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateConversionOrPerformanceClaims: true,
    neverSendLiveMarketingEmails: true,
    neverManageEmailInfrastructure: true,
    neverReplaceAnalyticsWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ807OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: EmailFunnelReport): EmailFunnelReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || EFW_METADATA_VERSION,
    funnelStages: report.funnelStages.map((s) => ({ ...s })),
    emailSequence: report.emailSequence.map((seq) => ({
      ...seq,
      emails: seq.emails.map((e) => ({ ...e, bodyOutline: [...e.bodyOutline], fabricated: false as const })),
      fabricated: false as const,
    })),
    conversionObjectives: [...report.conversionObjectives],
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    versionHistory: report.versionHistory.map((v) => ({ ...v })),
    consumableByQ807: true,
    neverFabricateConversionOrPerformanceClaims: true,
    neverSendLiveMarketingEmails: true,
    neverManageEmailInfrastructure: true,
    neverReplaceAnalyticsWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ807OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
