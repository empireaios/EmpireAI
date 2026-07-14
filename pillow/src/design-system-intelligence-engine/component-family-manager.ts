/** T2-02 — Component family grouping. */

import type { DesignSystemComponent, ComponentFamilyEntry } from "./types.js";

export class ComponentFamilyManager {
  buildFamilies(components: DesignSystemComponent[]): ComponentFamilyEntry[] {
    const byFamily = new Map<string, DesignSystemComponent[]>();
    for (const component of components) {
      const key = component.componentFamily;
      const list = byFamily.get(key) ?? [];
      list.push(component);
      byFamily.set(key, list);
    }

    return [...byFamily.entries()].map(([familyName, items]) => {
      const variants = new Set(items.map((c) => c.componentVariant));
      return {
        familyId: `family-${familyName}`,
        familyName: familyName as ComponentFamilyEntry["familyName"],
        componentIds: items.map((c) => c.componentId),
        variantCount: variants.size,
        description: `${items.length} components in ${familyName} family`,
      };
    });
  }
}
