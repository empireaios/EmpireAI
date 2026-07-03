/**
 * G7-03 — Production workflow launcher (orchestration only — G5 owns execution).
 */

import { randomUUID } from "node:crypto";
import type { AutomationOperation } from "../contracts/automation-operations-types.js";
import { transitionAutomationOperationStatus } from "./automation-lifecycle-manager.js";

export function launchProductionWorkflow(operation: AutomationOperation): {
  ok: true;
  operation: AutomationOperation;
  workflowRunId: string;
} | { ok: false; reason: string } {
  const starting = transitionAutomationOperationStatus(operation, "executing", "pillow-approved");
  if (!starting.ok) return starting;

  const workflowRunId = randomUUID();
  return {
    ok: true,
    workflowRunId,
    operation: {
      ...starting.operation,
      workflowRunId,
      healthStatus: "healthy",
    },
  };
}
