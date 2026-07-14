/** T1-07 — Workflow context change detection. */

import type { ContextChangeSummary, ContextState, InteractionMode, WorkflowContextModel } from "./types.js";

export function detectContextChanges(
  previous: WorkflowContextModel | null,
  current: WorkflowContextModel,
): ContextChangeSummary {
  return {
    hasChanges: previous === null || previous.contextId !== current.contextId
      ? true
      : previous.contextState !== current.contextState ||
        previous.currentInteractionMode !== current.currentInteractionMode ||
        previous.currentScreenId !== current.currentScreenId ||
        previous.currentUserTask !== current.currentUserTask ||
        previous.currentWorkflowStage !== current.currentWorkflowStage,
    screenChanged: previous !== null && previous.currentScreenId !== current.currentScreenId,
    workflowChanged: previous !== null && previous.currentWorkflowName !== current.currentWorkflowName,
    stageChanged: previous !== null && previous.currentWorkflowStage !== current.currentWorkflowStage,
    taskChanged: previous !== null && previous.currentUserTask !== current.currentUserTask,
    modeChanged: previous !== null && previous.currentInteractionMode !== current.currentInteractionMode,
    stateChanged: previous !== null && previous.contextState !== current.contextState,
    previousContextState: previous?.contextState ?? null,
    currentContextState: current.contextState,
    previousInteractionMode: previous?.currentInteractionMode ?? null,
    currentInteractionMode: current.currentInteractionMode,
  };
}
