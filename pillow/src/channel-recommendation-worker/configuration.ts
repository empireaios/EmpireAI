import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHANNEL_RECOMMENDATION_WORKER_IDENTITY,
  CRW_METADATA_VERSION,
  INTEGRATION_TARGETS,
  RECOMMENDATION_DECISIONS,
} from "./paths.js";
import type { ChannelRecommendationReport } from "./types.js";

export type ChannelRecommendationWorkerConfiguration = {
  enabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  proceedThreshold: number;
  monitorThreshold: number;
  recommendationDecisions: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedRecommendationReports: ChannelRecommendationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-17 hard boundaries — force-locked true. */
  neverCreateChannels: true;
  neverConfigurePlatformAccounts: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ418OrLater: true;
  neverCreateChannelsAutomatically: true;
  baseRecommendationsOnEvidence: true;
  preserveCompleteSourceTraceability: true;
  distinguishFactsFromAssumptions: true;
  explainEveryRecommendation: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION: ChannelRecommendationWorkerConfiguration =
  {
    enabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    proceedThreshold: 75,
    monitorThreshold: 50,
    recommendationDecisions: [...RECOMMENDATION_DECISIONS],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.workerId,
    workerName: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.workerName,
    factory: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.factory,
    department: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.department,
    role: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.role,
    reportingLine: [...CHANNEL_RECOMMENDATION_WORKER_IDENTITY.reportingLine],
    seedRecommendationReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverCreateChannels: true,
    neverConfigurePlatformAccounts: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ418OrLater: true,
    neverCreateChannelsAutomatically: true,
    baseRecommendationsOnEvidence: true,
    preserveCompleteSourceTraceability: true,
    distinguishFactsFromAssumptions: true,
    explainEveryRecommendation: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildChannelRecommendationWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ChannelRecommendationWorkerConfiguration> = {},
): ChannelRecommendationWorkerConfiguration {
  let file: Partial<ChannelRecommendationWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "channel-recommendation-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.CHANNEL_RECOMMENDATION_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.CHANNEL_RECOMMENDATION_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const mergeList = (key: "integrationTargets" | "recommendationDecisions") =>
    Array.from(
      new Set([
        ...DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    recommendationDecisions: mergeList("recommendationDecisions"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION.reportingLine),
    ],
    seedRecommendationReports: (
      overrides.seedRecommendationReports ??
      file.seedRecommendationReports ??
      []
    ).map((r) => lockRecommendationReport(r)),
    proceedThreshold:
      overrides.proceedThreshold ??
      file.proceedThreshold ??
      DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION.proceedThreshold,
    monitorThreshold:
      overrides.monitorThreshold ??
      file.monitorThreshold ??
      DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION.monitorThreshold,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverCreateChannels: true,
    neverConfigurePlatformAccounts: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ418OrLater: true,
    neverCreateChannelsAutomatically: true,
    baseRecommendationsOnEvidence: true,
    preserveCompleteSourceTraceability: true,
    distinguishFactsFromAssumptions: true,
    explainEveryRecommendation: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockRecommendationReport(
  report: ChannelRecommendationReport,
): ChannelRecommendationReport {
  return {
    ...report,
    proposedChannel: { ...report.proposedChannel },
    targetAudience: {
      ...report.targetAudience,
      audienceSegments: [...report.targetAudience.audienceSegments],
      geographyHints: [...report.targetAudience.geographyHints],
    },
    audiencePotential: {
      ...report.audiencePotential,
      evidenceRefs: [...report.audiencePotential.evidenceRefs],
    },
    revenuePotential: {
      ...report.revenuePotential,
      evidenceRefs: [...report.revenuePotential.evidenceRefs],
    },
    productionFeasibility: {
      ...report.productionFeasibility,
      evidenceRefs: [...report.productionFeasibility.evidenceRefs],
    },
    competitionAssessment: {
      ...report.competitionAssessment,
      evidenceRefs: [...report.competitionAssessment.evidenceRefs],
    },
    strategicFit: {
      ...report.strategicFit,
      evidenceRefs: [...report.strategicFit.evidenceRefs],
    },
    contentSustainability: {
      ...report.contentSustainability,
      evidenceRefs: [...report.contentSustainability.evidenceRefs],
    },
    riskAssessment: {
      ...report.riskAssessment,
      factors: [...report.riskAssessment.factors],
    },
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    rankedOpportunities: (report.rankedOpportunities ?? []).map((o) => ({ ...o })),
    sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || CRW_METADATA_VERSION,
    neverCreateChannelsAutomatically: true,
    neverCreateChannels: true,
    neverConfigurePlatformAccounts: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ418OrLater: true,
    baseRecommendationsOnEvidence: true,
    preserveCompleteSourceTraceability: true,
    distinguishFactsFromAssumptions: true,
    explainEveryRecommendation: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
