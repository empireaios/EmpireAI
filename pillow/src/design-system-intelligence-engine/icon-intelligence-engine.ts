/** T2-02 — Icon standards intelligence. */

import type { DesignSystemComponent } from "./types.js";
import type { IconStandard } from "./types.js";

export class IconIntelligenceEngine {
  learn(components: DesignSystemComponent[]): IconStandard[] {
    const icons = components.filter(
      (c) => c.componentCategory.includes("icon") || c.componentFamily === "media",
    );

    if (icons.length === 0) {
      return [
        {
          iconId: "icon-default",
          name: "Default Icon",
          category: "ui",
          sizePx: 24,
          usage: "Standard inline icon size",
        },
      ];
    }

    return icons.map((icon, index) => ({
      iconId: `icon-${icon.componentId}`,
      name: icon.componentName,
      category: icon.componentFamily,
      sizePx: icon.sizeVariants.includes("xs") ? 16 : icon.sizeVariants.includes("sm") ? 20 : 24,
      usage: `Observed icon component (${icon.usageCount} uses)`,
    }));
  }
}
