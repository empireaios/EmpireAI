/** X2-17 — Lifecycle Transition Engine. */

import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type { LifecycleRecord, LifecycleStage, LifecycleStatus } from "./types.js";

export class LifecycleTransitionEngine {
  suggestNextStage(
    record: LifecycleRecord,
    config: CompanyLifecycleManagerConfiguration,
  ): {
    nextStage: LifecycleStage | null;
    lifecycleStatus: LifecycleStatus;
    transitionRecommendation: string;
    requiresApproval: boolean;
  } {
    if (!config.lifecycleTransitionRulesEnabled) {
      return {
        nextStage: null,
        lifecycleStatus: "stable",
        transitionRecommendation: "Transition rules disabled — remain on current stage",
        requiresApproval: true,
      };
    }

    const score = record.maturityScore;
    const stage = record.currentLifecycleStage;

    if (
      stage === "launch" &&
      score >= config.launchToGrowthMaturityThreshold
    ) {
      return {
        nextStage: "growth",
        lifecycleStatus: "transition_recommended",
        transitionRecommendation: "Recommend transition launch → growth (approval required)",
        requiresApproval: config.requireApprovalForLifecycleTransitions,
      };
    }
    if (
      stage === "growth" &&
      score >= config.growthToMatureMaturityThreshold
    ) {
      return {
        nextStage: "mature",
        lifecycleStatus: "transition_recommended",
        transitionRecommendation: "Recommend transition growth → mature (approval required)",
        requiresApproval: config.requireApprovalForLifecycleTransitions,
      };
    }
    if (
      stage === "mature" &&
      config.retirementPoliciesEnabled &&
      score <= config.matureToRetirementMaturityThreshold
    ) {
      return {
        nextStage: "retirement",
        lifecycleStatus: "transition_recommended",
        transitionRecommendation: "Recommend transition mature → retirement (approval required)",
        requiresApproval: true,
      };
    }
    if (stage === "retirement") {
      return {
        nextStage: null,
        lifecycleStatus: "retired",
        transitionRecommendation: "Company in retirement — no further stage transition",
        requiresApproval: true,
      };
    }

    return {
      nextStage: null,
      lifecycleStatus: "stable",
      transitionRecommendation: `Remain in ${stage} — maturity score ${score}`,
      requiresApproval: false,
    };
  }

  /** Records a recommended (not auto-executed) transition intent. */
  applyRecommendedTransition(
    record: LifecycleRecord,
    nextStage: LifecycleStage,
    recommendation: string,
    requiresApproval: boolean,
  ): LifecycleRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      previousLifecycleStage: record.currentLifecycleStage,
      currentLifecycleStage: nextStage,
      transitionRecommendation: recommendation,
      lifecycleStatus: "transition_pending",
      requiresApproval,
      autoTransitionBlocked: true,
    };
  }
}
