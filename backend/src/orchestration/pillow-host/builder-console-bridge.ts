import {
  assembleBuilderConsoleView,
  buildFallbackBuilderConsoleView,
} from "@empireai/pillow";

/** Fallback Builder Console when Pillow session is unavailable. */
export function collectBuilderConsoleSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P7-05",
    live: false,
    builderConsole: buildFallbackBuilderConsoleView(),
  };
}

export { assembleBuilderConsoleView, buildFallbackBuilderConsoleView };
