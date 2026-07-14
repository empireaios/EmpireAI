/** T3-05 — Resolves preview scope from source bundle. */

import type { PreviewSourceBundle } from "./preview-source-collector.js";
import type { PreviewScope } from "./types.js";

export class PreviewScopeResolver {
  resolve(bundle: PreviewSourceBundle): PreviewScope {
    if (bundle.themeIds.length > 0 && bundle.layoutRefactoringIds.length === 0) {
      return "theme";
    }
    if (bundle.layoutRefactoringIds.length > 0) return "layout";
    if (bundle.componentGenerationIds.length > 1) return "component_variant";
    if (bundle.componentGenerationIds.length > 0) return "component";
    if (bundle.previewFiles.some((f) => f.includes("dashboard"))) return "dashboard";
    if (bundle.previewFiles.some((f) => f.includes("form"))) return "form";
    if (bundle.previewFiles.some((f) => f.includes("table"))) return "table";
    if (bundle.previewFiles.some((f) => f.includes("modal"))) return "modal";
    if (bundle.previewFiles.some((f) => f.includes("loading"))) return "loading_state";
    if (bundle.previewFiles.some((f) => f.includes("empty"))) return "empty_state";
    if (bundle.previewFiles.some((f) => f.includes("error"))) return "error_state";
    return "page";
  }
}
