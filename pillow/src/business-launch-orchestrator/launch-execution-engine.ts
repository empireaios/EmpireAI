/** X1-11 — Launch Execution Engine (structural signals only). */

import type { LaunchStage, LaunchStatus } from "./types.js";
import type { LaunchDependencySnapshot } from "./launch-dependency-manager.js";

export class LaunchExecutionEngine {
  deriveStatus(input: {
    stage: LaunchStage;
    dependencies: LaunchDependencySnapshot;
    failed?: boolean;
    recovering?: boolean;
  }): LaunchStatus {
    if (input.failed) return "failed";
    if (input.recovering) return "recovering";
    if (input.stage === "completed") return "completed";
    if (!input.dependencies.readinessOk || !input.dependencies.allSatisfied) return "blocked";
    return "in_progress";
  }

  advanceStage(stage: LaunchStage, next: LaunchStage, depsOk: boolean): LaunchStage {
    if (!depsOk && stage !== "completed") return stage;
    return next;
  }
}
