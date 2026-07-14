import {
  assembleExecutiveApprovalIntelligence,
  buildFallbackExecutiveApprovalIntelligence,
} from "@empireai/pillow";

/** Fallback Executive Approval Intelligence when Pillow session is unavailable. */
export function collectExecutiveApprovalIntelligenceSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-07",
    live: false,
    executiveApprovalIntelligence: buildFallbackExecutiveApprovalIntelligence(),
  };
}

export { assembleExecutiveApprovalIntelligence, buildFallbackExecutiveApprovalIntelligence };
