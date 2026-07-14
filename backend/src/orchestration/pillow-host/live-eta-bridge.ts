import {
  assembleLiveEtaExperience,
  buildFallbackLiveEtaExperience,
} from "@empireai/pillow";

/** Fallback Live ETA when Pillow session is unavailable. */
export function collectLiveEtaSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P7-06",
    live: false,
    liveEta: buildFallbackLiveEtaExperience(),
  };
}

export { assembleLiveEtaExperience, buildFallbackLiveEtaExperience };
