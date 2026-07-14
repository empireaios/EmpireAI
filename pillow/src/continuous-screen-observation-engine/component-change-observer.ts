/** T5-01 — Component set change detection. */

import { appendObservationLog } from "./observation-logging.js";

export class ComponentChangeObserver {
  private lastComponentSetId: string | null = null;

  observe(currentComponentSetId: string | null): string[] {
    const changes: string[] = [];
    if (currentComponentSetId === null) return changes;

    if (this.lastComponentSetId === null) {
      changes.push(`components_initialized:${currentComponentSetId}`);
    } else if (this.lastComponentSetId !== currentComponentSetId) {
      changes.push(`components_changed:${this.lastComponentSetId}->${currentComponentSetId}`);
      appendObservationLog({
        event: "component_change_detection",
        level: "info",
        details: `Component set changed from ${this.lastComponentSetId} to ${currentComponentSetId}`,
      });
    }

    this.lastComponentSetId = currentComponentSetId;
    return changes;
  }

  resetForTesting(): void {
    this.lastComponentSetId = null;
  }
}
