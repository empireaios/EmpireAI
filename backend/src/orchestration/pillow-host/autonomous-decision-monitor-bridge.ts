import {
  assembleAutonomousDecisionMonitor,
  buildFallbackAutonomousDecisionMonitor,
} from "@empireai/pillow";

/** Fallback Autonomous Decision Monitor when Pillow session is unavailable. */
export function collectAutonomousDecisionMonitorSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-15",
    live: false,
    autonomousDecisionMonitor: buildFallbackAutonomousDecisionMonitor(),
  };
}

export { assembleAutonomousDecisionMonitor, buildFallbackAutonomousDecisionMonitor };
