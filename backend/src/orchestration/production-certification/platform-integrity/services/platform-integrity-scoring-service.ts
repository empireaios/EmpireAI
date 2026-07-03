/**
 * G6-01 — Platform integrity scoring.
 */

import type { PlatformIntegrityResultState } from "../contracts/platform-integrity-types.js";

const STATUS_SCORES: Record<PlatformIntegrityResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
};

export function scorePlatformIntegrityStatus(status: PlatformIntegrityResultState): number {
  return STATUS_SCORES[status];
}

export function derivePlatformIntegrityStatus(input: {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  moduleStatus: PlatformIntegrityResultState;
  subsystemStatus: PlatformIntegrityResultState;
  programmeFailures: number;
}): PlatformIntegrityResultState {
  if (input.criticalCount > 0) return "fail";
  if (input.programmeFailures > 0) return "fail";
  if (input.moduleStatus === "fail" || input.subsystemStatus === "fail") return "fail";
  if (input.highCount > 0) return "warning";
  if (input.mediumCount > 0) return "pass_with_conditions";
  if (input.moduleStatus === "pass_with_conditions" || input.subsystemStatus === "pass_with_conditions") {
    return "pass_with_conditions";
  }
  return "pass";
}
