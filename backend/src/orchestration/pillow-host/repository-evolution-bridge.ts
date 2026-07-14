import {
  assembleRepositoryEvolutionArchitecture,
  buildFallbackRepositoryEvolutionArchitecture,
} from "@empireai/pillow";

/** Fallback Repository Evolution Architecture when Pillow session is unavailable. */
export function collectRepositoryEvolutionSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P9-01",
    live: false,
    repositoryEvolution: buildFallbackRepositoryEvolutionArchitecture(),
  };
}

export { assembleRepositoryEvolutionArchitecture, buildFallbackRepositoryEvolutionArchitecture };
