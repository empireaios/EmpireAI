/**
 * G7-06 — Optimization scheduler.
 */

import { randomUUID } from "node:crypto";
import type { OptimizationHistoryEntry, OptimizationRecommendation } from "../contracts/continuous-intelligence-types.js";
import { recordOptimizationEklsObservation } from "../ekls/continuous-intelligence-ekls-integration.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { transitionOptimizationStatus } from "./optimization-store.js";

const history: OptimizationHistoryEntry[] = [];

export function resetOptimizationSchedulerForTests(): void {
  history.length = 0;
}

export function scheduleOptimization(input: {
  recommendation: OptimizationRecommendation;
  actorId: string;
  ownerId: string;
}): OptimizationRecommendation {
  const scheduled = transitionOptimizationStatus(input.recommendation.optimizationId, "scheduled");
  appendHistory(scheduled.optimizationId, "scheduled", `Optimization scheduled: ${scheduled.recommendedAction}`);

  recordOptimizationEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    optimizationId: scheduled.optimizationId,
    ownerId: input.ownerId,
    kind: "optimization_scheduled",
    summary: `Optimization ${scheduled.optimizationId} scheduled`,
    pillowGovernance: true,
  });

  return scheduled;
}

export function completeOptimization(input: {
  optimizationId: string;
  actorId: string;
  ownerId: string;
}): OptimizationRecommendation {
  transitionOptimizationStatus(input.optimizationId, "executing");
  const completed = transitionOptimizationStatus(input.optimizationId, "completed");
  appendHistory(completed.optimizationId, "completed", `Optimization completed: ${completed.recommendedAction}`);

  recordOptimizationEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    optimizationId: completed.optimizationId,
    ownerId: input.ownerId,
    kind: "optimization_completed",
    summary: `Optimization ${completed.optimizationId} completed`,
    pillowGovernance: true,
  });

  return completed;
}

function appendHistory(optimizationId: string, status: OptimizationHistoryEntry["status"], summary: string): void {
  history.push({
    entryId: randomUUID(),
    optimizationId,
    status,
    summary,
    timestamp: new Date().toISOString(),
  });
}

export function listOptimizationHistory(): OptimizationHistoryEntry[] {
  return [...history];
}
