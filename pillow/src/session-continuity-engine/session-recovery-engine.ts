/** T1-09 — Session recovery after interruption or restart. */

import { appendContinuityLog } from "./continuity-logging.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import type { ContextRehydrationEngine } from "./context-rehydration-engine.js";
import type { NavigationPositionRestorer } from "./navigation-position-restorer.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { SessionContextStore } from "./session-context-store.js";
import type { SessionChangeSummary, SessionContinuityModel } from "./types.js";

export class SessionRecoveryEngine {
  constructor(
    private rehydration: ContextRehydrationEngine,
    private navigationRestorer: NavigationPositionRestorer,
  ) {}

  recover(input: {
    current: SessionContinuityModel;
    changes: SessionChangeSummary;
    visualMemory: VisualMemoryEngine;
    navigationMapping: NavigationMappingEngine;
    store: SessionContextStore;
  }): SessionContinuityModel | null {
    if (!input.changes.recoveryRequired && !input.changes.interruptionDetected) {
      return null;
    }

    appendContinuityLog({
      event: "session_recovery",
      level: "info",
      details: `Recovering session ${input.current.sessionId}`,
    });

    let recovered = this.rehydration.rehydrate(
      input.visualMemory,
      input.store,
      input.current,
    );

    const nav = this.navigationRestorer.restore(
      input.navigationMapping,
      input.visualMemory,
      input.store.getSnapshot()?.lastContinuity ?? null,
    );
    recovered = {
      ...recovered,
      currentNavigationNodeId: nav.navigationNodeId ?? recovered.currentNavigationNodeId,
      currentRouteOrViewId: nav.routeOrViewId ?? recovered.currentRouteOrViewId,
      continuityConfidence: Math.round(
        ((recovered.continuityConfidence + nav.confidence) / 2) * 100,
      ) / 100,
      recoveryStatus: nav.navigationNodeId ? "completed" : "partial",
    };

    return recovered;
  }
}
