/**
 * G7-07 — Autonomous execution monitor.
 */

import type { AutonomousHealthSummary, AutonomousQueueEntry } from "../contracts/autonomous-operations-types.js";
import { listAutonomousOperations, updateAutonomousOperationHealth } from "./autonomous-operation-store.js";

export function monitorAutonomousOperations(): AutonomousHealthSummary {
  const operations = listAutonomousOperations();
  let healthyCount = 0;
  let degradedCount = 0;
  let criticalCount = 0;

  for (const op of operations) {
    if (op.executionStatus === "failed" || op.healthStatus === "critical") {
      criticalCount++;
      updateAutonomousOperationHealth(op.autonomousOperationId, "critical");
    } else if (op.executionStatus === "blocked" || op.executionStatus === "paused" || op.healthStatus === "degraded") {
      degradedCount++;
      updateAutonomousOperationHealth(op.autonomousOperationId, "degraded");
    } else if (op.executionStatus === "running" || op.executionStatus === "completed") {
      healthyCount++;
      updateAutonomousOperationHealth(op.autonomousOperationId, "healthy");
    }
  }

  const overallHealth =
    criticalCount > 0 ? "critical" : degradedCount > 0 ? "degraded" : healthyCount > 0 ? "healthy" : "unknown";

  return {
    overallHealth,
    healthyCount,
    degradedCount,
    criticalCount,
    monitoredOperations: operations.length,
    computedAt: new Date().toISOString(),
  };
}

export function buildAutonomousQueue(): AutonomousQueueEntry[] {
  const operations = listAutonomousOperations().filter((op) =>
    ["waiting", "scheduled", "approval_pending", "running"].includes(op.executionStatus),
  );

  return operations
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((op, index) => ({
      queuePosition: index + 1,
      autonomousOperationId: op.autonomousOperationId,
      operationType: op.operationType,
      autonomyLevel: op.autonomyLevel,
      executionStatus: op.executionStatus,
      riskScore: op.riskScore,
    }));
}
