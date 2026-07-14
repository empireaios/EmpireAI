/** T3-03 — Design system constraints for layout refactoring. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";

export type DesignSystemLayoutConstraints = {
  spacingScale: string[];
  alignmentTokens: string[];
  gridPatterns: string[];
  colorTokens: string[];
};

export class DesignSystemConstraintEngine {
  buildConstraints(
    designSystem: DesignSystemModel | null,
    config: LayoutRefactoringConfiguration,
  ): DesignSystemLayoutConstraints {
    if (!config.designSystemConstraintsEnabled || !designSystem) {
      return {
        spacingScale: ["gap-2", "gap-4", "gap-6"],
        alignmentTokens: ["items-center", "justify-between"],
        gridPatterns: ["grid", "flex"],
        colorTokens: ["bg-background", "text-foreground"],
      };
    }

    return {
      spacingScale: designSystem.spacingScale.map((t) => t.name).slice(0, 5),
      alignmentTokens: designSystem.layoutStandards[0]?.alignmentRules ?? [
        "items-center",
        "justify-between",
      ],
      gridPatterns: designSystem.layoutStandards.map((s) => s.name).slice(0, 3),
      colorTokens: designSystem.colorPalette.map((c) => c.name).slice(0, 4),
    };
  }
}
