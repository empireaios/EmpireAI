/** T3-04 — Interaction state theme token generation. */

import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeScope, ThemeToken } from "./types.js";

export class InteractionStateThemeGenerator {
  generate(
    themeName: string,
    scope: ThemeScope,
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    if (!config.interactionStateRulesEnabled) return [];

    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    const tokens: ThemeToken[] = [
      { tokenId: `${prefix}-hover`, tokenName: "hover", tokenValue: "opacity: 0.9", category: "interaction" },
      { tokenId: `${prefix}-focus`, tokenName: "focus", tokenValue: "ring-2 ring-primary ring-offset-2", category: "interaction" },
      { tokenId: `${prefix}-active`, tokenName: "active", tokenValue: "scale(0.98)", category: "interaction" },
      { tokenId: `${prefix}-disabled`, tokenName: "disabled", tokenValue: "opacity: 0.5; pointer-events: none", category: "interaction" },
    ];

    if (scope === "button" || scope === "form") {
      tokens.push({
        tokenId: `${prefix}-focus-visible`,
        tokenName: "focus-visible",
        tokenValue: "outline-none focus-visible:ring-2",
        category: "interaction",
      });
    }

    if (scope === "responsive_visual_states") {
      tokens.push({
        tokenId: `${prefix}-responsive-hover`,
        tokenName: "responsive-hover",
        tokenValue: "md:hover:opacity-90",
        category: "interaction",
      });
    }

    return tokens;
  }
}
