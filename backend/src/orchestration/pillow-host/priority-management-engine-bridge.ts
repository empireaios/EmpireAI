import {
  assemblePriorityManagementEngine,
  buildFallbackPriorityManagementEngine,
} from "@empireai/pillow";

/** Fallback Priority Management Engine when Pillow session is unavailable. */
export function collectPriorityManagementEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-05",
    live: false,
    priorityManagementEngine: buildFallbackPriorityManagementEngine(),
  };
}

export { assemblePriorityManagementEngine, buildFallbackPriorityManagementEngine };
