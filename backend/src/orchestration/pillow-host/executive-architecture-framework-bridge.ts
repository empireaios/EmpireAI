import {
  assembleExecutiveArchitectureFramework,
  buildFallbackExecutiveArchitectureFramework,
} from "@empireai/pillow";

/** Fallback Executive Architecture Framework when Pillow session is unavailable. */
export function collectExecutiveArchitectureFrameworkSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-01",
    live: false,
    executiveArchitectureFramework: buildFallbackExecutiveArchitectureFramework(),
  };
}

export { assembleExecutiveArchitectureFramework, buildFallbackExecutiveArchitectureFramework };
