/** T1-02 — Deterministic UI state serialization. */

import type { SerializationFormat, UiStateModel } from "./types.js";

export function serializeUiState(
  model: Omit<UiStateModel, "serialized">,
  format: SerializationFormat,
): string {
  const payload = {
    metadata: model.metadata,
    screen: model.screen,
    changeSummary: model.changeSummary,
  };

  if (format === "compact-json") {
    return JSON.stringify(payload);
  }
  return JSON.stringify(payload, null, 2);
}

export function parseSerializedUiState(serialized: string): {
  metadata: UiStateModel["metadata"];
  screen: UiStateModel["screen"];
  changeSummary: UiStateModel["changeSummary"];
} {
  return JSON.parse(serialized) as {
    metadata: UiStateModel["metadata"];
    screen: UiStateModel["screen"];
    changeSummary: UiStateModel["changeSummary"];
  };
}
