import {
  assembleExecutiveKpiEngine,
  buildFallbackExecutiveKpiEngine,
} from "@empireai/pillow";

/** Fallback Executive KPI Engine when Pillow session is unavailable. */
export function collectExecutiveKpiEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-10",
    live: false,
    executiveKpiEngine: buildFallbackExecutiveKpiEngine(),
  };
}

export { assembleExecutiveKpiEngine, buildFallbackExecutiveKpiEngine };
