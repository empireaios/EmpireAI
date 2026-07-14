import {
  assembleGrandKingOperatingAccount,
  buildFallbackGrandKingOperatingAccount,
} from "@empireai/pillow";

/** Fallback Grand King Operating Account when Pillow session is unavailable. */
export function collectGrandKingOperatingAccountSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P8-06",
    live: false,
    grandKingOperatingAccount: buildFallbackGrandKingOperatingAccount(),
  };
}

export { assembleGrandKingOperatingAccount, buildFallbackGrandKingOperatingAccount };
