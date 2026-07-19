/** R2-15 — Warehouse Transfer Engine. */

import { appendMwsLog } from "./mws-logging.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import type { InventoryTransferStatus, TransferInventoryInput, WarehouseNetworkRecord } from "./types.js";

export type TransferResult = {
  success: boolean;
  transferStatus: InventoryTransferStatus;
  sourceRecord: WarehouseNetworkRecord | null;
  targetRecord: WarehouseNetworkRecord | null;
  error: string | null;
};

export class WarehouseTransferEngine {
  transfer(
    records: WarehouseNetworkRecord[],
    input: TransferInventoryInput,
    config: MultiWarehouseSupportConfiguration,
  ): TransferResult {
    if (!config.inventoryTransferRulesEnabled) {
      return {
        success: false,
        transferStatus: "failed",
        sourceRecord: null,
        targetRecord: null,
        error: "Inventory transfer rules disabled",
      };
    }

    if (input.sourceWarehouseId === input.targetWarehouseId) {
      return {
        success: false,
        transferStatus: "failed",
        sourceRecord: null,
        targetRecord: null,
        error: "Source and target warehouse must differ",
      };
    }

    const source = records.find((r) => r.warehouseId === input.sourceWarehouseId);
    const target = records.find((r) => r.warehouseId === input.targetWarehouseId);
    if (!source || !target) {
      return {
        success: false,
        transferStatus: "failed",
        sourceRecord: source ?? null,
        targetRecord: target ?? null,
        error: "Missing warehouse network record",
      };
    }

    if (source.inventoryAllocation < input.quantity) {
      return {
        success: false,
        transferStatus: "failed",
        sourceRecord: source,
        targetRecord: target,
        error: "Insufficient inventory at source warehouse",
      };
    }

    const fixtureFailed = input.transferFixtureMode === "failed";
    if (fixtureFailed) {
      appendMwsLog({
        event: "inventory_transfer",
        level: "warn",
        details: `Transfer failed ${input.sourceWarehouseId} → ${input.targetWarehouseId}`,
      });
      return {
        success: false,
        transferStatus: "failed",
        sourceRecord: { ...source, inventoryTransferStatus: "failed" },
        targetRecord: target,
        error: "Inventory transfer failed",
      };
    }

    const status: InventoryTransferStatus =
      input.transferFixtureMode === "completed" ? "completed" : "in_transit";

    const updatedSource: WarehouseNetworkRecord = {
      ...source,
      timestamp: new Date().toISOString(),
      inventoryAllocation: source.inventoryAllocation - input.quantity,
      availableCapacity: source.availableCapacity + input.quantity,
      inventoryTransferStatus: status,
    };
    const updatedTarget: WarehouseNetworkRecord = {
      ...target,
      timestamp: new Date().toISOString(),
      inventoryAllocation: target.inventoryAllocation + input.quantity,
      availableCapacity: Math.max(0, target.availableCapacity - input.quantity),
      inventoryTransferStatus: status,
    };

    appendMwsLog({
      event: "inventory_transfer",
      level: "info",
      details: `Transfer ${input.quantity} units ${input.sourceWarehouseId} → ${input.targetWarehouseId} (${status})`,
    });

    return {
      success: true,
      transferStatus: status,
      sourceRecord: updatedSource,
      targetRecord: updatedTarget,
      error: null,
    };
  }
}
