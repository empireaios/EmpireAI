/**
 * G7-06 — Grand King Continuous Intelligence & Optimization service.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import type { OptimizationRecommendation } from "../contracts/continuous-intelligence-types.js";
import {
  GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION,
  OPTIMIZATION_DOMAIN_IDS,
} from "../contracts/continuous-intelligence-types.js";
import { recordOptimizationEklsObservation } from "../ekls/continuous-intelligence-ekls-integration.js";
import { validateContinuousIntelligencePillowGovernance } from "../governance/continuous-intelligence-pillow-governance.js";
import { resolveOptimizationDependencies } from "../registry/continuous-intelligence-registry-resolver.js";
import { generateOptimizationRecommendations } from "./optimization-engine.js";
import {
  getOptimizationRecommendation,
  listOptimizationRecommendations,
  transitionOptimizationStatus,
} from "./optimization-store.js";
import { scheduleOptimization, completeOptimization, listOptimizationHistory } from "./optimization-scheduler.js";
import { prioritiseOptimizationRecommendations, computeOptimizationRoi } from "./recommendation-prioritiser.js";
import { detectOptimizationOpportunities } from "./opportunity-detector.js";
import type { OptimizationOperationsOverview } from "../contracts/continuous-intelligence-types.js";

let initialized = false;
let cachedOpportunities = detectOptimizationOpportunities();

export function resetContinuousIntelligenceStateForTests(): void {
  initialized = false;
  cachedOpportunities = [];
}

export function initializeContinuousIntelligenceOptimization(context: RegistryLoaderContext = {}): {
  recommendations: OptimizationRecommendation[];
  overview: OptimizationOperationsOverview;
} {
  if (initialized) {
    return {
      recommendations: listOptimizationRecommendations(),
      overview: getOptimizationOperationsOverview(context),
    };
  }

  cachedOpportunities = detectOptimizationOpportunities(context);
  const recommendations = generateOptimizationRecommendations(context);

  for (const rec of recommendations) {
    recordOptimizationEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      optimizationId: rec.optimizationId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "optimization_detected",
      summary: `Optimization detected for ${rec.domainId}`,
      pillowGovernance: true,
    });
    recordOptimizationEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      optimizationId: rec.optimizationId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "optimization_recommended",
      summary: rec.recommendedAction,
      pillowGovernance: true,
    });
  }

  recordOptimizationEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    optimizationId: "learning",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "optimization_learning_recorded",
    summary: "Continuous intelligence learning baseline recorded",
    pillowGovernance: true,
  });

  initialized = true;
  return {
    recommendations,
    overview: getOptimizationOperationsOverview(context),
  };
}

export function getOptimizationOperationsOverview(context: RegistryLoaderContext = {}): OptimizationOperationsOverview {
  const recommendations = listOptimizationRecommendations();
  return {
    frameworkVersion: GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION,
    domainCount: OPTIMIZATION_DOMAIN_IDS.length,
    activeRecommendations: recommendations.filter((r) =>
      ["detected", "analysing", "recommended", "approved"].includes(r.implementationStatus),
    ).length,
    scheduledOptimizations: recommendations.filter((r) => r.implementationStatus === "scheduled").length,
    completedOptimizations: recommendations.filter((r) => r.implementationStatus === "completed").length,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    generatedAt: new Date().toISOString(),
  };
}

export function approveOptimization(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  optimizationId: string;
  pillowGovernance: true;
}): OptimizationRecommendation {
  const pillow = validateContinuousIntelligencePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "approve",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    throw new Error(pillow.reason);
  }

  const approved = transitionOptimizationStatus(input.optimizationId, "approved");
  return scheduleOptimization({
    recommendation: approved,
    actorId: input.actorId,
    ownerId: input.ownerId,
  });
}

export function executeOptimization(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  optimizationId: string;
  pillowGovernance: true;
}): OptimizationRecommendation {
  const pillow = validateContinuousIntelligencePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "execute",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    throw new Error(pillow.reason);
  }

  return completeOptimization({
    optimizationId: input.optimizationId,
    actorId: input.actorId,
    ownerId: input.ownerId,
  });
}

export function getOptimizationStatus(context: RegistryLoaderContext = {}) {
  const deps = resolveOptimizationDependencies(context);
  return {
    frameworkVersion: GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION,
    initialized,
    overview: getOptimizationOperationsOverview(context),
    registryIds: deps,
    programmeStatus: "continuous-intelligence-optimization-established",
  };
}

export {
  getOptimizationRecommendation,
  listOptimizationRecommendations,
  listOptimizationHistory,
  detectOptimizationOpportunities,
  prioritiseOptimizationRecommendations,
  computeOptimizationRoi,
  generateOptimizationRecommendations,
};
