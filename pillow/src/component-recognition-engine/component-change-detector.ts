/** T1-03 — Component change detection between recognition results. */

import type {
  ComponentChangeSummary,
  ComponentRecognitionResult,
  ComponentType,
} from "./types.js";

export function detectComponentChanges(
  previous: ComponentRecognitionResult | null,
  current: ComponentRecognitionResult,
): ComponentChangeSummary {
  if (!previous) {
    return {
      hasChanges: true,
      appeared: current.components.map((c) => c.componentId),
      disappeared: [],
      changed: [],
      unchanged: [],
      changes: current.components.map((c) => ({
        componentId: c.componentId,
        kind: "appeared" as const,
        previousType: null,
        currentType: c.componentType,
      })),
    };
  }

  const prevById = new Map(previous.components.map((c) => [c.componentId, c]));
  const currById = new Map(current.components.map((c) => [c.componentId, c]));

  const appeared: string[] = [];
  const disappeared: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];
  const changes: ComponentChangeSummary["changes"] = [];

  for (const [id, component] of currById) {
    const prev = prevById.get(id);
    if (!prev) {
      appeared.push(id);
      changes.push({
        componentId: id,
        kind: "appeared",
        previousType: null,
        currentType: component.componentType,
      });
    } else if (
      prev.componentType !== component.componentType ||
      prev.bounds.width !== component.bounds.width ||
      prev.bounds.height !== component.bounds.height ||
      prev.visibility !== component.visibility
    ) {
      changed.push(id);
      changes.push({
        componentId: id,
        kind: "changed",
        previousType: prev.componentType,
        currentType: component.componentType,
      });
    } else {
      unchanged.push(id);
      changes.push({
        componentId: id,
        kind: "unchanged",
        previousType: prev.componentType,
        currentType: component.componentType,
      });
    }
  }

  for (const id of prevById.keys()) {
    if (!currById.has(id)) {
      disappeared.push(id);
      changes.push({
        componentId: id,
        kind: "disappeared",
        previousType: prevById.get(id)!.componentType,
        currentType: null,
      });
    }
  }

  return {
    hasChanges: appeared.length > 0 || disappeared.length > 0 || changed.length > 0,
    appeared,
    disappeared,
    changed,
    unchanged,
    changes,
  };
}
