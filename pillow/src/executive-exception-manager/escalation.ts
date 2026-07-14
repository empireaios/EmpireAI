/** E5-08 — Exception escalation workflows. */

import type { EscalationWorkflowEntry, ExceptionEscalationLevel, ExceptionSeverityLevel } from "./types.js";

const SEVERITY_ESCALATION: Record<ExceptionSeverityLevel, ExceptionEscalationLevel> = {
  low: "level_1_supervisor",
  medium: "level_2_ecc",
  high: "level_3_governance",
  critical: "executive_review",
  emergency: "grand_king_review",
};

const ESCALATION_ASSIGNEE: Record<ExceptionEscalationLevel, string> = {
  level_1_supervisor: "Supervisor",
  level_2_ecc: "ECC",
  level_3_governance: "Governance Executive",
  executive_review: "Executive Council",
  grand_king_review: "Grand King",
};

export function resolveEscalationLevel(severity: ExceptionSeverityLevel): ExceptionEscalationLevel {
  return SEVERITY_ESCALATION[severity];
}

export function buildEscalationWorkflow(input: {
  exceptionId: string;
  title: string;
  severity: ExceptionSeverityLevel;
  reason: string;
}): EscalationWorkflowEntry {
  const level = resolveEscalationLevel(input.severity);
  return {
    escalationId: `esc-${input.exceptionId}`,
    exceptionId: input.exceptionId,
    level,
    title: `Escalation: ${input.title}`,
    assignedTo: ESCALATION_ASSIGNEE[level],
    reason: input.reason,
    status: "pending",
    timestamp: new Date().toISOString(),
  };
}

export function buildEscalationWorkflows(
  records: Array<{ exceptionId: string; exceptionTitle: string; riskLevel: string; reason: string; currentStatus: string }>,
): EscalationWorkflowEntry[] {
  return records
    .filter((r) => r.currentStatus === "pending_approval" || r.currentStatus === "active")
    .map((r) =>
      buildEscalationWorkflow({
        exceptionId: r.exceptionId,
        title: r.exceptionTitle,
        severity: (r.riskLevel as ExceptionSeverityLevel) || "medium",
        reason: r.reason,
      }),
    );
}
