/** T3-02 — Component variant generation. */

import type { ComponentCategory, ComponentVariant } from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { appendGenerationLog } from "./generation-logging.js";

export class ComponentVariantGenerator {
  generate(
    componentName: string,
    category: ComponentCategory,
    config: ComponentGeneratorConfiguration,
  ): ComponentVariant[] {
    if (!config.variantRulesEnabled) return [];

    appendGenerationLog({
      event: "variant_generation",
      level: "info",
      details: `Generating variants for ${componentName}`,
    });

    const variants: ComponentVariant[] = [
      {
        variantId: `variant-default`,
        variantName: "default",
        description: "Standard presentation",
      },
    ];

    if (["button", "badge", "alert"].includes(category)) {
      variants.push({
        variantId: "variant-compact",
        variantName: "compact",
        description: "Reduced padding for dense layouts",
      });
    }
    if (["loading_state", "empty_state", "error_state"].includes(category)) {
      variants.push({
        variantId: "variant-inline",
        variantName: "inline",
        description: "Embedded within parent layout",
      });
    }

    return variants;
  }
}
