import {
  assembleCashReserveIntelligence,
  buildFallbackCashReserveIntelligence,
} from "@empireai/pillow";

/** Fallback Cash Reserve Intelligence when Pillow session is unavailable. */
export function collectCashReserveIntelligenceSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-06",
    live: false,
    cashReserveIntelligence: buildFallbackCashReserveIntelligence(),
  };
}

export { assembleCashReserveIntelligence, buildFallbackCashReserveIntelligence };
