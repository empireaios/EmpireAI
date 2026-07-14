/** T3-04 — Typography theme token generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeToken } from "./types.js";

export class TypographyThemeGenerator {
  generate(
    themeName: string,
    designSystem: DesignSystemModel | null,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.typographyRulesEnabled) return [];

    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    const tokens: ThemeToken[] = [
      { tokenId: `${prefix}-font-sans`, tokenName: "font-sans", tokenValue: "ui-sans-serif, system-ui, sans-serif", category: "typography" },
      { tokenId: `${prefix}-text-sm`, tokenName: "text-sm", tokenValue: "0.875rem", category: "typography" },
      { tokenId: `${prefix}-text-base`, tokenName: "text-base", tokenValue: "1rem", category: "typography" },
      { tokenId: `${prefix}-text-lg`, tokenName: "text-lg", tokenValue: "1.125rem", category: "typography" },
      { tokenId: `${prefix}-font-semibold`, tokenName: "font-semibold", tokenValue: "600", category: "typography" },
    ];

    if (designSystem?.typographyStandards.length) {
      const std = designSystem.typographyStandards[0]!;
      tokens.push({
        tokenId: `${prefix}-heading`,
        tokenName: "heading",
        tokenValue: `${std.fontSize}px / ${std.lineHeight}`,
        category: "typography",
      });
    }

    return tokens;
  }
}
