/** R2-15 — Warehouse Registry. */

import { appendMwsLog } from "./mws-logging.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import type { WarehouseIdentifier } from "./types.js";
import { listRegisteredWarehouseIds } from "./network-fixtures.js";

export class WarehouseRegistry {
  private registered = new Set<WarehouseIdentifier>();

  register(warehouseId: WarehouseIdentifier, config: MultiWarehouseSupportConfiguration): boolean {
    if (!config.warehouseRegistrationRulesEnabled) return false;
    if (this.registered.has(warehouseId)) return false;
    this.registered.add(warehouseId);
    appendMwsLog({
      event: "warehouse_registration",
      level: "info",
      details: `Registered warehouse ${warehouseId}`,
    });
    return true;
  }

  registerAll(config: MultiWarehouseSupportConfiguration, ids?: WarehouseIdentifier[]): WarehouseIdentifier[] {
    const targets = ids ?? listRegisteredWarehouseIds();
    const added: WarehouseIdentifier[] = [];
    for (const id of targets) {
      if (this.register(id, config)) added.push(id);
    }
    return added;
  }

  isRegistered(warehouseId: WarehouseIdentifier): boolean {
    return this.registered.has(warehouseId);
  }

  getRegistered(): WarehouseIdentifier[] {
    return [...this.registered];
  }

  resetForTesting(): void {
    this.registered.clear();
  }
}
