import { existsSync, readFileSync } from "node:fs";

import { join } from "node:path";

import {

  ECW_METADATA_VERSION,

  EDITOR_IN_CHIEF_WORKER_IDENTITY,

  INTEGRATION_TARGETS,

} from "./paths.js";

import type { EditorialReport } from "./types.js";



export type EditorInChiefWorkerConfiguration = {

  enabled: boolean;

  editorialRulesEnabled: boolean;

  validationRulesEnabled: boolean;

  executiveReportingEnabled: boolean;

  defaultEditorialTone: string;

  defaultReviewOutcome: string;

  integrationTargets: string[];

  workerId: string;

  workerName: string;

  factory: string;

  department: string;

  role: string;

  reportingLine: string[];

  seedReports: EditorialReport[];

  retryPolicyAttempts: number;

  timeoutMs: number;

  loggingLevel: "error" | "warn" | "info" | "debug";

  /** Q4-02 hard boundaries — force-locked true. */

  neverWriteScripts: true;

  neverCreateThumbnails: true;

  neverAssembleVideos: true;

  neverPublishContent: true;

  neverBypassPillowGovernance: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementQ403OrLater: true;

  preserveEditorialConsistency: true;

  preserveChannelIdentity: true;

  preserveAudienceAlignment: true;

  preserveAuditHistory: true;

  structuralSignalOnly: true;

  maskSensitiveValues: true;

  neverExposeCredentials: true;

  neverExposeAuthenticationTokens: true;

  neverLogSensitiveEnterpriseInformation: true;

};



export const DEFAULT_EDITOR_IN_CHIEF_WORKER_CONFIGURATION: EditorInChiefWorkerConfiguration =

  {

    enabled: true,

    editorialRulesEnabled: true,

    validationRulesEnabled: true,

    executiveReportingEnabled: true,

    defaultEditorialTone: "authoritative",

    defaultReviewOutcome: "pending_review",

    integrationTargets: [...INTEGRATION_TARGETS],

    workerId: EDITOR_IN_CHIEF_WORKER_IDENTITY.workerId,

    workerName: EDITOR_IN_CHIEF_WORKER_IDENTITY.workerName,

    factory: EDITOR_IN_CHIEF_WORKER_IDENTITY.factory,

    department: EDITOR_IN_CHIEF_WORKER_IDENTITY.department,

    role: EDITOR_IN_CHIEF_WORKER_IDENTITY.role,

    reportingLine: [...EDITOR_IN_CHIEF_WORKER_IDENTITY.reportingLine],

    seedReports: [],

    retryPolicyAttempts: 3,

    timeoutMs: 5000,

    loggingLevel: "info",

    neverWriteScripts: true,

    neverCreateThumbnails: true,

    neverAssembleVideos: true,

    neverPublishContent: true,

    neverBypassPillowGovernance: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ403OrLater: true,

    preserveEditorialConsistency: true,

    preserveChannelIdentity: true,

    preserveAudienceAlignment: true,

    preserveAuditHistory: true,

    structuralSignalOnly: true,

    maskSensitiveValues: true,

    neverExposeCredentials: true,

    neverExposeAuthenticationTokens: true,

    neverLogSensitiveEnterpriseInformation: true,

  };



export function buildEditorInChiefWorkerConfiguration(

  repositoryRoot?: string,

  overrides: Partial<EditorInChiefWorkerConfiguration> = {},

): EditorInChiefWorkerConfiguration {

  let file: Partial<EditorInChiefWorkerConfiguration> = {};

  const candidate = repositoryRoot

    ? join(repositoryRoot, "config", "editor-in-chief-worker.config.json")

    : "";

  if (candidate && existsSync(candidate)) {

    try {

      file = JSON.parse(readFileSync(candidate, "utf8"));

    } catch {

      /* retain safe defaults */

    }

  }

  const timeout = Number.parseInt(

    process.env.EDITOR_IN_CHIEF_WORKER_TIMEOUT_MS ?? "",

    10,

  );

  const retries = Number.parseInt(

    process.env.EDITOR_IN_CHIEF_WORKER_RETRY_ATTEMPTS ?? "",

    10,

  );



  const mergeList = (key: "integrationTargets") =>

    Array.from(

      new Set([

        ...DEFAULT_EDITOR_IN_CHIEF_WORKER_CONFIGURATION[key],

        ...(file[key] ?? []),

        ...(overrides[key] ?? []),

      ]),

    );



  return {

    ...DEFAULT_EDITOR_IN_CHIEF_WORKER_CONFIGURATION,

    ...file,

    ...overrides,

    integrationTargets: mergeList("integrationTargets"),

    reportingLine: [

      ...(overrides.reportingLine ??

        file.reportingLine ??

        DEFAULT_EDITOR_IN_CHIEF_WORKER_CONFIGURATION.reportingLine),

    ],

    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) =>

      lockReport(r),

    ),

    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),

    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),

    neverWriteScripts: true,

    neverCreateThumbnails: true,

    neverAssembleVideos: true,

    neverPublishContent: true,

    neverBypassPillowGovernance: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ403OrLater: true,

    preserveEditorialConsistency: true,

    preserveChannelIdentity: true,

    preserveAudienceAlignment: true,

    preserveAuditHistory: true,

    structuralSignalOnly: true,

    maskSensitiveValues: true,

    neverExposeCredentials: true,

    neverExposeAuthenticationTokens: true,

    neverLogSensitiveEnterpriseInformation: true,

  };

}



function lockReport(report: EditorialReport): EditorialReport {

  return {

    ...report,

    qualityStandards: report.qualityStandards.map((s) => ({ ...s })),

    contentPriorities: [...report.contentPriorities],

    executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),

    traceabilityRefs: [...report.traceabilityRefs],

    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

    metadataVersion: report.metadataVersion || ECW_METADATA_VERSION,

    neverWriteScripts: true,

    neverCreateThumbnails: true,

    neverAssembleVideos: true,

    neverPublishContent: true,

    neverBypassPillowGovernance: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ403OrLater: true,

    preserveEditorialConsistency: true,

    preserveChannelIdentity: true,

    preserveAudienceAlignment: true,

    preserveAuditHistory: true,

    structuralSignalOnly: true,

    maskSensitiveValues: true,

  };

}


