/** T3-04 — Executive preference constraints for theme generation. */

import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";

export class ExecutivePreferenceThemeConstraintEngine {
  buildConstraints(
    executiveStyle: ExecutiveStyleModel | null,
    config: ThemeBuilderConfiguration,
  ): string[] {
    if (!config.executivePreferenceConstraintsEnabled || !executiveStyle) {
      return ["Preserve executive visual density and color preferences"];
    }

    return [
      `Executive style ID: ${executiveStyle.executiveStyleId}`,
      `Visual density: ${executiveStyle.preferredVisualDensity}`,
      ...executiveStyle.preferredColorPreferences.slice(0, 2).map((c) => `Color pref: ${c}`),
      ...executiveStyle.preferredTypography.slice(0, 2).map((t) => `Typography pref: ${t}`),
    ];
  }
}
