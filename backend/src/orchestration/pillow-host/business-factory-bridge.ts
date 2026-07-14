import {
  assembleBusinessFactoryArchitecture,
  buildFallbackBusinessFactoryArchitecture,
} from "@empireai/pillow";

/** Fallback Business Factory when Pillow session is unavailable. */
export function collectBusinessFactorySnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P8-01",
    live: false,
    businessFactory: buildFallbackBusinessFactoryArchitecture(),
  };
}

export { assembleBusinessFactoryArchitecture, buildFallbackBusinessFactoryArchitecture };
