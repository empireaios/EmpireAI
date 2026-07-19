/** R2-14 — Warehouse Intelligence Manager. */

import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import { appendWiLog } from "./wi-logging.js";
import { WarehouseCoordinationEngine } from "./warehouse-coordination-engine.js";
import { WarehouseAllocationEngine } from "./warehouse-allocation-engine.js";
import { WarehouseUtilizationAnalyzer } from "./warehouse-utilization-analyzer.js";
import { WarehouseOptimizationEngine } from "./warehouse-optimization-engine.js";
import { WarehouseValidationEngine, WarehouseValidator, WarehouseMetadataGenerator } from "./warehouse-validator.js";
import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import { WI_METADATA_VERSION } from "./paths.js";
import {
  buildWarehouseRecordId,
  getFixtureWarehouseMetrics,
  listWarehouseIds,
  WAREHOUSE_LOCATIONS,
} from "./warehouse-fixtures.js";
import type {
  AllocateWarehouseInput,
  CoordinateWarehousesInput,
  InvalidWarehouseFinding,
  OptimizeInventoryDistributionInput,
  WarehouseFailureFinding,
  WarehouseIdentifier,
  WarehouseRecord,
  WarehouseReport,
} from "./types.js";

export class WarehouseIntelligenceManager {
  private records: WarehouseRecord[] = [];
  private readonly coordinationEngine: WarehouseCoordinationEngine;
  private readonly allocationEngine = new WarehouseAllocationEngine();
  private readonly utilizationAnalyzer = new WarehouseUtilizationAnalyzer();
  private readonly optimizationEngine = new WarehouseOptimizationEngine();
  private readonly validationEngine = new WarehouseValidationEngine();
  private readonly validator = new WarehouseValidator();
  private readonly metadataGenerator = new WarehouseMetadataGenerator();

  constructor(
    inventorySync: SupplierInventorySyncEngine | null,
    fulfilmentOrchestrator: FulfilmentOrchestrator | null,
    shipmentTracking: ShipmentTrackingEngine | null,
  ) {
    this.coordinationEngine = new WarehouseCoordinationEngine(
      inventorySync,
      fulfilmentOrchestrator,
      shipmentTracking,
    );
  }

  getRecords(): WarehouseRecord[] {
    return [...this.records];
  }

  buildWarehouseRecord(
    warehouseId: WarehouseIdentifier,
    context: ReturnType<WarehouseCoordinationEngine["buildContext"]>,
    fixtureMode?: "optimal" | "bottleneck" | "shortage" | "overstock",
    config?: WarehouseIntelligenceConfiguration,
  ): WarehouseRecord {
    const metrics = getFixtureWarehouseMetrics(warehouseId, fixtureMode);
    const workload = metrics.fulfilmentWorkload + this.coordinationEngine.resolveWorkloadBoost(warehouseId, context);
    const draft = {
      warehouseRecordId: buildWarehouseRecordId(warehouseId),
      timestamp: new Date().toISOString(),
      warehouseId,
      warehouseLocation: WAREHOUSE_LOCATIONS[warehouseId],
      inventoryLevel: metrics.inventoryLevel,
      capacityUtilization: 0,
      availableCapacity: 0,
      assignedInventory: metrics.assignedInventory,
      fulfilmentWorkload: workload,
      warehouseStatus: metrics.warehouseStatus,
      validationStatus: "pending" as const,
      metadataVersion: WI_METADATA_VERSION,
    };
    const analysis = this.utilizationAnalyzer.analyzeStatus(draft, config!);
    return { ...draft, ...analysis };
  }

