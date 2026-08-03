import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  TPW_METADATA_VERSION,
  TOPIC_PLANNER_WORKER_IDENTITY,
} from "./paths.js";
import type { TopicPlan } from "./types.js";

export type TopicPlannerWorkerConfiguration = {
  enabled: boolean;
  planningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultDailyTopicCount: number;
  defaultEvergreenRatio: number;
  criticalConfidenceThreshold: number;
  highConfidenceThreshold: number;
  mediumConfidenceThreshold: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedPlans: TopicPlan[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-04 hard boundaries — force-locked true. */
  neverWriteScripts: true;
  neverGenerateVisuals: true;
  neverProduceVideos: true;
  neverPublishContent: true;
  neverBypassPillowGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ405OrLater: true;
  neverRequireGrandKingDailyPrompts: true;
  followEditorInChiefStrategy: true;
  useTrendResearchEvidence: true;
  preserveCompletePlanningTraceability: true;
  avoidDuplicateOrConflictingTopics: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_TOPIC_PLANNER_WORKER_CONFIGURATION: TopicPlannerWorkerConfiguration = {
  enabled: true,
  planningRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultDailyTopicCount: 3,
  defaultEvergreenRatio: 0.4,
  criticalConfidenceThreshold: 85,
  highConfidenceThreshold: 70,
  mediumConfidenceThreshold: 50,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: TOPIC_PLANNER_WORKER_IDENTITY.workerId,
  workerName: TOPIC_PLANNER_WORKER_IDENTITY.workerName,
  factory: TOPIC_PLANNER_WORKER_IDENTITY.factory,
  department: TOPIC_PLANNER_WORKER_IDENTITY.department,
  role: TOPIC_PLANNER_WORKER_IDENTITY.role,
  reportingLine: [...TOPIC_PLANNER_WORKER_IDENTITY.reportingLine],
  seedPlans: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverWriteScripts: true,
  neverGenerateVisuals: true,
  neverProduceVideos: true,
  neverPublishContent: true,
  neverBypassPillowGovernance: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ405OrLater: true,
  neverRequireGrandKingDailyPrompts: true,
  followEditorInChiefStrategy: true,
  useTrendResearchEvidence: true,
  preserveCompletePlanningTraceability: true,
  avoidDuplicateOrConflictingTopics: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildTopicPlannerWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TopicPlannerWorkerConfiguration> = {},
): TopicPlannerWorkerConfiguration {
  let file: Partial<TopicPlannerWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "topic-planner-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.TOPIC_PLANNER_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.TOPIC_PLANNER_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_TOPIC_PLANNER_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_TOPIC_PLANNER_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_TOPIC_PLANNER_WORKER_CONFIGURATION.reportingLine),
    ],
    seedPlans: (overrides.seedPlans ?? file.seedPlans ?? []).map((p) => lockPlan(p)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverWriteScripts: true,
    neverGenerateVisuals: true,
    neverProduceVideos: true,
    neverPublishContent: true,
    neverBypassPillowGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ405OrLater: true,
    neverRequireGrandKingDailyPrompts: true,
    followEditorInChiefStrategy: true,
    useTrendResearchEvidence: true,
    preserveCompletePlanningTraceability: true,
    avoidDuplicateOrConflictingTopics: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockPlan(plan: TopicPlan): TopicPlan {
  return {
    ...plan,
    selectedTopics: plan.selectedTopics.map((t) => ({ ...t })),
    rankedTopics: plan.rankedTopics.map((t) => ({ ...t })),
    trendReportIds: [...plan.trendReportIds],
    traceabilityRefs: [...plan.traceabilityRefs],
    preservedDecisions: plan.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: plan.metadataVersion || TPW_METADATA_VERSION,
    neverWriteScripts: true,
    neverGenerateVisuals: true,
    neverProduceVideos: true,
    neverPublishContent: true,
    neverBypassPillowGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ405OrLater: true,
    neverRequireGrandKingDailyPrompts: true,
    followEditorInChiefStrategy: true,
    useTrendResearchEvidence: true,
    preserveCompletePlanningTraceability: true,
    avoidDuplicateOrConflictingTopics: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
