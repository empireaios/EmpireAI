import {
  assembleExecutiveConsensusEngine,
  buildFallbackExecutiveConsensusEngine,
} from "@empireai/pillow";

/** Fallback Executive Consensus Engine when Pillow session is unavailable. */
export function collectExecutiveConsensusEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-11",
    live: false,
    executiveConsensusEngine: buildFallbackExecutiveConsensusEngine(),
  };
}

export { assembleExecutiveConsensusEngine, buildFallbackExecutiveConsensusEngine };
