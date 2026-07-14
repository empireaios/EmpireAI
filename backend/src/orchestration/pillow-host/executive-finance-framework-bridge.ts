import {
  assembleExecutiveFinanceFramework,
  buildFallbackExecutiveFinanceFramework,
} from "@empireai/pillow";

/** Fallback Executive Finance Framework when Pillow session is unavailable. */
export function collectExecutiveFinanceFrameworkSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-01",
    live: false,
    executiveFinanceFramework: buildFallbackExecutiveFinanceFramework(),
  };
}

export { assembleExecutiveFinanceFramework, buildFallbackExecutiveFinanceFramework };
