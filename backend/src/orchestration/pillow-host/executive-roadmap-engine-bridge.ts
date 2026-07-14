import {
  assembleExecutiveRoadmapEngine,
  buildFallbackExecutiveRoadmapEngine,
} from "@empireai/pillow";

/** Fallback Executive Roadmap Engine when Pillow session is unavailable. */
export function collectExecutiveRoadmapEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-04",
    live: false,
    executiveRoadmapEngine: buildFallbackExecutiveRoadmapEngine(),
  };
}

export { assembleExecutiveRoadmapEngine, buildFallbackExecutiveRoadmapEngine };
