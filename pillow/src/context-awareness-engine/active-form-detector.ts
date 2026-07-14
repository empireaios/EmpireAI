/** T1-07 — Active form detection from layout and components. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";

export class ActiveFormDetector {
  detect(
    layout: LayoutModel | null,
    recognition: ComponentRecognitionResult | null,
  ): string[] {
    const formIds: string[] = [];

    if (layout) {
      for (const region of layout.regions) {
        if (region.regionType === "form_area") {
          formIds.push(region.regionId);
        }
      }
    }

    if (recognition) {
      for (const component of recognition.components) {
        if (component.componentType === "form") {
          formIds.push(component.componentId);
        }
        const regionId = layout?.componentToRegion[component.componentId];
        if (regionId && layout?.regions.find((r) => r.regionId === regionId)?.regionType === "form_area") {
          if (!formIds.includes(component.componentId)) {
            formIds.push(component.componentId);
          }
        }
      }
    }

    return [...new Set(formIds)];
  }
}
