/** R1-12 — Marketplace Product Normalization Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendNormalizationLog } from "./mpn-logging.js";
import { MarketplaceProductMapper } from "./marketplace-product-mapper.js";
import { ProductDuplicateDetector } from "./product-duplicate-detector.js";
import { ProductValidationEngine } from "./product-validation-engine.js";
import { ProductNormalizationValidator } from "./product-normalization-validator.js";
import { ProductMetadataGenerator } from "./product-metadata-generator.js";
import {
  getDuplicateSkuFixtures,
  getFixtureCatalog,
  getFixtureForMarketplace,
} from "./marketplace-product-fixtures.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type {
  DetectDuplicatesInput,
  NormalizeProductInput,
  NormalizeProductsInput,
  NormalizedProductRecord,
  ProductNormalizationReport,
  RawMarketplaceProductPayload,
} from "./types.js";

export class MarketplaceProductNormalizationManager {
  private catalog: NormalizedProductRecord[] = [];
  private readonly mapper = new MarketplaceProductMapper();
  private readonly duplicateDetector = new ProductDuplicateDetector();
  private readonly validationEngine = new ProductValidationEngine();
  private readonly normalizationValidator = new ProductNormalizationValidator();
  private readonly metadataGenerator = new ProductMetadataGenerator();
  private includeDuplicateFixtures = false;

  constructor(private readonly mcf: MarketplaceConnectorFrameworkEngine | null) {}

  getCatalog(): NormalizedProductRecord[] {
    return [...this.catalog];
  }

  setIncludeDuplicateFixturesForTesting(value: boolean): void {
    this.includeDuplicateFixtures = value;
  }

  resolveRawProducts(input: NormalizeProductsInput): RawMarketplaceProductPayload[] {
    if (input.rawProducts?.length) {
      return input.rawProducts;
    }

    if (input.marketplaceIdentifier) {
      return getFixtureForMarketplace(input.marketplaceIdentifier);
    }

    if (input.includeFixtureCatalog !== false) {
      const fixtures = getFixtureCatalog();
      return this.includeDuplicateFixtures ? [...fixtures, ...getDuplicateSkuFixtures()] : fixtures;
    }

    return [];
  }

  async normalizeProducts(
    input: NormalizeProductsInput,
    config: MarketplaceProductNormalizationConfiguration,
  ): Promise<ProductNormalizationReport> {
    const started = Date.now();
    const rawProducts = this.resolveRawProducts(input);
    const invalidProducts = this.validationEngine.detectInvalidRawProducts(rawProducts);

    const validRaw = rawProducts.filter(
      (p) =>
        !invalidProducts.some(
          (inv) =>
            inv.marketplaceIdentifier === p.marketplaceIdentifier &&
            inv.marketplaceProductId === p.marketplaceProductId,
        ),
    );

    const products = this.mapper.mapBatch(validRaw, config);
    const duplicates = this.duplicateDetector.detect(products, config);
    const missingAttributes = this.validationEngine.detectMissingAttributes(products, config);
    const baseValidation = this.validationEngine.validateCatalog(products, config);
    const validation = this.normalizationValidator.validateNormalizationResult({
      products,
      duplicates,
      missingAttributes,
      invalidProducts,
      config,
      baseValidation,
    });

    if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
      appendNormalizationLog({
        event: "validation_result",
        level: "warn",
        details: "Validation failed — preserving existing catalog",
      });
      return this.metadataGenerator.buildNormalizationReport({
        action: "normalize",
        products: this.catalog,
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

    this.verifyMcfConsumption();

    return this.metadataGenerator.buildNormalizationReport({
      action: "normalize",
      products: this.catalog,
      duplicates,
      missingAttributes,
      invalidProducts,
      validation,
      durationMs: Date.now() - started,
    });
  }

  normalizeProduct(
    input: NormalizeProductInput,
    config: MarketplaceProductNormalizationConfiguration,
  ): ProductNormalizationReport {
    const started = Date.now();
    const payload: RawMarketplaceProductPayload = {
      marketplaceIdentifier: input.marketplaceIdentifier,
      marketplaceProductId: input.marketplaceProductId,
      sourceData: input.sourceData,
    };

    const invalidProducts = this.validationEngine.detectInvalidRawProducts([payload]);
    const product = invalidProducts.length === 0 ? this.mapper.map(payload, config) : null;
    const products = product ? [product] : [];
    const duplicates = product ? this.duplicateDetector.detect([...this.catalog, product], config) : [];
    const missingAttributes = product
      ? this.validationEngine.detectMissingAttributes(products, config)
      : [];
    const baseValidation = product
      ? this.validationEngine.validateProduct(product)
      : this.validationEngine.validateConfiguration(config);
    if (!product) baseValidation.decision = "fail";

    const validation = this.normalizationValidator.validateNormalizationResult({
      products,
      duplicates,
      missingAttributes,
      invalidProducts,
      config,
      baseValidation,
    });

    if (product && validation.decision !== "fail") {
      const existingIdx = this.catalog.findIndex((p) => p.productId === product.productId);
      if (existingIdx >= 0) {
        this.catalog[existingIdx] = product;
      } else {
        this.catalog.push(product);
      }
    }

    return this.metadataGenerator.buildNormalizationReport({
      action: "normalize",
      products,
      duplicates,
      missingAttributes,
      invalidProducts,
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectDuplicates(
    input: DetectDuplicatesInput,
    config: MarketplaceProductNormalizationConfiguration,
  ): ProductNormalizationReport {
    const started = Date.now();
    const products = input.products ?? this.catalog;
    const duplicates = this.duplicateDetector.detect(products, config);
    const validation = this.validationEngine.validateCatalog(products, config);

    return this.metadataGenerator.buildNormalizationReport({
      action: "detect_duplicates",
      products,
      duplicates,
      missingAttributes: [],
      invalidProducts: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private verifyMcfConsumption(): void {
    if (!this.mcf) return;
    try {
      const connectors = this.mcf.getRegisteredConnectors();
      if (connectors.length === 0) {
        appendNormalizationLog({
          event: "mcf_consumption",
          level: "info",
          details: "MCF available — no connectors registered yet",
        });
      } else {
        appendNormalizationLog({
          event: "mcf_consumption",
          level: "info",
          details: `MCF consumed — ${connectors.length} connector(s) available`,
        });
      }
    } catch {
      appendNormalizationLog({
        event: "mcf_consumption",
        level: "warn",
        details: "MCF consumption check skipped",
      });
    }
  }

  resetForTesting(): void {
    this.catalog = [];
    this.includeDuplicateFixtures = false;
  }
}
