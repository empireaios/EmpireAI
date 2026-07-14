/** T2-07 — Shared consistency helpers. */

import type { SizeVariant } from "../design-system-intelligence-engine/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";

export function inferSizeVariant(component: UiComponent): SizeVariant {
  const area = component.size.width * component.size.height;
  if (area < 1200) return "xs";
  if (area < 4000) return "sm";
  if (area < 12000) return "md";
  if (area < 30000) return "lg";
  return "xl";
}

export function nearestSpacingToken(
  distance: number,
  tokens: { valuePx: number }[],
): { valuePx: number; delta: number } | null {
  if (tokens.length === 0) return null;
  let best = tokens[0]!;
  let bestDelta = Math.abs(distance - best.valuePx);
  for (const token of tokens) {
    const delta = Math.abs(distance - token.valuePx);
    if (delta < bestDelta) {
      best = token;
      bestDelta = delta;
    }
  }
  return { valuePx: best.valuePx, delta: bestDelta };
}

export function groupByType(components: UiComponent[]): Map<string, UiComponent[]> {
  const map = new Map<string, UiComponent[]>();
  for (const c of components) {
    const list = map.get(c.componentType) ?? [];
    list.push(c);
    map.set(c.componentType, list);
  }
  return map;
}
