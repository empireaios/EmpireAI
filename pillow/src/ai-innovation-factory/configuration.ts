import { existsSync, readFileSync } from "node:fs";

import { join } from "node:path";

import { AIFRT_METADATA_VERSION, AI_INNOVATION_FACTORY_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";

import type { AiInnovationReport } from "./types.js";



export type AiInnovationFactoryConfiguration = {

  enabled: boolean;

  executiveReportingEnabled: boolean;

  integrationTargets: string[];

  workerId: string;

  workerName: string;

  factory: string;

  department: string;

  role: string;

  reportingLine: string[];

  seedReports: AiInnovationReport[];

  retryPolicyAttempts: number;

  timeoutMs: number;

  loggingLevel: "error" | "warn" | "info" | "debug";

  researchCatalogPaths: string[];

  /** Q12-01 hard boundaries — force-locked true. */

  neverFabricateResearchEvidence: true;

  neverAutoDeployInnovations: true;

  neverBypassGovernance: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementQ1301OrLater: true;

  neverClaimQSeriesCompleteWhenIncomplete: true;

  preserveCompleteTraceability: true;

  preserveInnovationHistory: true;

  preserveAuditHistory: true;

  deterministicInnovationBehaviour: true;

  evidenceBasedOnly: true;

  maskSensitiveValues: true;

};



export const DEFAULT_AI_INNOVATION_FACTORY_CONFIGURATION: AiInnovationFactoryConfiguration = {

  enabled: true,

  executiveReportingEnabled: true,

  integrationTargets: [...INTEGRATION_TARGETS],

  workerId: AI_INNOVATION_FACTORY_IDENTITY.workerId,

  workerName: AI_INNOVATION_FACTORY_IDENTITY.workerName,

  factory: AI_INNOVATION_FACTORY_IDENTITY.factory,

  department: AI_INNOVATION_FACTORY_IDENTITY.department,

  role: AI_INNOVATION_FACTORY_IDENTITY.role,

  reportingLine: [...AI_INNOVATION_FACTORY_IDENTITY.reportingLine],

  seedReports: [],

  retryPolicyAttempts: 3,

  timeoutMs: 5000,

  loggingLevel: "info",

  researchCatalogPaths: [

    "config/ai-innovation-factory.config.json",

    "docs/governance/EMPIREAI_AI_INNOVATION_FACTORY_SYSTEM.md",

  ],

  neverFabricateResearchEvidence: true,

  neverAutoDeployInnovations: true,

  neverBypassGovernance: true,

  neverOverridePillow: true,

  neverOverrideGrandKing: true,

  neverImplementQ1301OrLater: true,

  neverClaimQSeriesCompleteWhenIncomplete: true,

  preserveCompleteTraceability: true,

  preserveInnovationHistory: true,

  preserveAuditHistory: true,

  deterministicInnovationBehaviour: true,

  evidenceBasedOnly: true,

  maskSensitiveValues: true,

};



export function buildAiInnovationFactoryConfiguration(

  repositoryRoot?: string,

  overrides: Partial<AiInnovationFactoryConfiguration> = {},

): AiInnovationFactoryConfiguration {

  let file: Partial<AiInnovationFactoryConfiguration> = {};

  const candidate = repositoryRoot

    ? join(repositoryRoot, "config", "ai-innovation-factory.config.json")

    : "";

  if (candidate && existsSync(candidate)) {

    try {

      file = JSON.parse(readFileSync(candidate, "utf8"));

    } catch {

      /* retain safe defaults */

    }

  }

  const timeout = Number.parseInt(process.env.AI_INNOVATION_FACTORY_TIMEOUT_MS ?? "", 10);

  const retries = Number.parseInt(process.env.AI_INNOVATION_FACTORY_RETRY_ATTEMPTS ?? "", 10);



  return {

    ...DEFAULT_AI_INNOVATION_FACTORY_CONFIGURATION,

    ...file,

    ...overrides,

    integrationTargets: Array.from(

      new Set([

        ...DEFAULT_AI_INNOVATION_FACTORY_CONFIGURATION.integrationTargets,

        ...((file.integrationTargets as string[] | undefined) ?? []),

        ...((overrides.integrationTargets as string[] | undefined) ?? []),

      ]),

    ),

    reportingLine: [

      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_AI_INNOVATION_FACTORY_CONFIGURATION.reportingLine),

    ],

    researchCatalogPaths: [

      ...(overrides.researchCatalogPaths ??

        file.researchCatalogPaths ??

        DEFAULT_AI_INNOVATION_FACTORY_CONFIGURATION.researchCatalogPaths),

    ],

    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),

    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),

    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),

    neverFabricateResearchEvidence: true,

    neverAutoDeployInnovations: true,

    neverBypassGovernance: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ1301OrLater: true,

    neverClaimQSeriesCompleteWhenIncomplete: true,

    preserveCompleteTraceability: true,

    preserveInnovationHistory: true,

    preserveAuditHistory: true,

    deterministicInnovationBehaviour: true,

    evidenceBasedOnly: true,

    maskSensitiveValues: true,

  };

}



function lockReport(report: AiInnovationReport): AiInnovationReport {

  return {

    ...report,

    supportingEvidence: [...report.supportingEvidence],

    outstandingIssues: [...report.outstandingIssues],

    traceabilityRefs: [...report.traceabilityRefs],

    proposals: report.proposals.map((p) => ({ ...p, supportingEvidence: [...p.supportingEvidence] })),

    metadataVersion: report.metadataVersion || AIFRT_METADATA_VERSION,

    neverImplementQ1301OrLater: true,

    neverAutoDeployInnovations: true,

    evidenceBasedOnly: true,

    preserveCompleteTraceability: true,

    preserveInnovationHistory: true,

    preserveAuditHistory: true,

    deterministicInnovationBehaviour: true,

    maskSensitiveValues: true,

    neverFabricateResearchEvidence: true,

    neverBypassGovernance: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverClaimQSeriesCompleteWhenIncomplete: true,

  };

}


