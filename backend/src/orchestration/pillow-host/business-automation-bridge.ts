import {
  assembleBusinessAutomationArchitecture,
  buildFallbackBusinessAutomationArchitecture,
} from "@empireai/pillow";

/** Fallback Business Automation when Pillow session is unavailable. */
export function collectBusinessAutomationSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P8-04",
    live: false,
    businessAutomation: buildFallbackBusinessAutomationArchitecture(),
  };
}

export { assembleBusinessAutomationArchitecture, buildFallbackBusinessAutomationArchitecture };
