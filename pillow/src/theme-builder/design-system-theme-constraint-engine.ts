/** T3-04 — Design system constraints for theme generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";

export class DesignSystemThemeConstraintEngine {
  buildConstraints(
    designSystem: DesignSystemModel | null,
    config: ThemeBuilderConfiguration,
  ): string[] {
    if (!config.designSystemConstraintsEnabled || !designSystem) {
      return ["Use semantic Tailwind tokens: primary, background, foreground, border"];
    }

    return [
      `Design system ID: ${designSystem.designSystemId}`,
      "Preserve existing token naming conventions",
      ...designSystem.colorPalette.slice(0, 3).map((c) => `Color: ${c.name}`),
      ...designSystem.typographyStandards.slice(0, 2).map((t) => `Typography: ${t.name}`),
    ];
  }
}
