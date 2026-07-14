/** T1-03 — Component hierarchy mapping from UI state. */

import type { UiComponent } from "./types.js";

export function buildComponentHierarchy(
  components: UiComponent[],
): { componentId: string; children: string[] }[] {
  const ids = new Set(components.map((c) => c.componentId));
  const hierarchy: { componentId: string; children: string[] }[] = [];

  for (const component of components) {
    hierarchy.push({
      componentId: component.componentId,
      children: component.childComponentIds.filter((id) => ids.has(id)),
    });
  }

  const roots = components.filter(
    (c) => !c.parentComponentId || !ids.has(c.parentComponentId),
  );
  if (roots.length > 0 && !hierarchy.some((h) => h.componentId === "screen-root")) {
    hierarchy.unshift({
      componentId: "screen-root",
      children: roots.map((r) => r.componentId),
    });
  }

  return hierarchy;
}
