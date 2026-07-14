import {
  assembleCommerceOperatingModel,
  buildFallbackCommerceOperatingModel,
} from "@empireai/pillow";

/** Fallback Commerce Operating Model when Pillow session is unavailable. */
export function collectCommerceOperatingModelSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P8-02",
    live: false,
    commerceOperatingModel: buildFallbackCommerceOperatingModel(),
  };
}

export { assembleCommerceOperatingModel, buildFallbackCommerceOperatingModel };
