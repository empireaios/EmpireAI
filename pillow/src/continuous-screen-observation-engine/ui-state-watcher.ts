/** T5-01 — UI surface state watcher (loading, empty, error, modal, drawer, tab). */

import { appendObservationLog } from "./observation-logging.js";
import type { UiSurfaceState } from "./types.js";

export class UiStateWatcher {
  private lastSurfaceStates: UiSurfaceState[] = [];

  observe(surfaceStates: UiSurfaceState[]): string[] {
    const changes: string[] = [];
    const previous = new Set(this.lastSurfaceStates);
    const current = new Set(surfaceStates);

    for (const state of surfaceStates) {
      if (!previous.has(state)) {
        changes.push(`state_entered:${state}`);
        appendObservationLog({
          event: "ui_state_change",
          level: "info",
          details: `UI state entered: ${state}`,
        });
      }
    }

    for (const state of this.lastSurfaceStates) {
      if (!current.has(state)) {
        changes.push(`state_exited:${state}`);
      }
    }

    this.lastSurfaceStates = [...surfaceStates];
    return changes;
  }

  resetForTesting(): void {
    this.lastSurfaceStates = [];
  }
}
