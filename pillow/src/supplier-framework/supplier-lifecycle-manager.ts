/** R2-01 — Supplier lifecycle management. */

import { appendFrameworkLog } from "./sf-logging.js";
import type { SupplierConnectorRegistry } from "./supplier-connector-registry.js";
import type { ConnectorState } from "./types.js";

const TRANSITIONS: Record<ConnectorState, ConnectorState[]> = {
  registered: ["initialized", "failed"],
  initialized: ["active", "suspended", "failed"],
  active: ["suspended", "shutdown", "failed"],
  suspended: ["active", "shutdown", "failed"],
  shutdown: [],
  failed: ["registered", "initialized"],
};

export class SupplierLifecycleManager {
  canTransition(from: ConnectorState, to: ConnectorState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(
    registry: SupplierConnectorRegistry,
    supplierIdentifier: string,
    target: ConnectorState,
  ): { ok: boolean; record: ReturnType<SupplierConnectorRegistry["get"]>; error?: string } {
    const current = registry.get(supplierIdentifier);
    if (!current) {
      return { ok: false, record: null, error: "Supplier connector not found" };
    }
    if (!this.canTransition(current.operationalState, target)) {
      return {
        ok: false,
        record: current,
        error: `Invalid transition ${current.operationalState} → ${target}`,
      };
    }
    const updated = registry.updateState(supplierIdentifier, target);
    appendFrameworkLog({
      event: `supplier_${target}`,
      level: "info",
      details: `${supplierIdentifier}: ${current.operationalState} → ${target}`,
    });
    return { ok: true, record: updated };
  }

  initialize(registry: SupplierConnectorRegistry, supplierIdentifier: string) {
    return this.transition(registry, supplierIdentifier, "initialized");
  }

  activate(registry: SupplierConnectorRegistry, supplierIdentifier: string) {
    return this.transition(registry, supplierIdentifier, "active");
  }

  suspend(registry: SupplierConnectorRegistry, supplierIdentifier: string) {
    return this.transition(registry, supplierIdentifier, "suspended");
  }

  shutdown(registry: SupplierConnectorRegistry, supplierIdentifier: string) {
    return this.transition(registry, supplierIdentifier, "shutdown");
  }
}
