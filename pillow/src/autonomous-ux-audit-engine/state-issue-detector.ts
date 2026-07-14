/** T5-02 — Loading, empty and error state issue detection from T5-01 observation. */

import { randomUUID } from "node:crypto";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { DetectedUxIssue, UxIssueCategory } from "./types.js";
import { appendAuditLog } from "./audit-logging.js";

const STATE_CATEGORY_MAP: Record<string, UxIssueCategory> = {
  loading: "loading_state_issue",
  empty: "empty_state_issue",
  error: "error_state_issue",
};

export class StateIssueDetector {
  detect(observation: ObservationRecord | null): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];
    if (!observation) return issues;

    for (const state of observation.uiSurfaceStates) {
      const category = STATE_CATEGORY_MAP[state];
      if (!category) continue;
      issues.push({
        issueId: randomUUID(),
        category,
        description: `UI surface in ${state} state on ${observation.currentScreenId ?? "unknown screen"}`,
        severity: state === "error" ? "high" : state === "loading" ? "medium" : "low",
        affectedComponentId: null,
        affectedLayoutRegionId: observation.sourceLayoutId,
        affectedNavigationNodeId: observation.sourceNavigationGraphId,
        evidenceReference: `observation:${observation.observationId}:state:${state}`,
        detectionConfidence: observation.confidenceScore,
        sourceEngine: "PILLOW-CSO-001",
      });
      appendAuditLog({
        event: "issue_detection",
        level: "info",
        details: `State issue (${state}) on screen ${observation.currentScreenId ?? "unknown"}`,
      });
    }

    for (const change of observation.detectedStateChanges) {
      if (!change.startsWith("state_entered:")) continue;
      const state = change.replace("state_entered:", "");
      const category = STATE_CATEGORY_MAP[state];
      if (!category) continue;
      if (observation.uiSurfaceStates.includes(state as never)) continue;
      issues.push({
        issueId: randomUUID(),
        category,
        description: `State transition entered: ${state}`,
        severity: state === "error" ? "high" : "medium",
        affectedComponentId: null,
        affectedLayoutRegionId: observation.sourceLayoutId,
        affectedNavigationNodeId: observation.sourceNavigationGraphId,
        evidenceReference: `observation:${observation.observationId}:transition:${state}`,
        detectionConfidence: observation.confidenceScore,
        sourceEngine: "PILLOW-CSO-001",
      });
    }

    return issues;
  }
}
