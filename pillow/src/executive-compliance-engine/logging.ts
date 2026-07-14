/** E5-04 — Immutable compliance evaluation logging. */

import type { ComplianceEvaluationLogEntry, ComplianceEvaluationResult } from "./types.js";

const logStore: ComplianceEvaluationLogEntry[] = [];

export function appendComplianceLog(entry: ComplianceEvaluationLogEntry): ComplianceEvaluationLogEntry {
  logStore.push({ ...entry });
  return entry;
}

export function getComplianceLogs(limit = 100): ComplianceEvaluationLogEntry[] {
  return logStore.slice(-limit);
}

export function getViolationHistory(limit = 50): ComplianceEvaluationLogEntry[] {
  return logStore
    .filter((e) => e.result === "VIOLATION" || e.result === "CRITICAL")
    .slice(-limit);
}

export function createLogEntry(input: {
  evaluationId: string;
  actor: string;
  action: string;
  actionType: string;
  policiesChecked: string[];
  result: ComplianceEvaluationResult;
  violations: string[];
  enforcementAction: string;
  reviewer?: string;
  explanation: string;
  executionContext: Record<string, unknown>;
}): ComplianceEvaluationLogEntry {
  return {
    evaluationId: input.evaluationId,
    timestamp: new Date().toISOString(),
    actor: input.actor,
    action: input.action,
    actionType: input.actionType,
    policiesChecked: input.policiesChecked,
    result: input.result,
    violations: input.violations,
    enforcementAction: input.enforcementAction,
    reviewer: input.reviewer ?? null,
    explanation: input.explanation,
    executionContext: input.executionContext,
  };
}

export function resetComplianceLogsForTesting(): void {
  logStore.length = 0;
}
