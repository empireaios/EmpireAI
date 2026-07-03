import type { ScreenCatalogEntry, UxEngineeringSpec, UxPreviewPlan } from "./types.js";

export function buildPreviewPlan(
  screen: ScreenCatalogEntry | null,
  spec: UxEngineeringSpec,
): UxPreviewPlan {
  const componentChanges = spec.affectedComponents.map((component) => ({
    component,
    change: spec.layoutChanges[0] ?? `Apply Tailwind: ${spec.tailwindClasses.slice(0, 3).join(" ")}`,
  }));

  return {
    screenId: screen?.id ?? "SCR-001",
    route: screen?.route ?? "/cockpit",
    visualSummary: [
      spec.objective,
      `Palette: ${Object.entries(spec.colourPalette).map(([k, v]) => `${k}=${v}`).join(", ")}`,
      `Classes: ${spec.tailwindClasses.slice(0, 6).join(" ")}`,
    ].join(". "),
    componentChanges,
    tokenOverrides: spec.designTokens,
    breakpointNotes: spec.responsiveBehaviour,
    previewNotes: [
      "Preview by implementing spec in local dev and opening target route",
      "Compare before/after screenshots at 1440px and 375px",
      "Verify Pillow Operating Shell still renders without layout shift",
    ],
  };
}
