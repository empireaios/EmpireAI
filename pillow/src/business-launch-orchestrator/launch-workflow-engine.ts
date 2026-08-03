/** X1-11 — Launch Workflow Engine (structural signals only). */

import { LAUNCH_STAGES } from "./paths.js";
import type { LaunchStage } from "./types.js";

const ACTIVE_STAGES = LAUNCH_STAGES.filter(
  (s) => s !== "completed" && s !== "failed",
) as LaunchStage[];

export class LaunchWorkflowEngine {
  createWorkflowReference(launchSeed: string): string {
    return `structural://launch-workflow/${launchSeed}`;
  }

  initialStage(): LaunchStage {
    return "prerequisites_check";
  }

  nextStage(current: LaunchStage): LaunchStage {
    if (current === "completed" || current === "failed") return current;
    const idx = ACTIVE_STAGES.indexOf(current);
    if (idx < 0) return "prerequisites_check";
    if (idx >= ACTIVE_STAGES.length - 1) return "completed";
    return ACTIVE_STAGES[idx + 1]!;
  }

  stageProgress(stage: LaunchStage): number {
    if (stage === "completed") return 100;
    if (stage === "failed") return 0;
    const idx = ACTIVE_STAGES.indexOf(stage);
    if (idx < 0) return 0;
    return Math.round(((idx + 1) / ACTIVE_STAGES.length) * 100);
  }
}
