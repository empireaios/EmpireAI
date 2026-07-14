/** T1-08 — UI state history store. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import { sanitizeSerializedState } from "./sensitive-content-sanitizer.js";
import type { VisualMemoryConfiguration } from "./configuration.js";

export class UiStateHistoryStore {
  extractSafe(uiState: UiStateModel, config: VisualMemoryConfiguration) {
    const { sanitized, maskedCount } = sanitizeSerializedState(uiState.serialized, config);
    return {
      stateId: uiState.metadata.stateId,
      screenId: uiState.screen.screenId,
      regionCount: uiState.screen.regions.length,
      changeSummary: uiState.changeSummary,
      sanitizedSerialized: sanitized,
      maskedCount,
    };
  }
}