  coordinateWarehouses(
    input: CoordinateWarehousesInput,
    config: WarehouseIntelligenceConfiguration,
  ): WarehouseReport {
    const started = Date.now();
    const failures: WarehouseFailureFinding[] = [];
    const invalidRecords: InvalidWarehouseFinding[] = [];
    const updatedRecords: WarehouseRecord[] = [];

    if (!this.coordinationEngine.isCoordinationEnabled(config)) {
      failures.push({
        warehouseRecordId: `wi-fail-${Date.now()}`,
        failureType: "allocation_failure",
        details: "Warehouse coordination rules disabled",
      });
    }

    const context = this.coordinationEngine.buildContext();
    const inventory = context.totalInventory;
    if (!input.includeFixtureWarehouses && inventory === 0 && context.activeFulfilments === 0) {
      failures.push({
        warehouseRecordId: `wi-fail-${Date.now()}`,
        failureType: "invalid_inventory",
        details: "No inventory or fulfilment data available for coordination",
      });
    }

    const warehouseIds = input.warehouseId ? [input.warehouseId] : listWarehouseIds();
    const fixtureMode =
      input.warehouseFixtureMode && input.warehouseFixtureMode !== "none"
        ? input.warehouseFixtureMode
        : undefined;

    for (const warehouseId of warehouseIds) {
      const record = this.buildWarehouseRecord(warehouseId, context, fixtureMode, config);
      const invalid = this.validationEngine.detectInvalidWarehouse(
        record.warehouseId,
        record.inventoryLevel,
      );
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      if (this.utilizationAnalyzer.detectBottleneck(record)) {
        appendWiLog({
          event: "capacity_analysis",
          level: "warn",
          details: `Bottleneck detected at ${warehouseId}: ${record.capacityUtilization}% utilization`,
        });
      }
      if (this.utilizationAnalyzer.detectShortage(record)) {
        appendWiLog({
          event: "capacity_analysis",
          level: "warn",
          details: `Shortage detected at ${warehouseId}: inventory ${record.inventoryLevel}`,
        });
      }
      if (this.utilizationAnalyzer.detectOverstock(record)) {
        appendWiLog({
          event: "capacity_analysis",
          level: "warn",
          details: `Overstock detected at ${warehouseId}: inventory ${record.inventoryLevel}`,
        });
      }

      updatedRecords.push(record);
      appendWiLog({
        event: "warehouse_allocation",
        level: "info",
        details: `Coordinated ${warehouseId} — ${record.warehouseStatus} @ ${record.warehouseLocation}`,
      });
    }

    const validation = this.validator.validateWarehouseResult({
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

    return this.metadataGenerator.generateWarehouseReport({
      action: "coordinate",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  allocateWarehouse(
    input: AllocateWarehouseInput,
    config: WarehouseIntelligenceConfiguration,
  ): WarehouseReport {
    const started = Date.now();
    const failures: WarehouseFailureFinding[] = [];
    const records = this.records.length ? this.records : [];

    if (!records.length) {
      const coord = this.coordinateWarehouses({ includeFixtureWarehouses: true }, config);
      records.push(...coord.records);
    }

    const allocation = this.allocationEngine.selectOptimalWarehouse(records, input, config);
    if (!allocation) {
      failures.push({
        warehouseRecordId: `wi-fail-${Date.now()}`,
        failureType: "allocation_failure",
        details: "No optimal warehouse available for allocation",
      });
    } else {
      appendWiLog({
        event: "warehouse_allocation",
        level: "info",
        details: `Allocated ${allocation.warehouseId}: ${allocation.selectionReason}`,
      });
    }

    const validation = this.validator.validateWarehouseResult({
      records: allocation ? records.filter((r) => r.warehouseId === allocation.warehouseId) : [],
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateWarehouseReport({
      action: "allocate",
      records: validation.decision === "fail" ? [] : records.filter((r) => r.warehouseId === allocation?.warehouseId),
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  optimizeInventoryDistribution(
    input: OptimizeInventoryDistributionInput,
    config: WarehouseIntelligenceConfiguration,
  ): WarehouseReport {
    const started = Date.now();
    const failures: WarehouseFailureFinding[] = [];

    if (!this.records.length) {
      this.coordinateWarehouses({ includeFixtureWarehouses: true }, config);
    }

    let records = input.warehouseId
      ? this.records.filter((r) => r.warehouseId === input.warehouseId)
      : [...this.records];

    const optimized = this.optimizationEngine.optimize(records, config);
    appendWiLog({
      event: "inventory_distribution",
      level: "info",
      details: `Optimized distribution across ${optimized.length} warehouse(s)`,
    });

    for (const record of optimized) {
      const idx = this.records.findIndex((r) => r.warehouseId === record.warehouseId);
      if (idx >= 0) this.records[idx] = record;
    }

    const validation = this.validator.validateWarehouseResult({
      records: optimized,
      failures,
      config,
      startedAt: started,
    });

    return this.metadataGenerator.generateWarehouseReport({
      action: "optimize",
      records: optimized,
      failures,
      invalidRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
  }
}
