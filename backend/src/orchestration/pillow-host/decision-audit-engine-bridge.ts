import {
  assembleDecisionAuditEngine,
  buildFallbackDecisionAuditEngine,
} from "@empireai/pillow";

/** Fallback Decision Audit Engine when Pillow session is unavailable. */
export function collectDecisionAuditEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-13",
    live: false,
    decisionAuditEngine: buildFallbackDecisionAuditEngine(),
  };
}

export { assembleDecisionAuditEngine, buildFallbackDecisionAuditEngine };
