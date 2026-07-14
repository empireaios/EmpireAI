/** T3-02 — Design system constraints for component generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";

export class DesignSystemConstraintEngine {
  buildConstraints(
    designSystem: DesignSystemModel | null,
    config: ComponentGeneratorConfiguration,
  ): string[] {
    if (!config.designSystemConstraintsEnabled || !designSystem) {
      return ["Use PlatformPrimitives and existing Tailwind token patterns"];
    }

    const constraints: string[] = [
      `Design system ID: ${designSystem.designSystemId}`,
      "Import Panel, DataTable from @/components/platform/ui/PlatformPrimitives",
      "Use semantic Tailwind classes: text-muted-foreground, bg-primary, border-border",
    ];

    if (designSystem.typographyStandards.length > 0) {
      constraints.push(`Typography: ${designSystem.typographyStandards[0]?.name ?? "standard"}`);
    }
    if (designSystem.colorPalette.length > 0) {
      constraints.push("Colors: primary, muted-foreground, destructive semantic tokens");
    }

    return constraints;
  }

  buildStyling(designSystem: DesignSystemModel | null, category: string): string[] {
    const base = [
      "rounded-md border border-border",
      "text-sm text-foreground",
      "focus-visible:outline-none focus-visible:ring-2",
    ];
    if (category === "button") base.push("px-3 py-1 bg-primary text-primary-foreground");
    if (category === "card" || category === "panel") base.push("p-4 space-y-2");
    if (category === "loading_state") base.push("animate-pulse text-muted-foreground");
    if (designSystem?.spacingScale.length) base.push("gap-4 grid conventions");
    return base;
  }
}
