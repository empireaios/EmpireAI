/** T3-01 — Executive preference constraints for code generation. */

import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";

export class ExecutivePreferenceConstraintEngine {
  buildConstraints(
    executiveStyle: ExecutiveStyleModel | null,
    config: FrontendBuilderConfiguration,
  ): string[] {
    if (!config.executivePreferenceConstraintsEnabled || !executiveStyle) {
      return ["Executive style constraints unavailable — preserve current executive UI density"];
    }

    const constraints: string[] = [
      `Executive style ID: ${executiveStyle.executiveStyleId}`,
      `Visual density: ${executiveStyle.preferredVisualDensity}`,
    ];

    if (executiveStyle.preferredLayoutStyles.length > 0) {
      constraints.push(`Layout: ${executiveStyle.preferredLayoutStyles.slice(0, 2).join(", ")}`);
    }
    if (executiveStyle.preferredNavigationStyles.length > 0) {
      constraints.push(
        `Navigation: ${executiveStyle.preferredNavigationStyles.slice(0, 2).join(", ")}`,
      );
    }
    if (executiveStyle.preferredConsistencyRules.length > 0) {
      constraints.push(
        `Consistency: ${executiveStyle.preferredConsistencyRules.slice(0, 2).join(", ")}`,
      );
    }

    return constraints;
  }
}
