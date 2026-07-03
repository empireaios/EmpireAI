/**
 * G5-02 — G3-10 executive decision gate consumer.
 */

import { loadExecutiveIntelligenceOrchestratorViewForWorkspace } from "../../../domain/services/executive-intelligence-orchestrator-views.js";
import {
  DECISION_GATE_ELIGIBLE,
  DECISION_GATE_HELD,
  DECISION_GATE_STOP,
  type DecisionGateRecommendation,
} from "../contracts/trigger-types.js";
import { evaluateRegistryFilterExpression } from "./trigger-filter-evaluator.js";

export type DecisionGateResult = {
  passed: boolean;
  held: boolean;
  stopped: boolean;
  finalRecommendation: DecisionGateRecommendation;
  decisionReference: string;
  consumerEligible: boolean;
  reason: string;
  filterPassed: boolean;
};

export function classifyDecisionRecommendation(recommendation: string): {
  eligible: boolean;
  held: boolean;
  stopped: boolean;
} {
  if ((DECISION_GATE_ELIGIBLE as readonly string[]).includes(recommendation)) {
    return { eligible: true, held: false, stopped: false };
  }
  if ((DECISION_GATE_STOP as readonly string[]).includes(recommendation)) {
    return { eligible: false, held: false, stopped: true };
  }
  if ((DECISION_GATE_HELD as readonly string[]).includes(recommendation)) {
    return { eligible: false, held: true, stopped: false };
  }
  return { eligible: false, held: true, stopped: false };
}

export function evaluateExecutiveDecisionGate(input: {
  workspaceId: string;
  filterExpression?: string;
}): DecisionGateResult {
  const view = loadExecutiveIntelligenceOrchestratorViewForWorkspace(input.workspaceId);
  const decision = view.unifiedService.decisionSnapshot;
  const automationDelivery = view.unifiedService.consumerDeliveries.find(
    (delivery) => delivery.consumerId === "business-automation",
  );

  const classification = classifyDecisionRecommendation(decision.finalRecommendation);
  const filterPassed = evaluateRegistryFilterExpression(input.filterExpression, {
    finalRecommendation: decision.finalRecommendation,
    decisionConfidence: decision.decisionConfidence,
  });

  const consumerEligible =
    automationDelivery?.recommendedAction.includes("Eligible") ?? classification.eligible;

  const passed = classification.eligible && filterPassed && consumerEligible;

  let reason: string;
  if (classification.stopped) {
    reason = `Executive decision STOP — automation blocked`;
  } else if (classification.held) {
    reason = `Executive decision ${decision.finalRecommendation} — automation held`;
  } else if (!filterPassed) {
    reason = `Registry filterExpression rejected decision ${decision.finalRecommendation}`;
  } else if (!consumerEligible) {
    reason = automationDelivery?.recommendedAction ?? "G3-10 business-automation consumer not eligible";
  } else {
    reason = `Decision gate passed — ${decision.finalRecommendation}`;
  }

  return {
    passed,
    held: classification.held || (!passed && !classification.stopped),
    stopped: classification.stopped,
    finalRecommendation: decision.finalRecommendation,
    decisionReference: `g3-10:${input.workspaceId}:${view.unifiedService.computedAt}`,
    consumerEligible,
    reason,
    filterPassed,
  };
}
