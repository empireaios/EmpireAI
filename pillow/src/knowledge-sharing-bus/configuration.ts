import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { KNOWLEDGE_CATEGORIES } from "./paths.js";
import type { KnowledgeRecord } from "./types.js";

export type KnowledgeSharingBusConfiguration = {
  enabled: boolean;
  submissionRulesEnabled: boolean;
  classificationRulesEnabled: boolean;
  publicationRulesEnabled: boolean;
  subscriptionRulesEnabled: boolean;
  versioningRulesEnabled: boolean;
  archivalRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  knowledgeCategories: string[];
  minConfidenceToPublish: number;
  seedKnowledge: KnowledgeRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-23 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceExecutionMemory: true;
  neverReplaceDecisionMemory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveKnowledgeTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_KNOWLEDGE: KnowledgeRecord[] = [];

export const DEFAULT_KNOWLEDGE_SHARING_BUS_CONFIGURATION: KnowledgeSharingBusConfiguration = {
  enabled: true,
  submissionRulesEnabled: true,
  classificationRulesEnabled: true,
  publicationRulesEnabled: true,
  subscriptionRulesEnabled: true,
  versioningRulesEnabled: true,
  archivalRulesEnabled: true,
  validationRulesEnabled: true,
  knowledgeCategories: [...KNOWLEDGE_CATEGORIES],
  minConfidenceToPublish: 50,
  seedKnowledge: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceExecutionMemory: true,
  neverReplaceDecisionMemory: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveKnowledgeTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildKnowledgeSharingBusConfiguration(
  repositoryRoot?: string,
  overrides: Partial<KnowledgeSharingBusConfiguration> = {},
): KnowledgeSharingBusConfiguration {
  let file: Partial<KnowledgeSharingBusConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "knowledge-sharing-bus.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.KNOWLEDGE_SHARING_BUS_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.KNOWLEDGE_SHARING_BUS_RETRY_ATTEMPTS ?? "", 10);

  const mergedCategories = Array.from(
    new Set([
      ...DEFAULT_KNOWLEDGE_SHARING_BUS_CONFIGURATION.knowledgeCategories,
      ...(file.knowledgeCategories ?? []),
      ...(overrides.knowledgeCategories ?? []),
    ]),
  );

  return {
    ...DEFAULT_KNOWLEDGE_SHARING_BUS_CONFIGURATION,
    ...file,
    ...overrides,
    knowledgeCategories: mergedCategories,
    seedKnowledge: (overrides.seedKnowledge ?? file.seedKnowledge ?? []).map((r) => ({
      ...r,
      supportingEvidence: [...r.supportingEvidence],
      relatedPlaybooks: [...r.relatedPlaybooks],
      classificationLabels: [...r.classificationLabels],
      subscribers: [...r.subscribers],
      versionHistory: [...r.versionHistory],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceExecutionMemory: true,
    neverReplaceDecisionMemory: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveKnowledgeTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
