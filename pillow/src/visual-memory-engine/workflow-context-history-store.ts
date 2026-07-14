/** T1-08 — Workflow context history store. */

import type { WorkflowContextModel } from "../context-awareness-engine/types.js";

export class WorkflowContextHistoryStore {
  extractSafe(context: WorkflowContextModel) {
    return {
      contextId: context.contextId,
      currentScreenId: context.currentScreenId,
      currentRouteId: context.currentRouteId,
      currentWorkflowName: context.currentWorkflowName,
      currentWorkflowStage: context.currentWorkflowStage,
      currentUserTask: context.currentUserTask,
      contextState: context.contextState,
      currentInteractionMode: context.currentInteractionMode,
      activeFormIds: context.activeFormIds,
      activeModalOrDrawerId: context.activeModalOrDrawerId,
      confidence: context.confidence,
    };
  }
}
