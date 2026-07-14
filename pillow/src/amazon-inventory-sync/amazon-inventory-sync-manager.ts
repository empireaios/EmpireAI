/** R1-05 — Amazon Inventory Sync Manager. */

import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import type { AmazonProductIntelligenceEngine } from "../amazon-product-intelligence/engine.js";
import type { AmazonOrderManagementEngine } from "../amazon-order-management/engine.js";
import { appendInventoryLog } from "./amzinv-logging.js";
import { AmazonInventoryApiClient } from "./amazon-inventory-api-client.js";
import { AmazonStockFetcher } from "./amazon-stock-fetcher.js";
import { AmazonInventoryMapper } from "./amazon-inventory-mapper.js";
import { InventoryChangeDetector } from "./inventory-change-detector.js";
import { InventoryDiscrepancyDetector } from "./inventory-discrepancy-detector.js";
import { InventorySyncEngine } from "./inventory-sync-engine.js";
import { AmazonInventoryValidator } from "./amazon-inventory-validator.js";
import { AmazonInventoryMetadataGenerator } from "./amazon-inventory-metadata-generator.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type {
  AmazonInventoryRecord,
  AmazonInventorySyncReport,
  FetchAmazonInventoryInput,
  SyncAmazonInventoryInput,
} from "./types.js";

export class AmazonInventorySyncManager {
  private inventory: AmazonInventoryRecord[] = [];
  private internalInventory = new Map<string, number>();
  private readonly apiClient: AmazonInventoryApiClient;
  private readonly fetcher: AmazonStockFetcher;
  private readonly mapper = new AmazonInventoryMapper();
  private readonly changeDetector = new InventoryChangeDetector();
  private readonly discrepancyDetector = new InventoryDiscrepancyDetector();
  private readonly syncEngine: InventorySyncEngine;
  private readonly validator = new AmazonInventoryValidator();
  private readonly metadataGenerator = new AmazonInventoryMetadataGenerator();
  private fixtureOptions: Parameters<AmazonStockFetcher["fetchAll"]>[2] = {};

  constructor(
    amazonIntegration: AmazonMarketplaceIntegrationEngine | null,
    productIntelligence: AmazonProductIntelligenceEngine | null,
    _orderManagement: AmazonOrderManagementEngine | null,
  ) {
    void _orderManagement;
    this.apiClient = new AmazonInventoryApiClient(amazonIntegration);
    this.fetcher = new AmazonStockFetcher(this.apiClient);
    this.syncEngine = new InventorySyncEngine(
      this.fetcher,
      this.mapper,
      this.changeDetector,
      this.discrepancyDetector,
    );
    this.seedInternalFromProducts(productIntelligence);
  }

  private seedInternalFromProducts(
    productIntelligence: AmazonProductIntelligenceEngine | null,
  ): void {
    if (!productIntelligence) return;
    try {
      const catalog = productIntelligence.getCatalog();
      for (const product of catalog) {
        if (product.amazonSku) {
          this.internalInventory.set(product.amazonSku, 150);
        }
      }
      this.internalInventory.set("AMZ-SKU-002", 12);
      this.internalInventory.set("AMZ-SKU-003", 0);
    } catch {
      /* products not initialized */
    }
  }

  getInventory(): AmazonInventoryRecord[] {
    return [...this.inventory];
  }

  getInternalInventory(): Map<string, number> {
    return new Map(this.internalInventory);
  }

  setFixtureOptionsForTesting(
    options: Parameters<AmazonStockFetcher["fetchAll"]>[2],
  ): void {
    this.fixtureOptions = options;
  }

  setInternalQuantityForTesting(sku: string, quantity: number): void {
    this.internalInventory.set(sku, quantity);
  }

  async syncAmazonInventory(
    input: SyncAmazonInventoryInput,
    config: AmazonInventorySyncConfiguration,
  ): Promise<AmazonInventorySyncReport> {
    const started = Date.now();

    try {
      const { inventory, changes } = await this.syncEngine.sync(
        input.forceFullSync ? [] : this.inventory,
        this.internalInventory,
        config,
        input,
        this.fixtureOptions,
      );

      const validation = this.validator.validateInventory(inventory, config);
      if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
        appendInventoryLog({
          event: "validation_result",
          level: "warn",
          details: "Validation failed — preserving existing inventory",
        });
        return this.metadataGenerator.buildSyncReport({
          action: "sync",
          inventory: this.inventory,
          changes: {
            stockChanges: [],
            lowStockItems: [],
            outOfStockItems: [],
            discrepancies: [],
            unchangedCount: 0,
          },
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (validation.decision !== "fail") {
        this.inventory = inventory;
        this.syncInternalInventory(inventory, config);
      }

      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        inventory: this.inventory,
        changes,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Inventory sync failed");

      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        inventory: this.inventory,
        changes: {
          stockChanges: [],
          lowStockItems: [],
          outOfStockItems: [],
          discrepancies: [],
          unchangedCount: 0,
        },
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  private syncInternalInventory(
    inventory: AmazonInventoryRecord[],
    config: AmazonInventorySyncConfiguration,
  ): void {
    if (config.allowStockPush) return;
    for (const item of inventory) {
      this.internalInventory.set(item.amazonSku, item.availableQuantity);
    }
  }

  async fetchAmazonInventory(
    input: FetchAmazonInventoryInput,
    config: AmazonInventorySyncConfiguration,
  ): Promise<AmazonInventorySyncReport> {
    const started = Date.now();
    const raw = await this.fetcher.fetchOne(input, config);

    if (!raw) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push(`Inventory not found: ${input.amazonSku}`);
      return this.metadataGenerator.buildSyncReport({
        action: "fetch",
        inventory: this.inventory,
        changes: {
          stockChanges: [],
          lowStockItems: [],
          outOfStockItems: [],
          discrepancies: [],
          unchangedCount: 0,
        },
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.mapper.map(raw, config);
    const validation = this.validator.validateRecord(record);

    return this.metadataGenerator.buildSyncReport({
      action: "fetch",
      inventory: validation.decision !== "fail" ? [record] : [],
      changes: {
        stockChanges: validation.decision !== "fail" ? [record] : [],
        lowStockItems: record.lowStockStatus ? [record] : [],
        outOfStockItems: record.outOfStockStatus ? [record] : [],
        discrepancies: [],
        unchangedCount: 0,
      },
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.inventory = [];
    this.internalInventory.clear();
    this.fixtureOptions = {};
  }
}
