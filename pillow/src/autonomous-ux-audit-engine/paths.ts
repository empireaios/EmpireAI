/** T5-02 — Autonomous UX Audit paths and constants. */

export const AUTONOMOUS_UX_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_UX_AUDIT_SYSTEM.md";

export const AUDIT_METADATA_VERSION = "AUA-001-v1";

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "auditing",
  "detecting_issues",
  "validating",
  "recording",
  "paused",
  "stopped",
  "failed",
] as const;

export const AUDIT_STATUSES = [
  "recorded",
  "partial",
  "skipped",
  "failed",
  "validated",
] as const;

export const UX_ISSUE_CATEGORIES = [
  "layout_issue",
  "component_issue",
  "navigation_issue",
  "workflow_issue",
  "accessibility_issue",
  "visual_consistency_issue",
  "loading_state_issue",
  "empty_state_issue",
  "error_state_issue",
  "readability_issue",
  "hierarchy_issue",
  "spacing_issue",
  "alignment_issue",
  "feedback_issue",
] as const;

export const ISSUE_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;

/**
 * Mission 006 — Grand King UX defect classes (parallel to ISSUE_SEVERITIES).
 * Class 1 = operational blockers → fix immediately (maps roughly to critical/high).
 * Class 2 = important UX → queue alongside commercial track.
 * Class 3 = polish → backlog; do not delay first-dollar progression.
 */
export const GRAND_KING_UX_DEFECT_CLASSES = [
  "CLASS_1_OPERATIONAL_BLOCKER",
  "CLASS_2_IMPORTANT_UX",
  "CLASS_3_UX_POLISH",
] as const;

export const GRAND_KING_UX_CLASS_RULES = {
  CLASS_1_OPERATIONAL_BLOCKER:
    "FIX IMMEDIATELY — prevents Grand King from operating/testing EmpireAI.",
  CLASS_2_IMPORTANT_UX:
    "Queue and improve alongside commercial progression; do not automatically stop commerce.",
  CLASS_3_UX_POLISH:
    "Record in backlog; do not delay first-dollar progression.",
} as const;

/** Map AUA severity → Grand King UX class for triage. */
export function mapIssueSeverityToGrandKingUxClass(
  severity: (typeof ISSUE_SEVERITIES)[number],
): (typeof GRAND_KING_UX_DEFECT_CLASSES)[number] {
  if (severity === "critical" || severity === "high") {
    return "CLASS_1_OPERATIONAL_BLOCKER";
  }
  if (severity === "medium") return "CLASS_2_IMPORTANT_UX";
  return "CLASS_3_UX_POLISH";
}
