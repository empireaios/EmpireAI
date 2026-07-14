/** T3-04 — Color theme token generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeScope, ThemeToken } from "./types.js";

export class ColorThemeGenerator {
  generate(
    themeName: string,
    scope: ThemeScope,
    designSystem: DesignSystemModel | null,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.colorRulesEnabled) return [];

    const prefix = `--${this.toKebab(themeName)}`;
    const base: ThemeToken[] = [
      { tokenId: `${prefix}-background`, tokenName: "background", tokenValue: "hsl(var(--background))", category: "color" },
      { tokenId: `${prefix}-foreground`, tokenName: "foreground", tokenValue: "hsl(var(--foreground))", category: "color" },
      { tokenId: `${prefix}-primary`, tokenName: "primary", tokenValue: "hsl(var(--primary))", category: "color" },
      { tokenId: `${prefix}-muted`, tokenName: "muted-foreground", tokenValue: "hsl(var(--muted-foreground))", category: "color" },
      { tokenId: `${prefix}-border`, tokenName: "border", tokenValue: "hsl(var(--border))", category: "color" },
    ];

    if (designSystem?.colorPalette.length) {
      for (const color of designSystem.colorPalette.slice(0, 3)) {
        base.push({
          tokenId: `${prefix}-${color.name}`,
          tokenName: color.name,
          tokenValue: color.value,
          category: "color",
        });
      }
    }

    if (scope === "dashboard") {
      base.push({
        tokenId: `${prefix}-dashboard-accent`,
        tokenName: "dashboard-accent",
        tokenValue: "hsl(var(--primary) / 0.1)",
        category: "color",
      });
    }

    return base;
  }

  private toKebab(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
}
