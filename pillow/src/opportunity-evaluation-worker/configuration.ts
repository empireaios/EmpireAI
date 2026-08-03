import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_TYPES,
  DEFAULT_SCORE_WEIGHTS,
  INTEGRATION_TARGETS,
  OEW_METADATA_VERSION,
  OPPORTUNITY_EVALUATION_WORKER_IDENTITY,
} from "./paths.js";
import type { OpportunityEvaluationReport } from "./types.js";

export type OpportunityEvaluationWorkerConfiguration = {
  enabled: boolean;
  evaluationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  businessTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  scoreWeights: {
    demand: number;
    feasibility: number;
    profitPotential: number;
    risk: number;
    strategicFit: number;
  };
  proceedThreshold: number;
  improveThreshold: number;
  seedEvaluations: OpportunityEvaluationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-05 hard boundaries — force-locked true. */
  neverApproveBusiness: true;
  neverModifyBusinessModel: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ206OrLater: true;
  requireEvidenceBasedScoring: true;
  preserveAuditHistory: true;
  preserveCompleteTraceability: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_OPPORTUNITY_EVALUATION_WORKER_CONFIGURATION: OpportunityEvaluationWorkerConfiguration =
  {
    enabled: true,
    evaluationRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    businessTypes: [...BUSINESS_TYPES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.workerId,
    workerName: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.workerName,
    factory: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.factory,
    department: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.department,
    role: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.role,
    reportingLine: [...OPPORTUNITY_EVALUATION_WORKER_IDENTITY.reportingLine],
    scoreWeights: { ...DEFAULT_SCORE_WEIGHTS },
    proceedThreshold: 70,
    improveThreshold: 45,
    seedEvaluations: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverApproveBusiness: true,
    neverModifyBusinessModel: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ206OrLater: true,
    requireEvidenceBasedScoring: true,
    preserveAuditHistory: true,
    preserveCompleteTraceability: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildOpportunityEvaluationWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OpportunityEvaluationWorkerConfiguration> = {},
): OpportunityEvaluationWorkerConfiguration {
  let file: Partial<OpportunityEvaluationWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "opportunity-evaluation-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.OPPORTUNITY_EVALUATION_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.OPPORTUNITY_EVALUATION_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "businessTypes" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_OPPORTUNITY_EVALUATION_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const weights = {
    ...DEFAULT_SCORE_WEIGHTS,
    ...(file.scoreWeights ?? {}),
    ...(overrides.scoreWeights ?? {}),
  };

  return {
    ...DEFAULT_OPPORTUNITY_EVALUATION_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_OPPORTUNITY_EVALUATION_WORKER_CONFIGURATION.reportingLine),
    ],
    scoreWeights: weights,
    seedEvaluations: (overrides.seedEvaluations ?? file.seedEvaluations ?? []).map((e) =>
      lockEvaluation(e),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverApproveBusiness: true,
    neverModifyBusinessModel: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ206OrLater: true,
    requireEvidenceBasedScoring: true,
    preserveAuditHistory: true,
    preserveCompleteTraceability: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockEvaluation(report: OpportunityEvaluationReport): OpportunityEvaluationReport {
  return {
    ...report,
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    missingInformation: [...report.missingInformation],
    scoreWeights: { ...report.scoreWeights },
    scoreExplanations: cloneExplanations(report.scoreExplanations),
    metadataVersion: report.metadataVersion || OEW_METADATA_VERSION,
    neverApproveBusiness: true,
    neverModifyBusinessModel: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    evidenceBasedScoring: true,
    preserveAuditHistory: true,
    preserveCompleteTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function cloneExplanations(
  explanations: OpportunityEvaluationReport["scoreExplanations"],
): OpportunityEvaluationReport["scoreExplanations"] {
  const clone = (s: OpportunityEvaluationReport["scoreExplanations"]["demand"]) => ({
    ...s,
    facts: [...s.facts],
    assumptions: [...s.assumptions],
    evidenceRefs: [...s.evidenceRefs],
  });
  return {
    demand: clone(explanations.demand),
    feasibility: clone(explanations.feasibility),
    revenuePotential: clone(explanations.revenuePotential),
    profitPotential: clone(explanations.profitPotential),
    operationalComplexity: clone(explanations.operationalComplexity),
    executionRisk: clone(explanations.executionRisk),
    strategicFit: clone(explanations.strategicFit),
    overall: clone(explanations.overall),
  };
}
