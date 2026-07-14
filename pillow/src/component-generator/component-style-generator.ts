/** T3-02 — Component style generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ComponentCategory } from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { DesignSystemConstraintEngine } from "./design-system-constraint-engine.js";

export class ComponentStyleGenerator {
  private readonly designEngine = new DesignSystemConstraintEngine();

  generate(
    designSystem: DesignSystemModel | null,
    category: ComponentCategory,
    config: ComponentGeneratorConfiguration,
  ): string[] {
    if (!config.stylingRulesEnabled) return ["className=\"\""];
    return this.designEngine.buildStyling(designSystem, category);
  }
}
