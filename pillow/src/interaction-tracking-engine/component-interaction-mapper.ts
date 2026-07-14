/** T1-06 — Map interactions to T1-03 component IDs. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";

export class ComponentInteractionMapper {
  findComponent(
    recognition: ComponentRecognitionResult | null,
    componentId: string | null,
  ): UiComponent | null {
    if (!recognition || !componentId) return null;
    return recognition.components.find((c) => c.componentId === componentId) ?? null;
  }

  resolveComponentAtPointer(
    recognition: ComponentRecognitionResult | null,
    x: number,
    y: number,
  ): UiComponent | null {
    if (!recognition) return null;
    for (const component of recognition.components) {
      const { bounds } = component;
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return component;
      }
    }
    return null;
  }

  inferChangedComponentEvents(
    previous: ComponentRecognitionResult | null,
    current: ComponentRecognitionResult,
  ): { componentId: string; componentType: string; changed: boolean; selected: boolean }[] {
    if (!previous) return [];
    const events: { componentId: string; componentType: string; changed: boolean; selected: boolean }[] = [];
    const prevById = new Map(previous.components.map((c) => [c.componentId, c]));

    for (const component of current.components) {
      const prev = prevById.get(component.componentId);
      if (!prev) continue;
      const changed =
        prev.selected !== component.selected ||
        prev.active !== component.active ||
        prev.visibility !== component.visibility;
      if (changed) {
        events.push({
          componentId: component.componentId,
          componentType: component.componentType,
          changed: true,
          selected: component.selected,
        });
      }
    }
    return events;
  }
}
