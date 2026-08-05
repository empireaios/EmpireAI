import { existsSync, readFileSync } from "node:fs";

import { join } from "node:path";

import { GKAGT_METADATA_VERSION, GRAND_KING_ACCEPTANCE_GATE_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";

import type { GrandKingAcceptanceReport } from "./types.js";



export type GrandKingAcceptanceGateConfiguration = {

  enabled: boolean;

  executiveReportingEnabled: boolean;

  integrationTargets: string[];

  workerId: string;

  workerName: string;

  factory: string;

  department: string;

  role: string;

  reportingLine: string[];

  seedReports: GrandKingAcceptanceReport[];

  retryPolicyAttempts: number;

  timeoutMs: number;

  loggingLevel: "error" | "warn" | "info" | "debug";

  /** Q11-10 hard boundaries — force-locked true. */

  neverFabricateApprovalEvidence: true;

  neverBypassGrandKingApproval: true;

  neverAuthoriseWithoutApproval: true;

  neverOverrideFailedCertifications: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementQ1201OrLater: true;

  preserveCompleteTraceability: true;

  preserveImmutableApprovalHistory: true;

  preserveAuditHistory: true;

  deterministicGateBehaviour: true;

  structuralSignalOnly: true;

  evidenceBasedOnly: true;

  maskSensitiveValues: true;

};



export const DEFAULT_GRAND_KING_ACCEPTANCE_GATE_CONFIGURATION: GrandKingAcceptanceGateConfiguration = {

  enabled: true,

  executiveReportingEnabled: true,

  integrationTargets: [...INTEGRATION_TARGETS],

  workerId: GRAND_KING_ACCEPTANCE_GATE_IDENTITY.workerId,

  workerName: GRAND_KING_ACCEPTANCE_GATE_IDENTITY.workerName,

  factory: GRAND_KING_ACCEPTANCE_GATE_IDENTITY.factory,

  department: GRAND_KING_ACCEPTANCE_GATE_IDENTITY.department,

  role: GRAND_KING_ACCEPTANCE_GATE_IDENTITY.role,

  reportingLine: [...GRAND_KING_ACCEPTANCE_GATE_IDENTITY.reportingLine],

  seedReports: [],

  retryPolicyAttempts: 3,

  timeoutMs: 5000,

  loggingLevel: "info",

  neverFabricateApprovalEvidence: true,

  neverBypassGrandKingApproval: true,

  neverAuthoriseWithoutApproval: true,

  neverOverrideFailedCertifications: true,

  neverOverridePillow: true,

  neverOverrideGrandKing: true,

  neverImplementQ1201OrLater: true,

  preserveCompleteTraceability: true,

  preserveImmutableApprovalHistory: true,

  preserveAuditHistory: true,

  deterministicGateBehaviour: true,

  structuralSignalOnly: true,

  evidenceBasedOnly: true,

  maskSensitiveValues: true,

};



export function buildGrandKingAcceptanceGateConfiguration(

  repositoryRoot?: string,

  overrides: Partial<GrandKingAcceptanceGateConfiguration> = {},

): GrandKingAcceptanceGateConfiguration {

  let file: Partial<GrandKingAcceptanceGateConfiguration> = {};

  const candidate = repositoryRoot

    ? join(repositoryRoot, "config", "grand-king-acceptance-gate.config.json")

    : "";

  if (candidate && existsSync(candidate)) {

    try {

      file = JSON.parse(readFileSync(candidate, "utf8"));

    } catch {

      /* retain safe defaults */

    }

  }

  const timeout = Number.parseInt(process.env.GRAND_KING_ACCEPTANCE_GATE_TIMEOUT_MS ?? "", 10);

  const retries = Number.parseInt(process.env.GRAND_KING_ACCEPTANCE_GATE_RETRY_ATTEMPTS ?? "", 10);



  return {

    ...DEFAULT_GRAND_KING_ACCEPTANCE_GATE_CONFIGURATION,

    ...file,

    ...overrides,

    integrationTargets: Array.from(

      new Set([

        ...DEFAULT_GRAND_KING_ACCEPTANCE_GATE_CONFIGURATION.integrationTargets,

        ...((file.integrationTargets as string[] | undefined) ?? []),

        ...((overrides.integrationTargets as string[] | undefined) ?? []),

      ]),

    ),

    reportingLine: [

      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_GRAND_KING_ACCEPTANCE_GATE_CONFIGURATION.reportingLine),

    ],

    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),

    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),

    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),

    neverFabricateApprovalEvidence: true,

    neverBypassGrandKingApproval: true,

    neverAuthoriseWithoutApproval: true,

    neverOverrideFailedCertifications: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ1201OrLater: true,

    preserveCompleteTraceability: true,

    preserveImmutableApprovalHistory: true,

    preserveAuditHistory: true,

    deterministicGateBehaviour: true,

    structuralSignalOnly: true,

    evidenceBasedOnly: true,

    maskSensitiveValues: true,

  };

}



function lockReport(report: GrandKingAcceptanceReport): GrandKingAcceptanceReport {

  return {

    ...report,

    supportingEvidence: [...report.supportingEvidence],

    outstandingIssues: [...report.outstandingIssues],

    traceabilityRefs: [...report.traceabilityRefs],

    decisionHistoryRefs: [...report.decisionHistoryRefs],

    metadataVersion: report.metadataVersion || GKAGT_METADATA_VERSION,

    structuralSignalOnly: true,

    evidenceBasedOnly: true,

    preserveCompleteTraceability: true,

    preserveImmutableApprovalHistory: true,

    preserveAuditHistory: true,

    deterministicGateBehaviour: true,

    maskSensitiveValues: true,

    neverFabricateApprovalEvidence: true,

    neverBypassGrandKingApproval: true,

    neverAuthoriseWithoutApproval: true,

    neverOverrideFailedCertifications: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ1201OrLater: true,

    finalQ11Gate: true,

  };

}

