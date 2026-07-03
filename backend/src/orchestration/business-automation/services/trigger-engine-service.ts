/**
 * G5-02 — Trigger Engine service (Brain tool handlers).
 */

import type {
  CockpitTriggerStatusSnapshot,
  TriggerEvaluation,
  TriggerIntakeRequest,
} from "../contracts/trigger-types.js";
import { getTriggerEngine } from "../triggers/trigger-engine.js";

export async function evaluateAutomationTriggers(input: {
  workspaceId: string;
  actorId: string;
  correlationId: string;
  killSwitchActive?: boolean;
}): Promise<TriggerEvaluation[]> {
  return getTriggerEngine().evaluateTriggers({
    pillowGovernance: true,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    correlationId: input.correlationId,
    killSwitchActive: input.killSwitchActive,
  });
}

export async function receiveAutomationTrigger(
  intake: TriggerIntakeRequest,
): Promise<TriggerEvaluation> {
  return getTriggerEngine().receiveTrigger(intake);
}

export function getAutomationTriggerStatus(workspaceId: string): CockpitTriggerStatusSnapshot {
  return getTriggerEngine().getCockpitTriggerStatus(workspaceId);
}
