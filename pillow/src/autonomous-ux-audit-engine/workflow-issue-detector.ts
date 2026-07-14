/** T5-02 — Workflow issue detection from T2 workflow optimization. */

import { randomUUID } from "node:crypto";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue } from "./types.js";
import { normalizeSeverity } from "./severity-utils.js";
import { appendAuditLog } from "./audit-logging.js";

export class WorkflowIssueDetector {
  detect(engines: AutonomousUxAuditEngineBundle): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];
    try {
      const workflow = engines.workflowOptimization?.getState();
      const record = workflow?.latestRecord;
      if (!record) return issues;

      for (const friction of record.detectedFrictionPoints ?? []) {
        issues.push({
          issueId: randomUUID(),
          category: "workflow_issue",
          description: friction.description,
          severity: normalizeSeverity(friction.severity),
          affectedComponentId: friction.affectedComponents[0] ?? null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: friction.affectedNavigationNodes[0] ?? null,
          evidenceReference: `workflow:${friction.frictionId}`,
          detectionConfidence: friction.confidence,
          sourceEngine: "PILLOW-WFO-001",
        });
        appendAuditLog({
          event: "issue_detection",
          level: "info",
          details: `Workflow friction: ${friction.description.slice(0, 80)}`,
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_workflow",
        level: "warn",
        details: "Workflow optimization unavailable for audit",
      });
    }
    return issues;
  }
}
