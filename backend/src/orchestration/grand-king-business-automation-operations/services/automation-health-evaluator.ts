/**
 * G7-03 — Automation health evaluator.
 */

import type { AutomationOperation, AutomationOperationHealthSummary } from "../contracts/automation-operations-types.js";
import { validateAutomationReadiness } from "./automation-readiness-validator.js";

export function evaluateAutomationOperationHealth(
  operation: AutomationOperation,
  context: Record<string, unknown> = {},
): AutomationOperationHealthSummary {
  const readiness = validateAutomationReadiness(context);
  let score = 100;
  if (!readiness.ready) score -= 30;
  if (operation.executionStatus === "blocked") score = 0;
  if (operation.executionStatus === "failed") score = Math.min(score, 20);
  if (operation.executionStatus === "approval_pending") score = Math.min(score, 60);
  if (operation.executionStatus === "recovering") score = Math.min(score, 50);
  if (process.env.AUTOMATION_OPERATION_DEGRADED === "true") score = Math.min(score, 40);

  let healthStatus: AutomationOperationHealthSummary["healthStatus"] = "healthy";
  if (score < 40) healthStatus = "unhealthy";
  else if (score < 70) healthStatus = "degraded";
  else if (operation.executionStatus === "blocked") healthStatus = "unknown";

  const healthy = score >= 70 && operation.executionStatus === "executing";

  return {
    score,
    healthy,
    healthStatus,
    executionStatus: operation.executionStatus,
    signals: [`domain:${operation.domainId}`, `workflow:${operation.workflowId}`],
    blockers: operation.blockers,
  };
}

export function evaluateAggregateAutomationHealth(
  operations: AutomationOperation[],
  context: Record<string, unknown> = {},
): AutomationOperationHealthSummary {
  if (operations.length === 0) {
    return {
      score: 0,
      healthy: false,
      healthStatus: "unknown",
      executionStatus: "blocked",
      signals: [],
      blockers: [],
    };
  }

  const scores = operations.map((op) => evaluateAutomationOperationHealth(op, context).score);
  const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const executing = operations.filter((op) => op.executionStatus === "executing").length;

  return {
    score: avgScore,
    healthy: avgScore >= 70 && executing > 0,
    healthStatus: avgScore >= 70 ? "healthy" : avgScore >= 40 ? "degraded" : "unhealthy",
    executionStatus: executing > 0 ? "executing" : operations[0]!.executionStatus,
    signals: [`operations:${operations.length}`, `executing:${executing}`],
    blockers: operations.flatMap((op) => op.blockers),
  };
}
