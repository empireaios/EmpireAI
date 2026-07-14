import {
  assembleStrategicAlignmentMonitor,
  buildFallbackStrategicAlignmentMonitor,
} from "@empireai/pillow";

/** Fallback Strategic Alignment Monitor when Pillow session is unavailable. */
export function collectStrategicAlignmentMonitorSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-13",
    live: false,
    strategicAlignmentMonitor: buildFallbackStrategicAlignmentMonitor(),
  };
}

export { assembleStrategicAlignmentMonitor, buildFallbackStrategicAlignmentMonitor };
