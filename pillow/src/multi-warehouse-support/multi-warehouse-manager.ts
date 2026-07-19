/** R2-15 — Multi-Warehouse Manager. */

import type { WarehouseIntelligenceEngine } from "../warehouse-intelligence/engine.js";
import { appendMwsLog } from "./mws-logging.js";
import { WarehouseRegistry } from "./warehouse-registry.js";
import { WarehouseNetworkEngine } from "./warehouse-network-engine.js";
import { InventoryDistributionManager } from "./inventory-distribution-manager.js";
import { WarehouseTransferEngine } from "./warehouse-transfer-engine.js";
import { WarehouseSelectionEngine } from "./warehouse-selection-engine.js";
import {
  WarehouseNetworkValidationEngine,
  WarehouseNetworkValidator,
  WarehouseNetworkMetadataGenerator,
} from "./warehouse-network-validator.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import { MWS_METADATA_VERSION } from "./paths.js";
import {
  buildWarehouseNetworkId,
  getFixtureNetworkMetrics,
  listRegisteredWarehouseIds,
  WAREHOUSE_LOCATIONS,
} from "./network-fixtures.js";
import type {
  InvalidWarehouseNetworkFinding,
  RegisterWarehousesInput,
  RouteFulfilmentInput,
  SelectWarehouseInput,
  TransferInventoryInput,
  WarehouseIdentifier,
  WarehouseNetworkFailureFinding,
  WarehouseNetworkRecord,
  WarehouseNetworkReport,
} from "./types.js";

export class MultiWarehouseManager {
  private records: WarehouseNetworkRecord[] = [];
  private readonly registry = new WarehouseRegistry();
  private readonly networkEngine: WarehouseNetworkEngine;
  private readonly distributionManager = new InventoryDistributionManager();
  private readonly transferEngine = new WarehouseTransferEngine();
  private readonly selectionEngine = new WarehouseSelectionEngine();
  private readonly validationEngine = new WarehouseNetworkValidationEngine();
  private readonly validator = new WarehouseNetworkValidator();
  private readonly metadataGenerator = new WarehouseNetworkMetadataGenerator();

  constructor(warehouseIntelligence: WarehouseIntelligenceEngine | null) {
    this.networkEngine = new WarehouseNetworkEngine(warehouseIntelligence);
  }

  getRecords(): WarehouseNetworkRecord[] {
    return [...this.records];
  }

  buildNetworkRecord(
    warehouseId: WarehouseIdentifier,
    fixtureMode?: "balanced" | "imbalanced" | "capacity_issue",
    upstreamAllocation?: number,
  ): WarehouseNetworkRecord {
    const metrics = getFixtureNetworkMetrics(warehouseId, fixtureMode);
    const allocation = upstreamAllocation ?? metrics.inventoryAllocation;
    return {
      warehouseNetworkId: buildWarehouseNetworkId(warehouseId),
      timestamp: new Date().toISOString(),
      warehouseId,
      warehouseLocation: WAREHOUSE_LOCATIONS[warehouseId],
      inventoryAllocation: allocation,
      availableCapacity: metrics.availableCapacity,
      assignedFulfilmentWorkload: metrics.assignedFulfilmentWorkload,
      inventoryTransferStatus: "none",
      warehouseHealthStatus: metrics.warehouseHealthStatus,
      validationStatus: "pending",
      metadataVersion: MWS_METADATA_VERSION,
    };
  }

