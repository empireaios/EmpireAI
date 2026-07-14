/** T1-09 — Map workflow context into session continuity. */

import type { WorkflowContextModel } from "../context-awareness-engine/types.js";

export class WorkflowContinuityMapper {
  map(workflow: WorkflowContextModel | null) {
    if (!workflow) {
      return {
        workflowContextId: null,
        workflowStage: null,
        activeComponentIds: [] as string[],
        activeLayoutRegionIds: [] as string[],
        activeModalDrawerTabPanelIds: [] as string[],
        confidence: 0.5,
      };
    }

    const panelIds = [
      ...workflow.activeFormIds,
      ...(workflow.activeModalOrDrawerId ? [workflow.activeModalOrDrawerId] : []),
    ];

    return {
      workflowContextId: workflow.contextId,
      workflowStage: workflow.currentWorkflowStage,
      activeComponentIds: workflow.activeComponentIds,
      activeLayoutRegionIds: workflow.activeLayoutRegionIds,
      activeModalDrawerTabPanelIds: panelIds,
      confidence: workflow.confidence,
    };
  }
}
