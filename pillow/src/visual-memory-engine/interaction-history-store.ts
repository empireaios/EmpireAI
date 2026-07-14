/** T1-08 — Interaction history store. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";

export class InteractionHistoryStore {
  extractSafe(events: InteractionEvent[]) {
    return events.map((e) => ({
      eventId: e.eventId,
      interactionType: e.interactionType,
      timestamp: e.timestamp,
      sourceComponentId: e.sourceComponentId,
      sourceLayoutRegionId: e.sourceLayoutRegionId,
      confidence: e.confidence,
      previousValue: e.previousValue,
      newValue: e.newValue,
    }));
  }
}
