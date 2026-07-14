import {
  assembleExecutiveDecisionCertification,
  buildFallbackExecutiveDecisionCertification,
} from "@empireai/pillow";

/** Fallback Executive Decision Certification when Pillow session is unavailable. */
export function collectExecutiveDecisionCertificationSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-16",
    live: false,
    executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
  };
}

export { assembleExecutiveDecisionCertification, buildFallbackExecutiveDecisionCertification };
