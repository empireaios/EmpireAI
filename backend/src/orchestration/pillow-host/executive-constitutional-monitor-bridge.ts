import {
  assembleExecutiveConstitutionalMonitor,
  buildFallbackExecutiveConstitutionalMonitor,
} from "@empireai/pillow";

/** Fallback Executive Constitutional Monitor when Pillow session is unavailable. */
export function collectExecutiveConstitutionalMonitorSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-02",
    live: false,
    executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
  };
}

export { assembleExecutiveConstitutionalMonitor, buildFallbackExecutiveConstitutionalMonitor };
