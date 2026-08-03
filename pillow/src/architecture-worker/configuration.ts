import { existsSync, readFileSync } from "node:fs";

import { join } from "node:path";

import {

  ARCHITECTURE_DOMAINS,

  ARCHITECTURE_WORKER_IDENTITY,

  ARW_METADATA_VERSION,

  INTEGRATION_TARGETS,

} from "./paths.js";

import type { ArchitectureReport } from "./types.js";



export type ArchitectureWorkerConfiguration = {

  enabled: boolean;

  architectureRulesEnabled: boolean;

  validationRulesEnabled: boolean;

  executiveReportingEnabled: boolean;

  defaultArchitectureDomain: string;

  supportedArchitectureDomains: string[];

  integrationTargets: string[];

  workerId: string;

  workerName: string;

  factory: string;

  department: string;

  role: string;

  reportingLine: string[];

  seedArchitectureReports: ArchitectureReport[];

  timeoutMs: number;

  loggingLevel: "error" | "warn" | "info" | "debug";

  /** Q6-03 hard boundaries — force-locked true. */

  neverWriteFrontendCode: true;

  neverWriteBackendCode: true;

  neverDeployApplications: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementApplicationLogic: true;

  neverImplementQ604OrLater: true;

  followApprovedRequirements: true;

  preserveCompleteTraceability: true;

  separateArchitecturalDecisionsFromAssumptions: true;

  validateArchitecturalConsistency: true;

  preserveAuditHistory: true;

  structuralSignalOnly: true;

  maskSensitiveValues: true;

  neverBypassPillowGovernance: true;

  neverLogSensitiveEnterpriseInformation: true;

};



export const DEFAULT_ARCHITECTURE_WORKER_CONFIGURATION: ArchitectureWorkerConfiguration = {

  enabled: true,

  architectureRulesEnabled: true,

  validationRulesEnabled: true,

  executiveReportingEnabled: true,

  defaultArchitectureDomain: "system_architecture",

  supportedArchitectureDomains: [...ARCHITECTURE_DOMAINS],

  integrationTargets: [...INTEGRATION_TARGETS],

  workerId: ARCHITECTURE_WORKER_IDENTITY.workerId,

  workerName: ARCHITECTURE_WORKER_IDENTITY.workerName,

  factory: ARCHITECTURE_WORKER_IDENTITY.factory,

  department: ARCHITECTURE_WORKER_IDENTITY.department,

  role: ARCHITECTURE_WORKER_IDENTITY.role,

  reportingLine: [...ARCHITECTURE_WORKER_IDENTITY.reportingLine],

  seedArchitectureReports: [],

  timeoutMs: 5000,

  loggingLevel: "info",

  neverWriteFrontendCode: true,

  neverWriteBackendCode: true,

  neverDeployApplications: true,

  neverOverridePillow: true,

  neverOverrideGrandKing: true,

  neverImplementApplicationLogic: true,

  neverImplementQ604OrLater: true,

  followApprovedRequirements: true,

  preserveCompleteTraceability: true,

  separateArchitecturalDecisionsFromAssumptions: true,

  validateArchitecturalConsistency: true,

  preserveAuditHistory: true,

  structuralSignalOnly: true,

  maskSensitiveValues: true,

  neverBypassPillowGovernance: true,

  neverLogSensitiveEnterpriseInformation: true,

};



export function buildArchitectureWorkerConfiguration(

  repositoryRoot?: string,

  overrides: Partial<ArchitectureWorkerConfiguration> = {},

): ArchitectureWorkerConfiguration {

  let file: Partial<ArchitectureWorkerConfiguration> = {};

  const candidate = repositoryRoot

    ? join(repositoryRoot, "config", "architecture-worker.config.json")

    : "";

  if (candidate && existsSync(candidate)) {

    try {

      file = JSON.parse(readFileSync(candidate, "utf8"));

    } catch {

      /* retain safe defaults */

    }

  }

  const timeout = Number.parseInt(process.env.ARCHITECTURE_WORKER_TIMEOUT_MS ?? "", 10);

  const mergeList = (key: "integrationTargets" | "supportedArchitectureDomains") =>

    Array.from(

      new Set([

        ...DEFAULT_ARCHITECTURE_WORKER_CONFIGURATION[key],

        ...(file[key] ?? []),

        ...(overrides[key] ?? []),

      ]),

    );

  return {

    ...DEFAULT_ARCHITECTURE_WORKER_CONFIGURATION,

    ...file,

    ...overrides,

    integrationTargets: mergeList("integrationTargets"),

    supportedArchitectureDomains: mergeList("supportedArchitectureDomains"),

    defaultArchitectureDomain:

      overrides.defaultArchitectureDomain ??

      file.defaultArchitectureDomain ??

      DEFAULT_ARCHITECTURE_WORKER_CONFIGURATION.defaultArchitectureDomain,

    reportingLine: [

      ...(overrides.reportingLine ??

        file.reportingLine ??

        DEFAULT_ARCHITECTURE_WORKER_CONFIGURATION.reportingLine),

    ],

    seedArchitectureReports: (overrides.seedArchitectureReports ?? file.seedArchitectureReports ?? []).map(

      (r) => lockArchitectureReport(r),

    ),

    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),

    neverWriteFrontendCode: true,

    neverWriteBackendCode: true,

    neverDeployApplications: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementApplicationLogic: true,

    neverImplementQ604OrLater: true,

    followApprovedRequirements: true,

    preserveCompleteTraceability: true,

    separateArchitecturalDecisionsFromAssumptions: true,

    validateArchitecturalConsistency: true,

    preserveAuditHistory: true,

    structuralSignalOnly: true,

    maskSensitiveValues: true,

    neverBypassPillowGovernance: true,

    neverLogSensitiveEnterpriseInformation: true,

  };

}



function lockArchitectureReport(report: ArchitectureReport): ArchitectureReport {

  return {

    ...report,

    architectureSteps: report.architectureSteps.map((s) => ({ ...s })),

    supportedArchitectureDomains: [...report.supportedArchitectureDomains],

    moduleArchitecture: report.moduleArchitecture.map((m) => ({ ...m })),

    apiArchitecture: report.apiArchitecture.map((a) => ({ ...a })),

    dataFlow: report.dataFlow.map((f) => ({ ...f })),

    serviceDependencies: report.serviceDependencies.map((d) => ({ ...d })),

    deploymentArchitecture: {

      ...report.deploymentArchitecture,

      environments: [...report.deploymentArchitecture.environments],

      components: report.deploymentArchitecture.components.map((c) => ({ ...c })),

    },

    integrationArchitecture: report.integrationArchitecture.map((i) => ({ ...i })),

    securityConsiderations: [...report.securityConsiderations],

    scalabilityConsiderations: [...report.scalabilityConsiderations],

    maintainabilityConsiderations: [...report.maintainabilityConsiderations],

    architecturalDecisions: report.architecturalDecisions.map((d) => ({ ...d })),

    assumptions: [...report.assumptions],

    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),

    traceabilityRefs: [...report.traceabilityRefs],

    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

    metadataVersion: report.metadataVersion || ARW_METADATA_VERSION,

    neverWriteFrontendCode: true,

    neverWriteBackendCode: true,

    neverDeployApplications: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementApplicationLogic: true,

    neverImplementQ604OrLater: true,

    followApprovedRequirements: true,

    preserveCompleteTraceability: true,

    separateArchitecturalDecisionsFromAssumptions: true,

    validateArchitecturalConsistency: true,

    preserveAuditHistory: true,

    structuralSignalOnly: true,

    maskSensitiveValues: true,

  };

}


