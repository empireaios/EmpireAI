import { existsSync, readFileSync } from "node:fs";

import { join } from "node:path";

import { PROGRAMME_CERTIFICATION_FACTORY_IDENTITY, PCFCT_METADATA_VERSION } from "./paths.js";

import type { ProgrammeCertificationReport } from "./types.js";



export type ProgrammeCertificationFactoryConfiguration = {

  enabled: boolean;

  executiveReportingEnabled: boolean;

  integrationTargets: string[];

  workerId: string;

  workerName: string;

  factory: string;

  department: string;

  role: string;

  reportingLine: string[];

  repositoryRoot: string;

  seedReports: ProgrammeCertificationReport[];

  retryPolicyAttempts: number;

  timeoutMs: number;

  loggingLevel: "error" | "warn" | "info" | "debug";

  /** Q13-06 hard boundaries — force-locked true. */

  neverFabricateFindings: true;

  neverAutoModifyProduction: true;

  neverCertifyFromClaimsAlone: true;

  neverImplementFutureProgramme: true;

  neverImplementQ1307OrLater: true;

  neverBypassGovernance: true;

  preserveCertificationHistory: true;

  preserveAuditHistory: true;

  programmeCertificationOnly: true;

  maskSensitiveValues: boolean;

};



export const DEFAULT_PROGRAMME_CERTIFICATION_FACTORY_CONFIGURATION: ProgrammeCertificationFactoryConfiguration = {

  enabled: true,

  executiveReportingEnabled: true,

  integrationTargets: [

    "implementation_recovery_planner",

    "cursor_specification_generator",

    "mission_planning_engine",

    "repository_intelligence_engine",

    "implementation_specification_engine",

    "q_series_certification",

    "q_series_completion",

    "production_certification_core",

    "empire_knowledge_engine",

    "audit_runtime",

    "executive_reporting_runtime",

    "pillow_orchestration_runtime",

  ],

  workerId: PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.workerId,

  workerName: PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.workerName,

  factory: PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.factory,

  department: PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.department,

  role: PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.role,

  reportingLine: [...PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.reportingLine],

  repositoryRoot: "",

  seedReports: [],

  retryPolicyAttempts: 3,

  timeoutMs: 30000,

  loggingLevel: "info",

  neverFabricateFindings: true,

  neverAutoModifyProduction: true,

  neverCertifyFromClaimsAlone: true,

  neverImplementFutureProgramme: true,

  neverImplementQ1307OrLater: true,

  neverBypassGovernance: true,

  preserveCertificationHistory: true,

  preserveAuditHistory: true,

  programmeCertificationOnly: true,

  maskSensitiveValues: true,

};



export function buildProgrammeCertificationFactoryConfiguration(

  repositoryRoot?: string,

  overrides: Partial<ProgrammeCertificationFactoryConfiguration> = {},

): ProgrammeCertificationFactoryConfiguration {

  let file: Partial<ProgrammeCertificationFactoryConfiguration> = {};

  const candidate = repositoryRoot

    ? join(repositoryRoot, "config", "programme-certification-factory.config.json")

    : "";

  if (candidate && existsSync(candidate)) {

    try {

      file = JSON.parse(readFileSync(candidate, "utf8"));

    } catch {

      /* retain safe defaults */

    }

  }



  const timeout = Number.parseInt(process.env.PROGRAMME_CERTIFICATION_FACTORY_TIMEOUT_MS ?? "", 10);

  const retries = Number.parseInt(process.env.PROGRAMME_CERTIFICATION_FACTORY_RETRY_ATTEMPTS ?? "", 10);



  return {

    ...DEFAULT_PROGRAMME_CERTIFICATION_FACTORY_CONFIGURATION,

    ...file,

    ...overrides,

    repositoryRoot: repositoryRoot ?? overrides.repositoryRoot ?? file.repositoryRoot ?? "",

    integrationTargets: Array.from(

      new Set([

        ...DEFAULT_PROGRAMME_CERTIFICATION_FACTORY_CONFIGURATION.integrationTargets,

        ...((file.integrationTargets as string[] | undefined) ?? []),

        ...((overrides.integrationTargets as string[] | undefined) ?? []),

      ]),

    ),

    reportingLine: [

      ...(overrides.reportingLine ??

        file.reportingLine ??

        DEFAULT_PROGRAMME_CERTIFICATION_FACTORY_CONFIGURATION.reportingLine),

    ],

    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),

    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),

    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),

    neverFabricateFindings: true,

    neverAutoModifyProduction: true,

    neverCertifyFromClaimsAlone: true,

    neverImplementFutureProgramme: true,

    neverImplementQ1307OrLater: true,

    neverBypassGovernance: true,

    preserveCertificationHistory: true,

    preserveAuditHistory: true,

    programmeCertificationOnly: true,

    maskSensitiveValues: true,

  };

}



function lockReport(report: ProgrammeCertificationReport): ProgrammeCertificationReport {

  return {

    ...report,

    supportingEvidence: [...report.supportingEvidence],

    historyRefs: [...report.historyRefs],

    metadataVersion: report.metadataVersion || PCFCT_METADATA_VERSION,

    neverImplementFutureProgramme: true,

    neverImplementQ1307OrLater: true,

    neverAutoModifyProduction: true,

    neverCertifyFromClaimsAlone: true,

    neverFabricateFindings: true,

    neverBypassGovernance: true,

    programmeCertificationOnly: true,

  };

}


