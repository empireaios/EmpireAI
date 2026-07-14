/** E5-04 — Compliance enforcement modes. */

import type {
  ComplianceEnforcementMode,
  ComplianceEvaluationResult,
  ComplianceEnforcementDecision,
} from "./types.js";

const MODE_RANK: Record<ComplianceEnforcementMode, number> = {
  advisory: 0,
  warning: 1,
  soft_block: 2,
  hard_block: 3,
  auto_reject: 4,
};

const RESULT_ENFORCEMENT: Record<ComplianceEvaluationResult, ComplianceEnforcementMode> = {
  PASS: "advisory",
  WARNING: "warning",
  VIOLATION: "soft_block",
  CRITICAL: "hard_block",
};

export function resolveEnforcement(
  result: ComplianceEvaluationResult,
  configuredMode: ComplianceEnforcementMode,
): ComplianceEnforcementDecision {
  const minimumMode = RESULT_ENFORCEMENT[result];
  const effectiveMode =
    MODE_RANK[configuredMode] >= MODE_RANK[minimumMode] ? configuredMode : minimumMode;

  const blocked = effectiveMode === "hard_block" || effectiveMode === "auto_reject";
  const allowed = result === "PASS" || effectiveMode === "advisory" || effectiveMode === "warning";

  return {
    result,
    configuredMode,
    effectiveMode,
    allowed: allowed && !blocked,
    blocked,
    message: blocked
      ? `Execution blocked — ${result} compliance result requires ${effectiveMode}`
      : allowed
        ? `Execution permitted — ${result} with ${effectiveMode} enforcement`
        : `Execution restricted — ${result} with ${effectiveMode} enforcement`,
  };
}

export function canPreventExecution(decision: ComplianceEnforcementDecision): boolean {
  return decision.blocked;
}
