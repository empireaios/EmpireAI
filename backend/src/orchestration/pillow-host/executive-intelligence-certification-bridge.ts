import {
  assembleExecutiveIntelligenceCertification,
  buildFallbackExecutiveIntelligenceCertification,
} from "@empireai/pillow";

/** Fallback Executive Intelligence Certification when Pillow session is unavailable. */
export function collectExecutiveIntelligenceCertificationSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-15",
    live: false,
    executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
  };
}

export { assembleExecutiveIntelligenceCertification, buildFallbackExecutiveIntelligenceCertification };
