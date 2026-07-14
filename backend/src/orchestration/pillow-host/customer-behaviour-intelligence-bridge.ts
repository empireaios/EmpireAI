import {
  assembleCustomerBehaviourIntelligence,
  buildFallbackCustomerBehaviourIntelligence,
} from "@empireai/pillow";

/** Fallback Customer Behaviour Intelligence when Pillow session is unavailable. */
export function collectCustomerBehaviourIntelligenceSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-06",
    live: false,
    customerBehaviourIntelligence: buildFallbackCustomerBehaviourIntelligence(),
  };
}

export { assembleCustomerBehaviourIntelligence, buildFallbackCustomerBehaviourIntelligence };
