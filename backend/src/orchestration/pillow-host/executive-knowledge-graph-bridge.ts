import {
  assembleExecutiveKnowledgeGraph,
  buildFallbackExecutiveKnowledgeGraph,
} from "@empireai/pillow";

/** Fallback Executive Knowledge Graph when Pillow session is unavailable. */
export function collectExecutiveKnowledgeGraphSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-08",
    live: false,
    executiveKnowledgeGraph: buildFallbackExecutiveKnowledgeGraph(),
  };
}

export { assembleExecutiveKnowledgeGraph, buildFallbackExecutiveKnowledgeGraph };
