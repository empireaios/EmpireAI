/**
 * G8-06 — Cockpit readiness backend contracts.
 */

import type { ReadinessResult } from "../contracts/readiness-types.js";
import {
  evaluateReadinessForAutomation,
  evaluateReadinessForProvider,
  evaluateReadinessForWorkflow,
  evaluateReadinessOverview,
  getReadinessBlockers,
  getReadinessRecommendations,
} from "../services/operational-readiness-service.js";

export type CockpitReadinessSummary = {
  overallReadinessScore: number;
  overallReadinessLevel: string;
  providerReadiness: Array<{ providerId: string; readinessLevel: string; readinessScore: number }>;
  workflowReadiness: Array<{ workflowId: string; canExecute: boolean; readinessLevel: string }>;
  automationReadiness: Array<{ automationId: string; canExecute: boolean; readinessLevel: string }>;
  blockedActions: string[];
  nextRequiredAction: string;
  correlationId: string;
  pillowGovernanceState: "pillow-governed";
};

const DEFAULT_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  pillowGovernance: true as const,
};

export function buildCockpitReadinessSummary(workspaceId: string): CockpitReadinessSummary {
  const overview = evaluateReadinessOverview({ ...DEFAULT_ACTOR, workspaceId });
  const blockers = getReadinessBlockers({ ...DEFAULT_ACTOR, workspaceId });
  const recommendations = getReadinessRecommendations({ ...DEFAULT_ACTOR, workspaceId });

  const providerReadiness = overview.result.requiredProviders.map((providerId) => {
    const providerResult = evaluateReadinessForProvider({ ...DEFAULT_ACTOR, workspaceId, providerId });
    return {
      providerId,
      readinessLevel: providerResult.result.readinessLevel,
      readinessScore: providerResult.result.readinessScore,
    };
  });

  return {
    overallReadinessScore: overview.result.readinessScore,
    overallReadinessLevel: overview.result.readinessLevel,
    providerReadiness,
    workflowReadiness: [],
    automationReadiness: [],
    blockedActions: blockers.blockers.map((b) => b.message),
    nextRequiredAction: recommendations.nextRequiredAction,
    correlationId: overview.result.correlationId,
    pillowGovernanceState: "pillow-governed",
  };
}

export function buildCockpitReadinessDetail(result: ReadinessResult) {
  return {
    readinessScore: result.readinessScore,
    readinessLevel: result.readinessLevel,
    requiredProviders: result.requiredProviders,
    connectedProviders: result.connectedProviders,
    missingProviders: result.missingProviders,
    blockingIssues: result.blockingIssues,
    recommendedActions: result.recommendedActions,
    warnings: result.warnings,
    evidence: result.evidence,
    lastEvaluatedAt: result.lastEvaluatedAt,
    pillowGovernanceState: "pillow-governed" as const,
  };
}

export function buildCockpitWorkflowReadiness(workspaceId: string, workflowId: string) {
  const evaluation = evaluateReadinessForWorkflow({ ...DEFAULT_ACTOR, workspaceId, workflowId });
  return {
    workflowId,
    canExecute: evaluation.canExecute,
    missingConnection: evaluation.missingConnection,
    blockingAuthorization: evaluation.blockingAuthorization,
    nextAction: evaluation.nextAction,
    result: buildCockpitReadinessDetail(evaluation.result),
  };
}

export function buildCockpitAutomationReadiness(workspaceId: string, automationId: string) {
  const evaluation = evaluateReadinessForAutomation({ ...DEFAULT_ACTOR, workspaceId, automationId });
  return {
    automationId,
    canExecute: evaluation.canExecute,
    missingConnection: evaluation.missingConnection,
    blockingAuthorization: evaluation.blockingAuthorization,
    nextAction: evaluation.nextAction,
    result: buildCockpitReadinessDetail(evaluation.result),
  };
}
