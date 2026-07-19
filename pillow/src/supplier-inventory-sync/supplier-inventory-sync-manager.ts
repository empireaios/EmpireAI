/** R2-06 — Supplier Inventory Sync Manager. */

import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import { appendSisLog } from "./sis-logging.js";
import { InventorySynchronizationEngine } from "./inventory-synchronization-engine.js";
import { StockValidationEngine } from "./stock-validation-engine.js";
import { InventoryValidator } from "./inventory-validator.js";
import { InventoryMetadataGenerator } from "./inventory-metadata-generator.js";
import {
  getChangeFixtures,
  getFixtureForSupplier,
  getFixtureInventory,
} from "./supplier-inventory-fixtures.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type {
  ReceiveSupplierInventoryInput,
  SupplierInventoryRecord,
  SupplierInventorySyncReport,
  SyncSupplierInventoryInput,
} from "./types.js";

export class SupplierInventorySyncManager {
  private inventory: SupplierInventoryRecord[] = [];
  private readonly syncEngine = new InventorySynchronizationEngine();
  private readonly validationEngine = new StockValidationEngine();
  private readonly validator = new InventoryValidator();
  private readonly metadataGenerator = new InventoryMetadataGenerator();

  constructor(private readonly productSync: SupplierProductSyncEngine | null) {}

  getInventory(): SupplierInventoryRecord[] {
    return [...this.inventory];
  }

  resolveRawInventory(input: SyncSupplierInventoryInput) {
    if (input.rawInventory?.length) return input.rawInventory;

    if (input.changeFixtureMode && input.changeFixtureMode !== "none") {
      return getChangeFixtures(input.changeFixtureMode);
    }

    if (input.supplierId) {
      return getFixtureForSupplier(input.supplierId);
    }

    if (input.includeFixtureInventory !== false) {
      return getFixtureInventory();
    }

    return [];
  }

  async syncSupplierInventory(
    input: SyncSupplierInventoryInput,
    config: SupplierInventorySyncConfiguration,
  ): Promise<SupplierInventorySyncReport> {
    const started = Date.now();
    const catalog = this.productSync?.getCatalog() ?? [];
    const rawInventory = this.resolveRawInventory(input);
    const invalidRecords = this.validationEngine.detectInvalidRawInventory(rawInventory);

    const validRaw = rawInventory.filter(
      (p) =>
        !invalidRecords.some(
          (inv) =>
            inv.supplierId === p.supplierId && inv.supplierProductId === p.supplierProductId,
        ),
    );

    const { inventory, changes } = this.syncEngine.synchronizeInventory({
      previousInventory: this.inventory,
      rawInventory: validRaw,
      catalog,
      config,
    });

    const baseValidation = this.validationEngine.validateInventory(inventory, config);
    const validation = this.validator.validateSyncResult({
      inventory,
      changes,
      invalidRecords,
      config,
      baseValidation,
    });

    if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
      appendSisLog({
        event: "validation_result",
        level: "warn",
        details: "Validation failed — preserving existing inventory",
      });
      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        inventory: this.inventory,
        changes: [],
        invalidRecords,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (validation.decision !== "fail") {
      this.inventory = inventory;
    }

    this.verifyProductSyncConsumption();

    return this.metadataGenerator.buildSyncReport({
      action: "sync",
      inventory: this.inventory,
      changes,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  receiveSupplierInventory(
    input: ReceiveSupplierInventoryInput,
    config: SupplierInventorySyncConfiguration,
  ): SupplierInventorySyncReport {
    const started = Date.now();
    const catalog = this.productSync?.getCatalog() ?? [];
    const { inventory, changes } = this.syncEngine.synchronizeInventory({
      previousInventory: this.inventory,
      rawInventory: [
        {
          supplierId: input.supplierId,
          supplierProductId: input.supplierProductId,
          quantity: input.quantity,
          sourceData: input.sourceData,
        },
      ],
      catalog,
      config,
    });

    const invalidRecords = this.validationEngine.detectInvalidRawInventory([
      {
        supplierId: input.supplierId,
        supplierProductId: input.supplierProductId,
        quantity: input.quantity,
      },
    ]);

    const baseValidation = this.validationEngine.validateInventory(inventory, config);
    const validation = this.validator.validateSyncResult({
      inventory,
      changes,
      invalidRecords,
      config,
      baseValidation,
    });

    if (validation.decision !== "fail") {
      const active = inventory.filter((r) => r.stockAvailabilityStatus !== "discontinued");
      this.inventory = [
        ...this.inventory.filter(
          (r) =>
            !active.some(
              (a) => a.supplierId === r.supplierId && a.supplierProductId === r.supplierProductId,
            ),
        ),
        ...active,
        ...inventory.filter((r) => r.stockAvailabilityStatus === "discontinued"),
      ];
    }

    return this.metadataGenerator.buildSyncReport({
      action: "receive",
      inventory: activeFrom(inventory),
      changes,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  private verifyProductSyncConsumption(): void {
    if (!this.productSync) return;
    try {
      const catalog = this.productSync.getCatalog();
      appendSisLog({
        event: "product_sync_consumption",
        level: "info",
        details: `R2-05 Supplier Product Sync consumed — ${catalog.length} product(s) in catalog`,
      });
    } catch {
      appendSisLog({
        event: "product_sync_consumption",
        level: "warn",
        details: "Supplier Product Sync consumption check skipped",
      });
    }
  }

  resetForTesting(): void {
    this.inventory = [];
  }
}

function activeFrom(inventory: SupplierInventoryRecord[]): SupplierInventoryRecord[] {
  return inventory.filter((r) => r.stockAvailabilityStatus !== "discontinued");
}
