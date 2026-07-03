/**
 * G5-08 — EKLS Outcome service (Brain tool handlers).
 */

import type { AutomationLearningSearchResult } from "../contracts/ekls-outcome-types.js";
import { getEklsOutcomeIntegration } from "../outcome/ekls-outcome-integration.js";
import { resolveOutcomePolicy } from "../outcome/outcome-policy-resolver.js";

export function publishAutomationOutcomeLearning(input: {
  executionId: string;
  actorId: string;
  workspaceId: string;
}) {
  return {
    published: false as const,
    reason: "Brain publishes outcomes on terminal workflow states — use orchestrator completion path",
    executionId: input.executionId,
  };
}

export function getAutomationLearningRecord(executionId: string) {
  const record = getEklsOutcomeIntegration().getLearningByExecution(executionId);
  if (!record) return { found: false as const };
  return { found: true as const, record };
}

export function searchAutomationLearning(input: {
  workspaceId: string;
  actorId: string;
  workflowId?: string;
  executionId?: string;
}): AutomationLearningSearchResult {
  return getEklsOutcomeIntegration().searchLearning(input);
}

export function getRelatedAutomationExecutions(executionId: string) {
  const related = getEklsOutcomeIntegration().getRelatedExecutions(executionId);
  return {
    executionId,
    relatedCount: related.length,
    relatedExecutions: related.map((record) => ({
      learningId: record.learningId,
      executionId: record.executionId,
      outcome: record.outcome,
      timestamp: record.timestamp,
    })),
  };
}

export function previewOutcomePolicy(input: {
  workflowId: string;
  policyRegistryId?: string;
}) {
  return resolveOutcomePolicy(input);
}
