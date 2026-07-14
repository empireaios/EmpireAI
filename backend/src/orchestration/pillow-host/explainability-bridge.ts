import {
  assembleExplainabilityArchitecture,
  buildFallbackExplainabilityArchitecture,
} from "@empireai/pillow";

/** Fallback Explainability when Pillow session is unavailable. */
export function collectExplainabilitySnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P7-07",
    live: false,
    explainability: buildFallbackExplainabilityArchitecture(),
  };
}

export { assembleExplainabilityArchitecture, buildFallbackExplainabilityArchitecture };
