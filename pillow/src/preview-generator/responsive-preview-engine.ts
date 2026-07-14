/** T3-05 — Builds responsive preview state descriptors. */

import type { PreviewScope } from "./types.js";
import { appendPreviewLog } from "./preview-logging.js";

export class ResponsivePreviewEngine {
  buildStates(scope: PreviewScope): string[] {
    appendPreviewLog({
      event: "responsive_preview",
      level: "info",
      details: `Building responsive states for ${scope}`,
    });

    const base = ["viewport:mobile", "viewport:tablet", "viewport:desktop"];
    if (scope === "responsive_breakpoint" || scope === "layout" || scope === "dashboard") {
      return [...base, "viewport:wide", "breakpoint:sm", "breakpoint:md", "breakpoint:lg"];
    }
    if (scope === "loading_state") return ["state:loading", ...base];
    if (scope === "empty_state") return ["state:empty", ...base];
    if (scope === "error_state") return ["state:error", ...base];
    return base;
  }
}
