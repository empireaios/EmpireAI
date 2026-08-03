/** X1-11 — Launch Recovery Engine (structural signals only). */

import type { LaunchStage, LaunchStatus, RecoveryStatus } from "./types.js";

export class LaunchRecoveryEngine {
  coordinate(input: {
    status: LaunchStatus;
    stage: LaunchStage;
    recoveryEnabled: boolean;
    attempts: number;
    maxAttempts: number;
  }): {
    recoveryStatus: RecoveryStatus;
    launchStatus: LaunchStatus;
    currentLaunchStage: LaunchStage;
    note: string;
  } {
    if (input.status !== "failed" && input.status !== "blocked" && input.status !== "recovering") {
      return {
        recoveryStatus: "not_required",
        launchStatus: input.status,
        currentLaunchStage: input.stage,
        note: "recovery-not-required",
      };
    }
    if (!input.recoveryEnabled) {
      return {
        recoveryStatus: "exhausted",
        launchStatus: "failed",
        currentLaunchStage: "failed",
        note: "recovery-disabled",
      };
    }
    if (input.attempts >= input.maxAttempts) {
      return {
        recoveryStatus: "exhausted",
        launchStatus: "failed",
        currentLaunchStage: "failed",
        note: "recovery-exhausted",
      };
    }
    return {
      recoveryStatus: "recovered",
      launchStatus: "in_progress",
      currentLaunchStage:
        input.stage === "failed" || input.stage === "completed"
          ? "prerequisites_check"
          : input.stage,
      note: `recovery-attempt-${input.attempts + 1}`,
    };
  }
}
