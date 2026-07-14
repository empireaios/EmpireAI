/** T3-04 — Component theme variant token generation. */

import type { ComponentGenerationRecord } from "../component-generator/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeScope, ThemeToken } from "./types.js";

export class ComponentThemeVariantGenerator {
  generate(
    themeName: string,
    scope: ThemeScope,
    relatedComponents: ComponentGenerationRecord[],
    config: ThemeBuilderConfiguration,
  ): ThemeToken[] {
    void config;
    const prefix = `--${themeName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    const tokens: ThemeToken[] = [];

    for (const component of relatedComponents.slice(0, 5)) {
      for (const variant of component.generatedVariants.slice(0, 2)) {
        tokens.push({
          tokenId: `${prefix}-${component.componentName}-${variant.variantName}`,
          tokenName: `${component.componentName}-${variant.variantName}`,
          tokenValue: variant.description,
          category: "component-variant",
        });
      }
    }

    if (tokens.length === 0) {
      tokens.push({
        tokenId: `${prefix}-${scope}-default`,
        tokenName: `${scope}-default`,
        tokenValue: "default variant",
        category: "component-variant",
      });
    }

    return tokens;
  }
}