  registerWarehouses(
    input: RegisterWarehousesInput,
    config: MultiWarehouseSupportConfiguration,
  ): WarehouseNetworkReport {
    const started = Date.now();
    const failures: WarehouseNetworkFailureFinding[] = [];
    const invalidRecords: InvalidWarehouseNetworkFinding[] = [];
    const updatedRecords: WarehouseNetworkRecord[] = [];

    this.networkEngine.ensureUpstreamCoordination(config);
    const upstream = this.networkEngine.getUpstreamRecords();
    const upstreamMap = new Map(upstream.map((r) => [r.warehouseId, r]));

    const fixtureMode =
      input.networkFixtureMode && input.networkFixtureMode !== "none"
        ? input.networkFixtureMode
        : undefined;

    const ids = input.warehouseIds ?? listRegisteredWarehouseIds();
    const registered = this.registry.registerAll(config, ids);

    if (!registered.length && !input.includeFixtureWarehouses) {
      failures.push({
        warehouseNetworkId: `mws-fail-${Date.now()}`,
        failureType: "missing_warehouse",
        details: "No warehouses registered",
      });
    }

    for (const warehouseId of registered.length ? registered : ids) {
      const upstreamRecord = upstreamMap.get(warehouseId as import("../warehouse-intelligence/types.js").WarehouseIdentifier);
      const allocation = upstreamRecord
        ? this.networkEngine.mapUpstreamToAllocation(upstreamRecord)
        : undefined;
      const record = this.buildNetworkRecord(warehouseId, fixtureMode, allocation);

      const invalid = this.validationEngine.detectInvalidWarehouse(
        record.warehouseId,
        record.inventoryAllocation,
      );
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      updatedRecords.push(record);
      appendMwsLog({
        event: "warehouse_registration",
        level: "info",
        details: `Network record ${record.warehouseNetworkId} at ${record.warehouseLocation}`,
      });
    }

    if (fixtureMode === "imbalanced" || this.networkEngine.detectNetworkImbalance(
      updatedRecords.map((r) => r.inventoryAllocation),
      config,
    )) {
      appendMwsLog({
        event: "capacity_update",
        level: "warn",
        details: "Warehouse imbalance detected across network",
      });
    }

    const validation = this.validator.validateNetworkResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.warehouseId === record.warehouseId);
        if (idx >= 0) this.records[idx] = record;
        else this.records.push(record);
      }
    }

    return this.metadataGenerator.generateNetworkReport({
      action: "register",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  selectWarehouse(
    input: SelectWarehouseInput,
    config: MultiWarehouseSupportConfiguration,
  ): WarehouseNetworkReport {
    const started = Date.now();
    const failures: WarehouseNetworkFailureFinding[] = [];

    if (!this.records.length) {
      this.registerWarehouses({ includeFixtureWarehouses: true }, config);
    }

    const selection = this.selectionEngine.selectOptimal(this.records, input, config);
    if (!selection.record) {
      failures.push({
        warehouseNetworkId: `mws-fail-${Date.now()}`,
        failureType: "selection_failure",
        details: selection.selectionReason,
      });
    }

    const validation = this.validator.validateNetworkResult({
      records: selection.record ? [selection.record] : [],
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateNetworkReport({
      action: "select",
      records: selection.record ? [selection.record] : [],
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  transferInventory(
    input: TransferInventoryInput,
    config: MultiWarehouseSupportConfiguration,
  ): WarehouseNetworkReport {
    const started = Date.now();
    const failures: WarehouseNetworkFailureFinding[] = [];
    const updatedRecords: WarehouseNetworkRecord[] = [];

    if (!this.records.length) {
      this.registerWarehouses({ includeFixtureWarehouses: true }, config);
    }

    const result = this.transferEngine.transfer(this.records, input, config);
    if (!result.success) {
      failures.push({
        warehouseNetworkId: `mws-fail-${input.sourceWarehouseId}`,
        failureType: "transfer_failure",
        details: result.error ?? "Inventory transfer failed",
      });
    } else {
      if (result.sourceRecord) updatedRecords.push(result.sourceRecord);
      if (result.targetRecord) updatedRecords.push(result.targetRecord);
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.warehouseId === record.warehouseId);
        if (idx >= 0) this.records[idx] = record;
      }
    }

    const validation = this.validator.validateNetworkResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateNetworkReport({
      action: "transfer",
      records: updatedRecords,
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  routeFulfilmentBetweenWarehouses(
    input: RouteFulfilmentInput,
    config: MultiWarehouseSupportConfiguration,
  ): WarehouseNetworkReport {
    const started = Date.now();
    const failures: WarehouseNetworkFailureFinding[] = [];

    if (!this.records.length) {
      this.registerWarehouses({ includeFixtureWarehouses: true }, config);
    }

    const target = this.records.find((r) => r.warehouseId === input.targetWarehouseId);
    if (!target) {
      failures.push({
        warehouseNetworkId: `mws-fail-${input.targetWarehouseId}`,
        failureType: "communication_failure",
        details: "Target warehouse not found in network",
      });
    } else {
      const updated: WarehouseNetworkRecord = {
        ...target,
        timestamp: new Date().toISOString(),
        assignedFulfilmentWorkload: target.assignedFulfilmentWorkload + 10,
      };
      const idx = this.records.findIndex((r) => r.warehouseId === target.warehouseId);
      if (idx >= 0) this.records[idx] = updated;
      appendMwsLog({
        event: "warehouse_selection",
        level: "info",
        details: `Routed fulfilment for ${input.orderReference} to ${input.targetWarehouseId}`,
      });
    }

    const validation = this.validator.validateNetworkResult({
      records: target ? [this.records.find((r) => r.warehouseId === input.targetWarehouseId)!] : [],
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateNetworkReport({
      action: "route",
      records: target ? [this.records.find((r) => r.warehouseId === input.targetWarehouseId)!] : [],
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncWarehouseNetwork(config: MultiWarehouseSupportConfiguration): WarehouseNetworkReport {
    const report = this.registerWarehouses({ includeFixtureWarehouses: true }, config);
    const rebalanced = this.distributionManager.rebalance(this.records, config);
    for (const record of rebalanced) {
      const idx = this.records.findIndex((r) => r.warehouseId === record.warehouseId);
      if (idx >= 0) this.records[idx] = record;
    }
    return {
      ...report,
      action: "sync",
      records: [...this.records],
    };
  }

  resetForTesting(): void {
    this.records = [];
    this.registry.resetForTesting();
  }
}
