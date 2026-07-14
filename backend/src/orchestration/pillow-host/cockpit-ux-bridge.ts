import {
  assembleCockpitUxArchitecture,
  buildFallbackCockpitUxArchitecture,
} from "@empireai/pillow";

/** Fallback Cockpit UX Architecture when Pillow session is unavailable. */
export function collectCockpitUxSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P7-02",
    live: false,
    cockpitUx: buildFallbackCockpitUxArchitecture(),
  };
}

export { assembleCockpitUxArchitecture, buildFallbackCockpitUxArchitecture };
