/** R1-03 — Amazon Product Intelligence Manager. */

import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import { appendProductLog } from "./amzprod-logging.js";
import { AmazonProductApiClient } from "./amazon-product-api-client.js";
import { AmazonProductMapper } from "./amazon-product-mapper.js";
import { AmazonProductChangeDetector } from "./amazon-product-change-detector.js";
import { AmazonCatalogSyncEngine } from "./amazon-catalog-sync-engine.js";
import { AmazonProductValidator } from "./amazon-product-validator.js";
import { AmazonProductMetadataGenerator } from "./amazon-product-metadata-generator.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type {
  AmazonProductRecord,
  AmazonProductSyncReport,
  FetchAmazonProductInput,
  SyncAmazonProductsInput,
} from "./types.js";

export class AmazonProductIntelligenceManager {
  private catalog: AmazonProductRecord[] = [];
  private readonly apiClient: AmazonProductApiClient;
  private readonly mapper = new AmazonProductMapper();
  private readonly changeDetector = new AmazonProductChangeDetector();
  private readonly syncEngine: AmazonCatalogSyncEngine;
  private readonly validator = new AmazonProductValidator();
  private readonly metadataGenerator = new AmazonProductMetadataGenerator();
  private syncOptions: { updatedTitle?: string; omitAsin?: string } = {};

  constructor(amazonIntegration: AmazonMarketplaceIntegrationEngine | null) {
    this.apiClient = new AmazonProductApiClient(amazonIntegration);
    this.syncEngine = new AmazonCatalogSyncEngine(
      this.apiClient,
      this.mapper,
      this.changeDetector,
    );
  }

  getCatalog(): AmazonProductRecord[] {
    return [...this.catalog];
  }

  setSyncOptionsForTesting(options: { updatedTitle?: string; omitAsin?: string }): void {
    this.syncOptions = options;
  }

  async syncAmazonProducts(
    input: SyncAmazonProductsInput,
    config: AmazonProductIntelligenceConfiguration,
  ): Promise<AmazonProductSyncReport> {
    const started = Date.now();

    try {
      const { catalog, changes } = await this.syncEngine.sync(
        input.forceFullSync ? [] : this.catalog,
        config,
        input,
        this.syncOptions,
      );

      const validation = this.validator.validateCatalog(catalog, config);
      if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
        appendProductLog({
          event: "validation_result",
          level: "warn",
          details: "Validation failed — preserving existing catalog",
        });
        return this.metadataGenerator.buildSyncReport({
          action: "sync",
          products: this.catalog,
          changes: { newProducts: [], updatedProducts: [], inactiveProducts: [], unchangedCount: 0 },
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (validation.decision !== "fail") {
        this.catalog = catalog;
      }

      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        products: this.catalog,
        changes,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Catalog sync failed");

      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        products: this.catalog,
        changes: { newProducts: [], updatedProducts: [], inactiveProducts: [], unchangedCount: 0 },
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  async fetchAmazonProduct(
    input: FetchAmazonProductInput,
    config: AmazonProductIntelligenceConfiguration,
  ): Promise<AmazonProductSyncReport> {
    const started = Date.now();
    const raw = await this.apiClient.fetchProductByAsin(input, config);

    if (!raw) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push(`Product not found: ${input.asin}`);
      return this.metadataGenerator.buildSyncReport({
        action: "fetch",
        products: this.catalog,
        changes: { newProducts: [], updatedProducts: [], inactiveProducts: [], unchangedCount: 0 },
        validation,
        durationMs: Date.now() - started,
      });
    }

    const product = this.mapper.map(raw, config, "synced");
    const validation = this.validator.validateProduct(product);
    const products = validation.decision !== "fail" ? [product] : [];

    return this.metadataGenerator.buildSyncReport({
      action: "fetch",
      products,
      changes: {
        newProducts: products,
        updatedProducts: [],
        inactiveProducts: [],
        unchangedCount: 0,
      },
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.catalog = [];
    this.syncOptions = {};
  }
}
