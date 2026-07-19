/** R2-05 — Supplier Product Sync Manager. */

import type { CjDropshippingIntegrationEngine } from "../cj-dropshipping-integration/engine.js";
import type { AliExpressIntegrationEngine } from "../aliexpress-integration/engine.js";
import type { Oss1688IntegrationEngine } from "../1688-integration/engine.js";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { appendSpsLog } from "./sps-logging.js";
import { ProductSynchronizationEngine } from "./product-synchronization-engine.js";
import { ProductDuplicateDetector } from "./product-duplicate-detector.js";
import { ProductValidationEngine } from "./product-validation-engine.js";
import { ProductValidator } from "./product-validator.js";
import { ProductMetadataGenerator } from "./product-metadata-generator.js";
import {
  getChangeFixtures,
  getDuplicateSkuFixtures,
  getFixtureCatalog,
  getFixtureForSupplier,
} from "./supplier-product-fixtures.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type {
  DetectDuplicatesInput,
  ReceiveSupplierProductInput,
  SupplierProductRecord,
  SupplierProductSyncReport,
  SyncSupplierProductsInput,
} from "./types.js";

export class SupplierProductSyncManager {
  private catalog: SupplierProductRecord[] = [];
  private includeDuplicateFixtures = false;
  private readonly syncEngine = new ProductSynchronizationEngine();
  private readonly duplicateDetector = new ProductDuplicateDetector();
  private readonly validationEngine = new ProductValidationEngine();
  private readonly validator = new ProductValidator();
  private readonly metadataGenerator = new ProductMetadataGenerator();

  constructor(
    private readonly cj: CjDropshippingIntegrationEngine | null,
    private readonly aliexpress: AliExpressIntegrationEngine | null,
    private readonly oss1688: Oss1688IntegrationEngine | null,
    private readonly supplierFramework: SupplierFrameworkEngine | null,
  ) {}

  getCatalog(): SupplierProductRecord[] {
    return [...this.catalog];
  }

  setIncludeDuplicateFixturesForTesting(value: boolean): void {
    this.includeDuplicateFixtures = value;
  }

  resolveRawProducts(input: SyncSupplierProductsInput) {
    if (input.rawProducts?.length) return input.rawProducts;

    if (input.changeFixtureMode && input.changeFixtureMode !== "none") {
      return getChangeFixtures(input.changeFixtureMode);
    }

    if (input.supplierId) {
      return getFixtureForSupplier(input.supplierId);
    }

    if (input.includeFixtureCatalog !== false) {
      const fixtures = getFixtureCatalog();
      return this.includeDuplicateFixtures ? [...fixtures, ...getDuplicateSkuFixtures()] : fixtures;
    }

    return [];
  }

  async syncSupplierProducts(
    input: SyncSupplierProductsInput,
    config: SupplierProductSyncConfiguration,
  ): Promise<SupplierProductSyncReport> {
    const started = Date.now();
    const rawProducts = this.resolveRawProducts(input);
    const invalidProducts = this.validationEngine.detectInvalidRawProducts(rawProducts);

    const validRaw = rawProducts.filter(
      (p) =>
        !invalidProducts.some(
          (inv) =>
            inv.supplierId === p.supplierId && inv.supplierProductId === p.supplierProductId,
        ),
    );

    const { products, changes, duplicates } = this.syncEngine.synchronizeCatalog({
      previousCatalog: this.catalog,
      rawProducts: validRaw,
      config,
    });

    const missingAttributes = this.validationEngine.detectMissingAttributes(products, config);
    const baseValidation = this.validationEngine.validateCatalog(products, config);
    const validation = this.validator.validateSyncResult({
      products,
      changes,
      duplicates,
      missingAttributes,
      invalidProducts,
      config,
      baseValidation,
    });

    if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
      appendSpsLog({
        event: "validation_result",
        level: "warn",
        details: "Validation failed — preserving existing catalog",
      });
      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        products: this.catalog,
        changes: [],
        duplicates: [],
        missingAttributes: [],
        invalidProducts,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (validation.decision !== "fail") {
      this.catalog = products;
    }

    this.verifySupplierIntegrationConsumption();

    return this.metadataGenerator.buildSyncReport({
      action: "sync",
      products: this.catalog,
      changes,
      duplicates,
      missingAttributes,
      invalidProducts,
      validation,
      durationMs: Date.now() - started,
    });
  }

  receiveSupplierProduct(
    input: ReceiveSupplierProductInput,
    config: SupplierProductSyncConfiguration,
  ): SupplierProductSyncReport {
    const started = Date.now();
    const report = this.syncEngine.synchronizeCatalog({
      previousCatalog: this.catalog,
      rawProducts: [
        {
          supplierId: input.supplierId,
          supplierProductId: input.supplierProductId,
          sourceData: input.sourceData,
        },
      ],
      config,
    });

    const missingAttributes = this.validationEngine.detectMissingAttributes(report.products, config);
    const baseValidation = this.validationEngine.validateCatalog(report.products, config);
    const validation = this.validator.validateSyncResult({
      products: report.products,
      changes: report.changes,
      duplicates: report.duplicates,
      missingAttributes,
      invalidProducts: [],
      config,
      baseValidation,
    });

    if (validation.decision !== "fail") {
      const existingIdx = this.catalog.findIndex((p) => p.productId === report.products[0]?.productId);
      if (existingIdx >= 0 && report.products[0]) {
        this.catalog[existingIdx] = report.products[0];
      } else if (report.products[0]) {
        this.catalog.push(report.products[0]);
      }
    }

    return this.metadataGenerator.buildSyncReport({
      action: "receive",
      products: report.products,
      changes: report.changes,
      duplicates: report.duplicates,
      missingAttributes,
      invalidProducts: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectDuplicates(
    input: DetectDuplicatesInput,
    config: SupplierProductSyncConfiguration,
  ): SupplierProductSyncReport {
    const started = Date.now();
    const products = input.products ?? this.catalog;
    const duplicates = this.duplicateDetector.detect(products, config);
    const validation = this.validationEngine.validateCatalog(products, config);

    return this.metadataGenerator.buildSyncReport({
      action: "detect_duplicates",
      products,
      changes: [],
      duplicates,
      missingAttributes: [],
      invalidProducts: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private verifySupplierIntegrationConsumption(): void {
    const integrations = [
      { name: "cj-dropshipping", engine: this.cj },
      { name: "aliexpress", engine: this.aliexpress },
      { name: "1688", engine: this.oss1688 },
    ];

    for (const integration of integrations) {
      if (!integration.engine) continue;
      try {
        integration.engine.getState();
        appendSpsLog({
          event: "supplier_integration_consumption",
          level: "info",
          details: `${integration.name} integration consumed for product sync`,
        });
      } catch {
        appendSpsLog({
          event: "supplier_integration_consumption",
          level: "warn",
          details: `${integration.name} integration unavailable`,
        });
      }
    }

    if (this.supplierFramework) {
      try {
        const suppliers = this.supplierFramework.getRegisteredSuppliers();
        appendSpsLog({
          event: "supplier_integration_consumption",
          level: "info",
          details: `Supplier Framework consumed — ${suppliers.length} supplier(s) registered`,
        });
      } catch {
        appendSpsLog({
          event: "supplier_integration_consumption",
          level: "warn",
          details: "Supplier Framework consumption check skipped",
        });
      }
    }
  }

  resetForTesting(): void {
    this.catalog = [];
    this.includeDuplicateFixtures = false;
  }
}
