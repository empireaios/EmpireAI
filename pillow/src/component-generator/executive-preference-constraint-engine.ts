/** T3-02 — Executive preference constraints for component generation. */

import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";

export class ExecutivePreferenceConstraintEngine {
  buildConstraints(
    executiveStyle: ExecutiveStyleModel | null,
    config: ComponentGeneratorConfiguration,
  ): string[] {
    if (!config.executivePreferenceConstraintsEnabled || !executiveStyle) {
      return ["Preserve executive UI density and navigation conventions"];
    }

    const constraints: string[] = [
      `Executive style ID: ${executiveStyle.executiveStyleId}`,
      `Visual density: ${executiveStyle.preferredVisualDensity}`,
    ];

    if (executiveStyle.preferredComponentStyles.length > 0) {
      constraints.push(
        `Component style: ${executiveStyle.preferredComponentStyles.slice(0, 2).join(", ")}`,
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
