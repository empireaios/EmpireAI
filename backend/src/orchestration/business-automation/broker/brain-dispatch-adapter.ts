/**
 * G5-04 — Brain dispatch adapter (Execution Broker → Brain Orchestrator).
 * Wired from createBrain() to avoid circular imports.
 */

import type {
  OrchestratorDispatchRequest,
  OrchestratorDispatchResult,
} from "../../../brain/types.js";

export type BrainDispatchFn = (
  request: OrchestratorDispatchRequest,
) => Promise<OrchestratorDispatchResult>;

let brainDispatchFn: BrainDispatchFn | undefined;

export function setAutomationBrainDispatch(fn: BrainDispatchFn): void {
  brainDispatchFn = fn;
}

export function clearAutomationBrainDispatchForTests(): void {
  brainDispatchFn = undefined;
}

export async function dispatchThroughBrain(
  request: OrchestratorDispatchRequest,
): Promise<OrchestratorDispatchResult> {
  if (!brainDispatchFn) {
    throw new Error(
      "Brain dispatch adapter not wired — Execution Broker requires Brain Orchestrator",
    );
  }
  return brainDispatchFn(request);
}
