/** T1-09 — Rebuild recent interaction history for continuity. */

import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { SessionContinuityConfiguration } from "./configuration.js";

export class RecentInteractionRebuilder {
  rebuild(
    interactionTracking: InteractionTrackingEngine,
    config: SessionContinuityConfiguration,
    fallbackIds: string[] = [],
  ): string[] {
    const events = interactionTracking.getRecentEvents(config.recentHistoryWindow);
    if (events.length > 0) return events.map((e) => e.eventId);
    return fallbackIds.slice(0, config.recentHistoryWindow);
  }
}
