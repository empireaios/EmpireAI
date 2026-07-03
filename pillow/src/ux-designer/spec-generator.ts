import type { ScreenCatalogEntry, UxDesignIntent, UxEngineeringSpec } from "./types.js";
import {
  EMPIRE_DESIGN_TOKENS,
  PINK_OVERRIDE,
  STYLE_PRESETS,
} from "./design-tokens.js";

export function buildEngineeringSpec(
  intent: UxDesignIntent,
  screen: ScreenCatalogEntry | null,
  styleKey: string,
): UxEngineeringSpec {
  const preset = STYLE_PRESETS[styleKey] ?? STYLE_PRESETS.empire_gold!;
  const components = screen?.componentHierarchy.map((c) => c.path) ?? [
    "empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx",
  ];
  const pageFiles = screen ? [screen.pagePath, ...components] : components;

  const layoutChanges: string[] = [];
  const tailwindClasses = [...preset.tailwind];
  let colourPalette = { ...preset.palette };

  if (intent.categories.includes("colour") && /pink/i.test(intent.rawRequest)) {
    colourPalette = { ...colourPalette, ...PINK_OVERRIDE.palette };
    tailwindClasses.push(...PINK_OVERRIDE.tailwind);
    layoutChanges.push("Apply pink accent palette to page background and primary surfaces");
  }

  if (intent.categories.includes("spacing") || /spacing|gap|padding/i.test(intent.rawRequest)) {
    layoutChanges.push("Increase vertical gap from gap-6 to gap-8 on main stack");
    tailwindClasses.push("gap-8", "py-8", "px-6");
  }

  if (/further left|move.*left|align left/i.test(intent.rawRequest)) {
    layoutChanges.push("Reduce horizontal padding; align content container to start (ml-0, pl-4)");
    tailwindClasses.push("ml-0", "pl-4", "mr-auto");
  }

  if (/darker/i.test(intent.rawRequest)) {
    colourPalette.background = "#000000";
    tailwindClasses.push("bg-black", "bg-[#0a0a0a]");
    layoutChanges.push("Darken panel backgrounds to #000000 / #0a0a0a");
  }

  if (intent.categories.includes("component") && /replace.*card|card/i.test(intent.rawRequest)) {
    layoutChanges.push("Refactor Panel components to updated card variant with new border radius");
  }

  const designTokens: Record<string, string> = {
    "--background": colourPalette.background ?? EMPIRE_DESIGN_TOKENS.background,
    "--gold": colourPalette.primary ?? EMPIRE_DESIGN_TOKENS.gold,
    "--gold-light": colourPalette.accent ?? EMPIRE_DESIGN_TOKENS.goldLight,
  };

  const objective = `${intent.summary}. Apply ${preset.description}.`;

  return {
    objective,
    affectedScreens: screen ? [screen.route] : ["/cockpit"],
    affectedComponents: components,
    requiredFiles: [...new Set([...pageFiles, "empireai-web/app/globals.css"])],
    layoutChanges,
    designTokens,
    animations: intent.categories.includes("animation") ? ["reveal-up on section mount"] : [],
    colourPalette,
    responsiveBehaviour: [
      "Preserve lg: breakpoints for sidebar layout",
      "Stack grids to single column on sm:",
      "Maintain CockpitMobileNav bottom bar on mobile",
    ],
    tailwindClasses: [...new Set(tailwindClasses)],
    acceptanceCriteria: [
      `Visual change matches King's request: "${intent.rawRequest.slice(0, 80)}"`,
      "No regression to CockpitShell navigation or Pillow panel",
      "Responsive layout verified at sm/md/lg breakpoints",
      "Design tokens remain consistent with EmpireAI brand unless explicitly overridden",
      "Typecheck and empireai-web build pass",
    ],
    cursorMissionSummary: buildCursorMission(intent, screen, preset.description, pageFiles),
  };
}

function buildCursorMission(
  intent: UxDesignIntent,
  screen: ScreenCatalogEntry | null,
  styleDescription: string,
  files: string[],
): string {
  return [
    `UX Mission — ${screen?.title ?? "Cockpit screen"}`,
    `King request: "${intent.rawRequest}"`,
    `Style direction: ${styleDescription}`,
    `Primary files: ${files.slice(0, 4).join(", ")}`,
    "Use Tailwind utility classes; update globals.css tokens only when necessary.",
    "Do not break brain data bindings or useBrainModule hooks.",
    "Validate with browser at target route after implementation.",
  ].join("\n");
}
