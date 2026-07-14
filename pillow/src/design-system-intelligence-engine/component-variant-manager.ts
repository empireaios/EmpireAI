/** T2-02 — Component variant detection. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { ComponentVariantEntry, DesignSystemComponent, SizeVariant } from "./types.js";

function resolveSizeVariant(width: number, height: number): SizeVariant {
  const area = width * height;
  if (area < 2000) return "xs";
  if (area < 8000) return "sm";
  if (area < 20000) return "md";
  if (area < 50000) return "lg";
  return "xl";
}

export class ComponentVariantManager {
  detectVariant(component: UiComponent): { variantName: string; sizeVariant: SizeVariant } {
    const sizeVariant = resolveSizeVariant(component.size.width, component.size.height);
    const stateSuffix = component.active
      ? "active"
      : component.selected
        ? "selected"
        : component.enabled
          ? "default"
          : "disabled";
    return {
      variantName: `${component.componentType}-${sizeVariant}-${stateSuffix}`,
      sizeVariant,
    };
  }

  buildVariants(components: DesignSystemComponent[]): ComponentVariantEntry[] {
    const byVariant = new Map<string, DesignSystemComponent[]>();
    for (const component of components) {
      const key = component.componentVariant;
      const list = byVariant.get(key) ?? [];
      list.push(component);
      byVariant.set(key, list);
    }

    return [...byVariant.entries()].map(([variantName, items]) => ({
      variantId: `variant-${variantName}`,
      baseComponentType: items[0]!.componentCategory.split("/").pop() ?? "unknown",
      variantName,
      sizeVariant: items[0]!.sizeVariants[0] ?? "md",
      componentIds: items.map((c) => c.componentId),
      usageCount: items.reduce((sum, c) => sum + c.usageCount, 0),
    }));
  }
}
