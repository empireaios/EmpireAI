/** T5-02 — Visual consistency issue detection from T2 visual consistency. */

import { randomUUID } from "node:crypto";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue, UxIssueCategory } from "./types.js";
import { normalizeSeverity } from "./severity-utils.js";
import { appendAuditLog } from "./audit-logging.js";

function mapConsistencyCategory(category: string): UxIssueCategory {
  const lower = category.toLowerCase();
  if (lower.includes("spacing")) return "spacing_issue";
  if (lower.includes("alignment")) return "alignment_issue";
  if (lower.includes("hierarchy")) return "hierarchy_issue";
  if (lower.includes("readability")) return "readability_issue";
  return "visual_consistency_issue";
}

export class VisualConsistencyIssueDetector {
  detect(engines: AutonomousUxAuditEngineBundle): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];
    try {
      const consistency = engines.visualConsistency?.getState();
      const record = consistency?.latestRecord;
      if (!record) return issues;

      for (const finding of record.consistencyFindings ?? []) {
        issues.push({
          issueId: randomUUID(),
          category: mapConsistencyCategory(finding.findingCategory),
          description: finding.findingDescription,
          severity: normalizeSeverity(finding.severity),
          affectedComponentId: finding.affectedComponentId,
          affectedLayoutRegionId: finding.affectedLayoutRegionId,
          affectedNavigationNodeId: finding.affectedNavigationNodeId,
          evidenceReference: `consistency:${finding.findingId}`,
          detectionConfidence: finding.detectionConfidence,
          sourceEngine: "PILLOW-VCE-001",
        });
        appendAuditLog({
          event: "issue_detection",
          level: "info",
          details: `Consistency issue: ${finding.findingDescription.slice(0, 80)}`,
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_consistency",
        level: "warn",
        details: "Visual consistency unavailable for audit",
      });
    }
    return issues;
  }
}
