import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTENT_FORMATS,
  INTEGRATION_TARGETS,
  SCW_METADATA_VERSION,
  SCRIPT_WORKER_IDENTITY,
} from "./paths.js";
import type { ScriptReport } from "./types.js";

export type ScriptWorkerConfiguration = {
  enabled: boolean;
  scriptRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultContentFormat: string;
  supportedContentFormats: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedScripts: ScriptReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-05 hard boundaries — force-locked true. */
  neverGenerateVisuals: true;
  neverGenerateVoiceovers: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ406OrLater: true;
  followApprovedTopicPlan: true;
  followEditorInChiefStrategy: true;
  produceOriginalContent: true;
  preserveScriptTraceability: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SCRIPT_WORKER_CONFIGURATION: ScriptWorkerConfiguration = {
  enabled: true,
  scriptRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultContentFormat: "explainer",
  supportedContentFormats: [...CONTENT_FORMATS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SCRIPT_WORKER_IDENTITY.workerId,
  workerName: SCRIPT_WORKER_IDENTITY.workerName,
  factory: SCRIPT_WORKER_IDENTITY.factory,
  department: SCRIPT_WORKER_IDENTITY.department,
  role: SCRIPT_WORKER_IDENTITY.role,
  reportingLine: [...SCRIPT_WORKER_IDENTITY.reportingLine],
  seedScripts: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverGenerateVisuals: true,
  neverGenerateVoiceovers: true,
  neverAssembleVideos: true,
  neverPublishContent: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ406OrLater: true,
  followApprovedTopicPlan: true,
  followEditorInChiefStrategy: true,
  produceOriginalContent: true,
  preserveScriptTraceability: true,
  performSelfReviewBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildScriptWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ScriptWorkerConfiguration> = {},
): ScriptWorkerConfiguration {
  let file: Partial<ScriptWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "script-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SCRIPT_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SCRIPT_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedContentFormats") =>
    Array.from(
      new Set([
        ...DEFAULT_SCRIPT_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_SCRIPT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedContentFormats: mergeList("supportedContentFormats"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SCRIPT_WORKER_CONFIGURATION.reportingLine),
    ],
    seedScripts: (overrides.seedScripts ?? file.seedScripts ?? []).map((s) => lockScript(s)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverGenerateVisuals: true,
    neverGenerateVoiceovers: true,
    neverAssembleVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ406OrLater: true,
    followApprovedTopicPlan: true,
    followEditorInChiefStrategy: true,
    produceOriginalContent: true,
    preserveScriptTraceability: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockScript(script: ScriptReport): ScriptReport {
  return {
    ...script,
    scriptSections: script.scriptSections.map((s) => ({ ...s })),
    traceabilityRefs: [...script.traceabilityRefs],
    preservedDecisions: script.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: script.selfReviewFindings.map((f) => ({ ...f })),
    metadataVersion: script.metadataVersion || SCW_METADATA_VERSION,
    neverGenerateVisuals: true,
    neverGenerateVoiceovers: true,
    neverAssembleVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ406OrLater: true,
    followApprovedTopicPlan: true,
    followEditorInChiefStrategy: true,
    produceOriginalContent: true,
    preserveScriptTraceability: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
