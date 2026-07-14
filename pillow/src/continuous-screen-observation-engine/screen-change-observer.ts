/** T5-01 — Screen change detection. */

import { appendObservationLog } from "./observation-logging.js";

export class ScreenChangeObserver {
  private lastScreenId: string | null = null;

  observe(currentScreenId: string | null): string[] {
    const changes: string[] = [];
    if (currentScreenId === null) return changes;

    if (this.lastScreenId === null) {
      changes.push(`screen_initialized:${currentScreenId}`);
    } else if (this.lastScreenId !== currentScreenId) {
      changes.push(`screen_changed:${this.lastScreenId}->${currentScreenId}`);
      appendObservationLog({
        event: "screen_change_detection",
        level: "info",
        details: `Screen changed from ${this.lastScreenId} to ${currentScreenId}`,
      });
    }

    this.lastScreenId = currentScreenId;
    return changes;
  }

  resetForTesting(): void {
    this.lastScreenId = null;
  }
}
