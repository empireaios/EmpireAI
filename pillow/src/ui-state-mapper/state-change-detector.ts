/** T1-02 — State change detection between consecutive UI models. */

import type { StateChangeSummary, UiStateModel } from "./types.js";

export function detectStateChanges(
  previous: UiStateModel | null,
  current: UiStateModel,
): StateChangeSummary {
  if (!previous) {
    return {
      hasChanges: true,
      appeared: current.screen.regions.map((r) => r.regionId),
      disappeared: [],
      modified: [],
      unchanged: [],
      changes: current.screen.regions.map((r) => ({
        regionId: r.regionId,
        kind: "appeared" as const,
        previousSignature: null,
        currentSignature: r.contentSignature,
      })),
    };
  }

  const prevById = new Map(previous.screen.regions.map((r) => [r.regionId, r]));
  const currById = new Map(current.screen.regions.map((r) => [r.regionId, r]));

  const appeared: string[] = [];
  const disappeared: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];
  const changes: StateChangeSummary["changes"] = [];

  for (const [id, region] of currById) {
    const prev = prevById.get(id);
    if (!prev) {
      appeared.push(id);
      changes.push({
        regionId: id,
        kind: "appeared",
        previousSignature: null,
        currentSignature: region.contentSignature,
      });
    } else if (prev.contentSignature !== region.contentSignature) {
      modified.push(id);
      changes.push({
        regionId: id,
        kind: "modified",
        previousSignature: prev.contentSignature,
        currentSignature: region.contentSignature,
      });
    } else {
      unchanged.push(id);
      changes.push({
        regionId: id,
        kind: "unchanged",
        previousSignature: prev.contentSignature,
        currentSignature: region.contentSignature,
      });
    }
  }

  for (const id of prevById.keys()) {
    if (!currById.has(id)) {
      disappeared.push(id);
      changes.push({
        regionId: id,
        kind: "disappeared",
        previousSignature: prevById.get(id)!.contentSignature,
        currentSignature: null,
      });
    }
  }

  return {
    hasChanges: appeared.length > 0 || disappeared.length > 0 || modified.length > 0,
    appeared,
    disappeared,
    modified,
    unchanged,
    changes,
  };
}
