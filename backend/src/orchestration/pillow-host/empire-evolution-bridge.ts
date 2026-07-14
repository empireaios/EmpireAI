import {
  assembleEmpireEvolutionArchitecture,
  buildFallbackEmpireEvolutionArchitecture,
} from "@empireai/pillow";

/** Fallback Empire Evolution Architecture when Pillow session is unavailable. */
export function collectEmpireEvolutionSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P9-05",
    live: false,
    empireEvolution: buildFallbackEmpireEvolutionArchitecture(),
  };
}

export { assembleEmpireEvolutionArchitecture, buildFallbackEmpireEvolutionArchitecture };
