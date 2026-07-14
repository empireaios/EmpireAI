/** T5-01 — Layout change detection. */

import { appendObservationLog } from "./observation-logging.js";

export class LayoutChangeObserver {
  private lastLayoutId: string | null = null;

  observe(currentLayoutId: string | null): string[] {
    const changes: string[] = [];
    if (currentLayoutId === null) return changes;

    if (this.lastLayoutId === null) {
      changes.push(`layout_initialized:${currentLayoutId}`);
    } else if (this.lastLayoutId !== currentLayoutId) {
      changes.push(`layout_changed:${this.lastLayoutId}->${currentLayoutId}`);
      appendObservationLog({
        event: "layout_change_detection",
        level: "info",
        details: `Layout changed from ${this.lastLayoutId} to ${currentLayoutId}`,
      });
    }

    this.lastLayoutId = currentLayoutId;
    return changes;
  }

  resetForTesting(): void {
    this.lastLayoutId = null;
  }
}
