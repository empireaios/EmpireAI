/** R1-01 — Connector lifecycle management. */

import { appendFrameworkLog } from "./mcf-logging.js";
import type { ConnectorRegistry } from "./connector-registry.js";
import type { ConnectorState } from "./types.js";

const TRANSITIONS: Record<ConnectorState, ConnectorState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class ConnectorLifecycleManager {
  canTransition(from: ConnectorState, to: ConnectorState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: ConnectorRegistry,
    marketplaceId: string,
    target: ConnectorState,
  ): { ok: boolean; record: ReturnType<ConnectorRegistry["get"]>; error?: string } {
    const current = registry.get(marketplaceId);
    if (!current) {
      return { ok: false, record: null, error: "Connector not found" };
    }
    if (!this.canTransition(current.currentState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.currentState} → ${target}`,
      };
    }
    const updated = registry.updateState(marketplaceId, target);
    appendFrameworkLog({
      event: `connector_${target}`,
      level: "info",
      details: `${marketplaceId}: ${current.currentState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: ConnectorRegistry, marketplaceId: string) {
    return this.transition(registry, marketplaceId, "initialized");
  }

  activate(registry: ConnectorRegistry, marketplaceId: string) {
    return this.transition(registry, marketplaceId, "active");
  }

  suspend(registry: ConnectorRegistry, marketplaceId: string) {
    return this.transition(registry, marketplaceId, "suspended");
  }

  shutdown(registry: ConnectorRegistry, marketplaceId: string) {
    return this.transition(registry, marketplaceId, "shutdown");
  }
}
