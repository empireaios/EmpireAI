/** T5-02 — Layout issue detection from T2 layout evaluation. */

import { randomUUID } from "node:crypto";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue, UxIssueCategory } from "./types.js";
import { normalizeSeverity } from "./severity-utils.js";
import { appendAuditLog } from "./audit-logging.js";

function mapLayoutCategory(category: string): UxIssueCategory {
  const lower = category.toLowerCase();
  if (lower.includes("spacing")) return "spacing_issue";
  if (lower.includes("alignment")) return "alignment_issue";
  if (lower.includes("hierarchy")) return "hierarchy_issue";
  if (lower.includes("readability")) return "readability_issue";
  return "layout_issue";
}

export class LayoutIssueDetector {
  detect(engines: AutonomousUxAuditEngineBundle): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];
    try {
      const evaluation = engines.layoutEvaluation?.getState();
      const model = evaluation?.latestReport?.model;
      if (!model) return issues;

      for (const weakness of model.layoutWeaknesses ?? []) {
        issues.push({
          issueId: randomUUID(),
          category: mapLayoutCategory(weakness.category),
          description: weakness.description,
          severity: normalizeSeverity(weakness.severity),
          affectedComponentId: null,
          affectedLayoutRegionId: weakness.evidenceRef,
          affectedNavigationNodeId: null,
          evidenceReference: `layout-evaluation:${weakness.findingId}`,
          detectionConfidence: weakness.confidence,
          sourceEngine: "PILLOW-LEV-001",
        });
        appendAuditLog({
          event: "issue_detection",
          level: "info",
          details: `Layout issue: ${weakness.description.slice(0, 80)}`,
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_layout_evaluation",
        level: "warn",
        details: "Layout evaluation unavailable for audit",
      });
    }
    return issues;
  }
}
