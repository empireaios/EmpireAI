/** T3-03 — Executive preference constraints for layout refactoring. */

import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";

export type ExecutiveLayoutConstraints = {
  densityPreference: "compact" | "comfortable" | "spacious";
  alignmentPreference: string;
  navigationStyle: string;
  emphasisPatterns: string[];
};

export class ExecutivePreferenceConstraintEngine {
  buildConstraints(
    executiveStyle: ExecutiveStyleModel | null,
    config: LayoutRefactoringConfiguration,
  ): ExecutiveLayoutConstraints {
    if (!config.executivePreferenceConstraintsEnabled || !executiveStyle) {
      return {
        densityPreference: "comfortable",
        alignmentPreference: "left-aligned",
        navigationStyle: "sidebar-primary",
        emphasisPatterns: ["primary-actions-prominent"],
      };
    }

    const density =
      executiveStyle.preferredVisualDensity === "compact"
        ? "compact"
        : executiveStyle.preferredVisualDensity === "spacious"
          ? "spacious"
          : "comfortable";

    return {
      densityPreference: density,
      alignmentPreference: executiveStyle.preferredLayoutStyles[0] ?? "left-aligned",
      navigationStyle: executiveStyle.preferredNavigationStyles[0] ?? "sidebar-primary",
      emphasisPatterns: executiveStyle.preferredConsistencyRules.slice(0, 3),
    };
  }
}
