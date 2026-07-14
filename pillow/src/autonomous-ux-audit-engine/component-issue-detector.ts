/** T5-02 — Component issue detection from T2 UX rules and design system. */

import { randomUUID } from "node:crypto";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue } from "./types.js";
import { normalizeSeverity } from "./severity-utils.js";
import { appendAuditLog } from "./audit-logging.js";

export class ComponentIssueDetector {
  detect(engines: AutonomousUxAuditEngineBundle): DetectedUxIssue[] {
    const issues: DetectedUxIssue[] = [];

    try {
      const uxRules = engines.uxRuleEngine?.getState();
      for (const violation of uxRules?.latestReport?.violations ?? []) {
        if (!violation.sourceComponentId) continue;
        issues.push({
          issueId: randomUUID(),
          category: "component_issue",
          description: violation.violationDescription,
          severity: normalizeSeverity(violation.severity),
          affectedComponentId: violation.sourceComponentId,
          affectedLayoutRegionId: violation.sourceLayoutId,
          affectedNavigationNodeId: violation.sourceNavigationNodeId,
          evidenceReference: `ux-rule:${violation.violationId}`,
          detectionConfidence: 0.75,
          sourceEngine: "PILLOW-URE-001",
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_ux_rules",
        level: "warn",
        details: "UX rule engine unavailable for audit",
      });
    }

    try {
      const designSystem = engines.designSystemIntelligence?.getState();
      for (const deviation of designSystem?.latestReport?.validation?.deviations ?? []) {
        if (!deviation.componentId) continue;
        issues.push({
          issueId: randomUUID(),
          category: "component_issue",
          description: deviation.description,
          severity: normalizeSeverity(deviation.severity),
          affectedComponentId: deviation.componentId,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          evidenceReference: `design-system:${deviation.deviationId}`,
          detectionConfidence: 0.7,
          sourceEngine: "PILLOW-DSI-001",
        });
        appendAuditLog({
          event: "issue_detection",
          level: "info",
          details: `Component issue: ${deviation.description.slice(0, 80)}`,
        });
      }
    } catch {
      appendAuditLog({
        event: "partial_t2_design_system",
        level: "warn",
        details: "Design system intelligence unavailable for audit",
      });
    }

    return issues;
  }
}
