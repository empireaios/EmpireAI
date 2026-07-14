import {
  assembleExecutiveDecisionArchitecture,
  buildFallbackExecutiveDecisionArchitecture,
} from "@empireai/pillow";

/** Fallback Executive Decision Architecture when Pillow session is unavailable. */
export function collectExecutiveDecisionArchitectureSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-01",
    live: false,
    executiveDecisionArchitecture: buildFallbackExecutiveDecisionArchitecture(),
  };
}

export { assembleExecutiveDecisionArchitecture, buildFallbackExecutiveDecisionArchitecture };
