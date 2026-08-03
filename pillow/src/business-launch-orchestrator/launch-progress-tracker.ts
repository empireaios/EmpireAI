/** X1-11 — Launch Progress Tracker (structural signals only). */

import type { LaunchStage, LaunchStatus } from "./types.js";

export class LaunchProgressTracker {
  track(stage: LaunchStage, progress: number, status: LaunchStatus): string {
    return `stage=${stage} · progress=${progress}% · status=${status}`;
  }

  detectFailure(status: LaunchStatus, progress: number, depsSummary: string): string {
    if (status === "failed") return "launch-failed";
    if (status === "blocked") return `blocked:${depsSummary}`;
    if (progress <= 0 && status === "in_progress") return "stalled";
    return "none";
  }
}
