/** T5-02 — Navigation issue detection from T2 UX rules and observation. */

import { randomUUID } from "node:crypto";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue } from "./types.js";
import { normalizeSeverity } from "./severity-utils.js";
import { appendAuditLog } from "./audit-logging.js";

export class NavigationIssueDetector {
  detect(
    engines: AutonomousUxAuditEngineBundle,
    observation: ObservationRecord | null,
  ): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];

    try {
      const uxRules = engines.uxRuleEngine?.getState();
      for (const violation of uxRules?.latestReport?.violations ?? []) {
        if (
          violation.category !== "navigation" &&
          !violation.sourceNavigationNodeId
        ) {
          continue;
        }
        issues.push({
          issueId: randomUUID(),
          category: "navigation_issue",
          description: violation.violationDescription,
          severity: normalizeSeverity(violation.severity),
          affectedComponentId: violation.sourceComponentId,
          affectedLayoutRegionId: violation.sourceLayoutId,
          affectedNavigationNodeId: violation.sourceNavigationNodeId,
          evidenceReference: `ux-rule:${violation.violationId}`,
          detectionConfidence: 0.78,
          sourceEngine: "PILLOW-URE-001",
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_ux_rules_navigation",
        level: "warn",
        details: "UX rules unavailable for navigation audit",
      });
    }

    if (observation) {
      for (const change of observation.detectedStateChanges) {
        if (!change.startsWith("route:")) continue;
        issues.push({
          issueId: randomUUID(),
          category: "navigation_issue",
          description: `Navigation change detected: ${change.replace("route:", "")}`,
          severity: "medium",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: observation.sourceNavigationGraphId,
          evidenceReference: `observation:${observation.observationId}:route`,
          detectionConfidence: observation.confidenceScore,
          sourceEngine: "PILLOW-CSO-001",
        });
        appendAuditLog({
          event: "issue_detection",
          level: "info",
          details: `Navigation issue from observation ${observation.observationId}`,
        });
      }
    }

    return issues;
  }
}
