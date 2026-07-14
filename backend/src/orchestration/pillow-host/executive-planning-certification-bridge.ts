import {
  assembleExecutivePlanningCertification,
  buildFallbackExecutivePlanningCertification,
} from "@empireai/pillow";

/** Fallback Executive Planning Certification when Pillow session is unavailable. */
export function collectExecutivePlanningCertificationSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-15",
    live: false,
    executivePlanningCertification: buildFallbackExecutivePlanningCertification(),
  };
}

export { assembleExecutivePlanningCertification, buildFallbackExecutivePlanningCertification };
