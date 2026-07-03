/**
 * G7-08 — Grand King Self-Healing Operations service (self-healing manager).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import type { HealingActionRecord, SelfHealingOverview } from "../contracts/self-healing-types.js";
import {
  GRAND_KING_SELF_HEALING_OPERATIONS_VERSION,
  SELF_HEALING_DOMAIN_IDS,
} from "../contracts/self-healing-types.js";
import { recordSelfHealingEklsObservation } from "../ekls/self-healing-ekls-integration.js";
import { resolveSelfHealingDependencies } from "../registry/self-healing-registry-resolver.js";
import { appendHealingAction, getHealingAction, listHealingActions } from "./healing-action-store.js";
import { detectHealthDegradation, computeOverallHealth } from "./health-degradation-detector.js";
import { generateHealingRecommendations } from "./healing-recommendation-engine.js";
import { planSubsystemRecovery } from "./subsystem-recovery-planner.js";
import { executeHealingAction, pauseHealingAction } from "./automatic-recovery-coordinator.js";
import { coordinateProductionRollback } from "./production-rollback-coordinator.js";

let initialized = false;

export function resetSelfHealingStateForTests(): void {
  initialized = false;
}

export function initializeSelfHealingOperations(context: RegistryLoaderContext = {}): {
  healingActions: HealingActionRecord[];
  overview: SelfHealingOverview;
} {
  if (initialized) {
    return { healingActions: listHealingActions(), overview: getSelfHealingOverview(context) };
  }

  const recommendations = generateHealingRecommendations(context);
  const healingActions: HealingActionRecord[] = [];

  for (const rec of recommendations) {
    const plan = planSubsystemRecovery(rec, context);
    appendHealingAction(plan);
    healingActions.push(plan);

    if (plan.executionStatus === "recommended" && plan.confidenceScore >= 60) {
      try {
        executeHealingAction({
          healingId: plan.healingId,
          actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
          ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
          workspaceId: GRAND_KING_WORKSPACE_ID,
          pillowGovernance: true,
          context,
        });
      } catch {
        /* approval or dependency blocked — remains in queue */
      }
    }
  }

  recordSelfHealingEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    healingId: "learning",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "self_healing_learning_recorded",
    summary: "Self-healing learning baseline recorded",
    pillowGovernance: true,
  });

  initialized = true;
  return { healingActions: listHealingActions(), overview: getSelfHealingOverview(context) };
}

export function getSelfHealingOverview(context: RegistryLoaderContext = {}): SelfHealingOverview {
  const actions = listHealingActions();
  const degradations = detectHealthDegradation(context);
  return {
    frameworkVersion: GRAND_KING_SELF_HEALING_OPERATIONS_VERSION,
    domainCount: SELF_HEALING_DOMAIN_IDS.length,
    activeHealings: actions.filter((a) => a.executionStatus === "executing").length,
    completedHealings: actions.filter((a) => a.executionStatus === "completed").length,
    failedHealings: actions.filter((a) => a.executionStatus === "failed").length,
    overallHealth: computeOverallHealth(degradations),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    generatedAt: new Date().toISOString(),
  };
}

export function getSelfHealingStatus(context: RegistryLoaderContext = {}) {
  return {
    frameworkVersion: GRAND_KING_SELF_HEALING_OPERATIONS_VERSION,
    initialized,
    overview: getSelfHealingOverview(context),
    registryIds: resolveSelfHealingDependencies(context),
    programmeStatus: "self-healing-operations-established",
  };
}

export {
  getHealingAction,
  listHealingActions,
  executeHealingAction,
  pauseHealingAction,
  coordinateProductionRollback,
  generateHealingRecommendations,
};
