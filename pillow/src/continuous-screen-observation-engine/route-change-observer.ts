/** T5-01 — Route and view change detection. */

import { appendObservationLog } from "./observation-logging.js";

export class RouteChangeObserver {
  private lastRouteId: string | null = null;

  observe(currentRouteOrViewId: string | null): string[] {
    const changes: string[] = [];
    if (currentRouteOrViewId === null) return changes;

    if (this.lastRouteId === null) {
      changes.push(`route_initialized:${currentRouteOrViewId}`);
    } else if (this.lastRouteId !== currentRouteOrViewId) {
      changes.push(`route_changed:${this.lastRouteId}->${currentRouteOrViewId}`);
      appendObservationLog({
        event: "route_change_detection",
        level: "info",
        details: `Route changed from ${this.lastRouteId} to ${currentRouteOrViewId}`,
      });
    }

    this.lastRouteId = currentRouteOrViewId;
    return changes;
  }

  resetForTesting(): void {
    this.lastRouteId = null;
  }
}
