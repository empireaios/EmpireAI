import type { ApiRuntimeConfiguration } from "./configuration.js";
import type { ApiStore } from "./api-store.js";
import type { CircuitState } from "./types.js";

type CircuitTracker = {
  consecutiveFailures: number;
  state: CircuitState;
};

export class CircuitBreaker {
  private trackers = new Map<string, CircuitTracker>();

  resetForTesting() {
    this.trackers.clear();
  }

  getState(apiId: string): CircuitState {
    return this.trackers.get(apiId)?.state ?? "closed";
  }

  /** Fail if circuit is open. */
  check(store: ApiStore, apiId: string): { allowed: boolean; circuitState: CircuitState } {
    const tracker = this.trackers.get(apiId) ?? { consecutiveFailures: 0, state: "closed" as CircuitState };
    const circuitState = tracker.state;
    store.updateProvider(apiId, { circuitState });

    if (circuitState === "open") {
      return { allowed: false, circuitState };
    }
    return { allowed: true, circuitState };
  }

  recordSuccess(store: ApiStore, apiId: string) {
    this.trackers.set(apiId, { consecutiveFailures: 0, state: "closed" });
    store.updateProvider(apiId, { circuitState: "closed" });
  }

  recordFailure(store: ApiStore, apiId: string, config: ApiRuntimeConfiguration) {
    const tracker = this.trackers.get(apiId) ?? { consecutiveFailures: 0, state: "closed" as CircuitState };
    tracker.consecutiveFailures += 1;

    if (tracker.consecutiveFailures >= config.circuitFailureThreshold) {
      tracker.state = "open";
    } else if (tracker.state === "closed" && tracker.consecutiveFailures > 0) {
      tracker.state = "half_open";
    }

    this.trackers.set(apiId, tracker);
    store.updateProvider(apiId, { circuitState: tracker.state });
    return tracker.state;
  }

  /** Transition open → half_open for probe (structural). */
  halfOpen(store: ApiStore, apiId: string) {
    const tracker = this.trackers.get(apiId) ?? { consecutiveFailures: 0, state: "open" as CircuitState };
    if (tracker.state === "open") {
      tracker.state = "half_open";
      this.trackers.set(apiId, tracker);
      store.updateProvider(apiId, { circuitState: "half_open" });
    }
    return tracker.state;
  }
}
