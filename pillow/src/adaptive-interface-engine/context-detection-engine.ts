/** T5-06 — Current workflow and operational context detection. */

import { appendAdaptiveLog } from "./adaptive-logging.js";
import type { AdaptiveInterfaceEngineBundle } from "./types.js";

export type DetectedContext = {
  workflowContext: string;
  operationalContext: string;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  confidenceScore: number;
  evidenceReferences: string[];
};

export class ContextDetectionEngine {
  detect(engines: AdaptiveInterfaceEngineBundle): DetectedContext {
    let workflowContext = "General workspace activity";
    let operationalContext = "Standard operational mode";
    let currentScreenId: string | null = null;
    let currentRouteOrViewId: string | null = null;
    let confidenceScore = 0.5;
    const evidenceReferences: string[] = [];

    try {
      const context = engines.contextAwareness?.getState();
      const latest = context?.latestContext;
      if (latest) {
        workflowContext = [
          latest.currentWorkflowName ?? "unknown workflow",
          latest.currentWorkflowStage ? `stage: ${latest.currentWorkflowStage}` : null,
          latest.currentUserTask ? `task: ${latest.currentUserTask}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        operationalContext = `${latest.currentInteractionMode} · ${latest.contextState}`;
        currentScreenId = latest.currentScreenId;
        currentRouteOrViewId = latest.currentRouteId ?? latest.currentViewId;
        confidenceScore = latest.confidence;
        evidenceReferences.push(`context:${latest.contextId}`);
      }
    } catch {
      /* context awareness unavailable */
    }

    try {
      const cso = engines.continuousScreenObservation?.getState();
      const observation = cso?.latestObservation ?? cso?.latestReport?.observation;
      if (observation) {
        currentScreenId = currentScreenId ?? observation.currentScreenId;
        currentRouteOrViewId =
          currentRouteOrViewId ?? observation.currentRouteOrViewId;
        if (observation.uiSurfaceStates.includes("loading")) {
          operationalContext = "Waiting/loading operational state";
        }
        evidenceReferences.push(`observation:${observation.observationId}`);
        confidenceScore = Math.max(confidenceScore, observation.confidenceScore);
      }
    } catch {
      /* observation unavailable */
    }

    appendAdaptiveLog({
      event: "context_detection",
      level: "info",
      details: `Workflow: ${workflowContext.slice(0, 80)}`,
    });

    return {
      workflowContext,
      operationalContext,
      currentScreenId,
      currentRouteOrViewId,
      confidenceScore,
      evidenceReferences,
    };
  }
}
