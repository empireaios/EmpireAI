/**
 * G7-06 — Optimization recommendation store.
 */

import type { OptimizationRecommendation, OptimizationStatus } from "../contracts/continuous-intelligence-types.js";
import { isValidOptimizationTransition } from "../contracts/continuous-intelligence-types.js";

const store = new Map<string, OptimizationRecommendation>();

export function resetOptimizationStoreForTests(): void {
  store.clear();
}

export function appendOptimizationRecommendation(rec: OptimizationRecommendation): void {
  store.set(rec.optimizationId, rec);
}

export function getOptimizationRecommendation(optimizationId: string): OptimizationRecommendation | undefined {
  return store.get(optimizationId);
}

export function listOptimizationRecommendations(): OptimizationRecommendation[] {
  return [...store.values()];
}

export function transitionOptimizationStatus(
  optimizationId: string,
  targetStatus: OptimizationStatus,
): OptimizationRecommendation {
  const rec = store.get(optimizationId);
  if (!rec) {
    throw new Error(`Optimization not found: ${optimizationId}`);
  }
  if (!isValidOptimizationTransition(rec.implementationStatus, targetStatus)) {
    throw new Error(`Invalid optimization transition: ${rec.implementationStatus} -> ${targetStatus}`);
  }
  const updated: OptimizationRecommendation = {
    ...rec,
    implementationStatus: targetStatus,
    updatedAt: new Date().toISOString(),
    governanceState: targetStatus === "completed" ? "pillow-completed" : rec.governanceState,
  };
  store.set(optimizationId, updated);
  return updated;
}
