/** E5-08 — Recovery and remediation workflows. */

import type { RecoveryWorkflowEntry } from "./types.js";
import type { ExceptionManagerConfiguration } from "./configuration.js";

export function buildRecoveryWorkflow(input: {
  exceptionId: string;
  title: string;
  correctiveAction: string;
  config: ExceptionManagerConfiguration;
}): RecoveryWorkflowEntry {
  return {
    recoveryId: `rec-${input.exceptionId}`,
    exceptionId: input.exceptionId,
    title: `Recovery: ${input.title}`,
    strategy: input.correctiveAction,
    retryAllowed: input.config.retryAttempts > 0,
    fallbackAction: input.config.fallbackEnabled
      ? "Revert to constitutional default · manual intervention available"
      : "Manual intervention required",
    owner: "Exception Recovery Team",
    progress: 0,
    status: "scheduled",
  };
}

export function buildRecoveryWorkflows(
  records: Array<{ exceptionId: string; exceptionTitle: string; businessJustification: string; currentStatus: string }>,
  config: ExceptionManagerConfiguration,
): RecoveryWorkflowEntry[] {
  return records
    .filter((r) => r.currentStatus === "active" || r.currentStatus === "remediation")
    .map((r) =>
      buildRecoveryWorkflow({
        exceptionId: r.exceptionId,
        title: r.exceptionTitle,
        correctiveAction: r.businessJustification,
        config,
      }),
    );
}
