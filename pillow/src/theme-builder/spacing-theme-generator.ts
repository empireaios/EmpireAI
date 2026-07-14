/** T3-04 — Spacing and sizing theme token generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeToken } from "./types.js";

export class SpacingThemeGenerator {
  generateSpacing(
    themeName: string,
    designSystem: DesignSystemModel | null,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.spacingRulesEnabled) return [];

    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    const tokens: ThemeToken[] = [
      { tokenId: `${prefix}-space-2`, tokenName: "space-2", tokenValue: "0.5rem", category: "spacing" },
      { tokenId: `${prefix}-space-4`, tokenName: "space-4", tokenValue: "1rem", category: "spacing" },
      { tokenId: `${prefix}-space-6`, tokenName: "space-6", tokenValue: "1.5rem", category: "spacing" },
      { tokenId: `${prefix}-gap-4`, tokenName: "gap-4", tokenValue: "1rem", category: "spacing" },
    ];

    if (designSystem?.spacingScale.length) {
      for (const s of designSystem.spacingScale.slice(0, 3)) {
        tokens.push({
          tokenId: `${prefix}-${s.name}`,
          tokenName: s.name,
          tokenValue: `${s.valuePx}px`,
          category: "spacing",
        });
      }
    }

    return tokens;
  }

  generateSizing(
    themeName: string,
    designSystem: DesignSystemModel | null,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.sizingRulesEnabled) return [];

    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    const tokens: ThemeToken[] = [
      { tokenId: `${prefix}-size-sm`, tokenName: "size-sm", tokenValue: "2rem", category: "sizing" },
      { tokenId: `${prefix}-size-md`, tokenName: "size-md", tokenValue: "2.5rem", category: "sizing" },
      { tokenId: `${prefix}-size-lg`, tokenName: "size-lg", tokenValue: "3rem", category: "sizing" },
    ];

    if (designSystem?.sizingScale.length) {
      const sz = designSystem.sizingScale[0]!;
      tokens.push({
        tokenId: `${prefix}-component-width`,
        tokenName: "component-width",
        tokenValue: `${sz.minWidthPx}px - ${sz.maxWidthPx}px`,
        category: "sizing",
      });
    }

    return tokens;
  }

  generateBorder(
    themeName: string,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.borderRulesEnabled) return [];
    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    return [
      { tokenId: `${prefix}-border`, tokenName: "border", tokenValue: "1px solid hsl(var(--border))", category: "border" },
      { tokenId: `${prefix}-border-muted`, tokenName: "border-muted", tokenValue: "1px solid hsl(var(--muted))", category: "border" },
    ];
  }

  generateRadius(
    themeName: string,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.radiusRulesEnabled) return [];
    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    return [
      { tokenId: `${prefix}-radius-sm`, tokenName: "radius-sm", tokenValue: "0.25rem", category: "radius" },
      { tokenId: `${prefix}-radius-md`, tokenName: "radius-md", tokenValue: "0.375rem", category: "radius" },
      { tokenId: `${prefix}-radius-lg`, tokenName: "radius-lg", tokenValue: "0.5rem", category: "radius" },
    ];
  }

  generateShadow(
    themeName: string,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.shadowRulesEnabled) return [];
    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    return [
      { tokenId: `${prefix}-shadow-sm`, tokenName: "shadow-sm", tokenValue: "0 1px 2px rgb(0 0 0 / 0.05)", category: "shadow" },
      { tokenId: `${prefix}-shadow-md`, tokenName: "shadow-md", tokenValue: "0 4px 6px rgb(0 0 0 / 0.1)", category: "shadow" },
      { tokenId: `${prefix}-shadow-lg`, tokenName: "shadow-lg", tokenValue: "0 10px 15px rgb(0 0 0 / 0.1)", category: "shadow" },
    ];
  }
}
