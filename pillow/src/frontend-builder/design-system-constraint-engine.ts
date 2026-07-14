/** T3-01 — Design system constraints for code generation. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";

export class DesignSystemConstraintEngine {
  buildConstraints(
    designSystem: DesignSystemModel | null,
    config: FrontendBuilderConfiguration,
  ): string[] {
    if (!config.designSystemConstraintsEnabled || !designSystem) {
      return ["Design system constraints unavailable — use existing PlatformPrimitives"];
    }

    const constraints: string[] = [
      `Design system ID: ${designSystem.designSystemId}`,
      "Use PlatformPrimitives (Panel, DataTable) from @/components/platform/ui/PlatformPrimitives",
      "Match existing Tailwind utility patterns in empireai-web",
    ];

    if (designSystem.typographyStandards.length > 0) {
      const first = designSystem.typographyStandards[0];
      if (first) {
        constraints.push(`Typography: follow ${first.name} token standards`);
      }
    }
    if (designSystem.colorPalette.length > 0) {
      constraints.push("Colors: use semantic tokens (primary, muted-foreground, destructive)");
    }
    if (designSystem.spacingScale.length > 0) {
      constraints.push("Spacing: preserve gap-4 / space-y-4 grid conventions");
    }

    return constraints;
  }
}
