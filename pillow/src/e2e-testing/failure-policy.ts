import type { FailurePolicyResult, JourneyResult } from "./types.js";

/** P4-07 failure policy — critical test failure blocks production acceptance. */
export function evaluateFailurePolicy(criticalFailures: JourneyResult[]): FailurePolicyResult {
  const hasCriticalFailure = criticalFailures.some((j) => j.verdict === "FAIL");

  if (!hasCriticalFailure) {
    return {
      blockProductionAcceptance: false,
      notifySupervisor: false,
      notifyPillow: false,
      generateRecoveryRecommendation: false,
      preventMissionCompletion: false,
      reason: "All critical journeys passed or pending — Browser Truth remains final authority",
    };
  }

  return {
    blockProductionAcceptance: true,
    notifySupervisor: true,
    notifyPillow: true,
    generateRecoveryRecommendation: true,
    preventMissionCompletion: true,
    reason: `Critical journey failure: ${criticalFailures.filter((j) => j.verdict === "FAIL").map((j) => j.id).join(", ")}`,
  };
}
