import {
  assembleExecutiveEscalationEngine,
  buildFallbackExecutiveEscalationEngine,
} from "@empireai/pillow";

/** Fallback Executive Escalation Engine when Pillow session is unavailable. */
export function collectExecutiveEscalationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-09",
    live: false,
    executiveEscalationEngine: buildFallbackExecutiveEscalationEngine(),
  };
}

export { assembleExecutiveEscalationEngine, buildFallbackExecutiveEscalationEngine };
