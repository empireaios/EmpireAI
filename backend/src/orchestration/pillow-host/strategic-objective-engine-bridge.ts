import {
  assembleStrategicObjectiveEngine,
  buildFallbackStrategicObjectiveEngine,
} from "@empireai/pillow";

/** Fallback Strategic Objective Engine when Pillow session is unavailable. */
export function collectStrategicObjectiveEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-03",
    live: false,
    strategicObjectiveEngine: buildFallbackStrategicObjectiveEngine(),
  };
}

export { assembleStrategicObjectiveEngine, buildFallbackStrategicObjectiveEngine };
