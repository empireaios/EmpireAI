/** T3-08 — Rollback verification engine. */

import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RollbackVerificationResult } from "./types.js";
import type { RollbackExecutionResult } from "./rollback-execution-engine.js";
import { appendRollbackLog } from "./rollback-logging.js";

export class RollbackVerificationEngine {
  verify(
    execution: RollbackExecutionResult,
    config: RollbackManagerConfiguration,
  ): RollbackVerificationResult {
    if (!config.rollbackVerificationEnabled) {
      return { verified: true, checksPassed: 0, checksFailed: 0, details: ["Verification skipped"] };
    }

    appendRollbackLog({
      event: "rollback_verification",
      level: "info",
      details: "Verifying rollback success",
    });

    const details: string[] = [];
    let checksPassed = 0;
    let checksFailed = 0;

    if (execution.errors.length === 0) {
      checksPassed += 1;
      details.push("No execution errors");
    } else {
      checksFailed += 1;
      details.push(`${execution.errors.length} execution errors`);
    }

    const totalRestored =
      execution.revertedFiles.length +
      execution.revertedComponents.length +
      execution.revertedLayouts.length +
      execution.revertedThemes.length;

    if (totalRestored > 0) {
      checksPassed += 1;
      details.push(`Restored ${totalRestored} artifacts`);
    } else {
      checksFailed += 1;
      details.push("No artifacts restored");
    }

    if (execution.warnings.length === 0) {
      checksPassed += 1;
    } else {
      details.push(`${execution.warnings.length} warnings during rollback`);
    }

    return {
      verified: checksFailed === 0,
      checksPassed,
      checksFailed,
      details,
    };
  }
}
