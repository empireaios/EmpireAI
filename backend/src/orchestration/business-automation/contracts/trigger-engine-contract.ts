/**
 * G5-02 — Trigger Engine contract (G5-00 §13.2 adapted).
 */

import type {
  AutomationTriggerGovernanceContext,
  CockpitTriggerStatusSnapshot,
  TriggerEvaluation,
  TriggerIntakeRequest,
} from "./trigger-types.js";

export type TriggerEvaluationContext = AutomationTriggerGovernanceContext & {
  correlationId: string;
  environment?: string;
};

export interface TriggerEngineContract {
  evaluateTriggers(context: TriggerEvaluationContext): Promise<TriggerEvaluation[]>;
  receiveTrigger(intake: TriggerIntakeRequest): Promise<TriggerEvaluation>;
  getCockpitTriggerStatus(workspaceId: string): CockpitTriggerStatusSnapshot;
}

export const G5_02_SCHEMA_VERSION = "g5-02-v1" as const;
