/** T5-02 — Accessibility issue detection from T2 accessibility intelligence. */

import { randomUUID } from "node:crypto";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue, UxIssueCategory } from "./types.js";
import { normalizeSeverity } from "./severity-utils.js";
import { appendAuditLog } from "./audit-logging.js";

function mapAccessibilityCategory(category: string): UxIssueCategory {
  const lower = category.toLowerCase();
  if (lower.includes("readability")) return "readability_issue";
  if (lower.includes("feedback")) return "feedback_issue";
  return "accessibility_issue";
}

export class AccessibilityIssueDetector {
  detect(engines: AutonomousUxAuditEngineBundle): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];
    try {
      const accessibility = engines.accessibilityIntelligence?.getState();
      const record = accessibility?.latestRecord;
      if (!record) return issues;

      for (const finding of record.accessibilityFindings ?? []) {
        issues.push({
          issueId: randomUUID(),
          category: mapAccessibilityCategory(finding.findingCategory),
          description: finding.findingDescription,
          severity: normalizeSeverity(finding.severity),
          affectedComponentId: finding.affectedComponentId,
          affectedLayoutRegionId: finding.affectedLayoutRegionId,
          affectedNavigationNodeId: finding.affectedNavigationNodeId,
          evidenceReference: `accessibility:${finding.findingId}`,
          detectionConfidence: finding.detectionConfidence,
          sourceEngine: "PILLOW-AII-001",
        });
        appendAuditLog({
          event: "issue_detection",
          level: "info",
          details: `Accessibility issue: ${finding.findingDescription.slice(0, 80)}`,
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_accessibility",
        level: "warn",
        details: "Accessibility intelligence unavailable for audit",
      });
    }
    return issues;
  }
}
