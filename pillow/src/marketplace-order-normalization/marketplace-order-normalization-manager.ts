/** R1-13 — Marketplace Order Normalization Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendOrderNormalizationLog } from "./mon-logging.js";
import { MarketplaceOrderMapper } from "./marketplace-order-mapper.js";
import { OrderDuplicateDetector } from "./order-duplicate-detector.js";
import { OrderValidationEngine } from "./order-validation-engine.js";
import { OrderNormalizationValidator } from "./order-normalization-validator.js";
import { OrderMetadataGenerator } from "./order-metadata-generator.js";
import {
  getDuplicateOrderFixtures,
  getFixtureCatalog,
  getFixtureForMarketplace,
} from "./marketplace-order-fixtures.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type {
  DetectDuplicatesInput,
  NormalizeOrderInput,
  NormalizeOrdersInput,
  NormalizedOrderRecord,
  OrderNormalizationReport,
  RawMarketplaceOrderPayload,
} from "./types.js";

export class MarketplaceOrderNormalizationManager {
  private catalog: NormalizedOrderRecord[] = [];
  private readonly mapper = new MarketplaceOrderMapper();
  private readonly duplicateDetector = new OrderDuplicateDetector();
  private readonly validationEngine = new OrderValidationEngine();
  private readonly normalizationValidator = new OrderNormalizationValidator();
  private readonly metadataGenerator = new OrderMetadataGenerator();
  private includeDuplicateFixtures = false;

  constructor(private readonly mcf: MarketplaceConnectorFrameworkEngine | null) {}

  getCatalog(): NormalizedOrderRecord[] {
    return [...this.catalog];
  }

  setIncludeDuplicateFixturesForTesting(value: boolean): void {
    this.includeDuplicateFixtures = value;
  }

  resolveRawOrders(input: NormalizeOrdersInput): RawMarketplaceOrderPayload[] {
    if (input.rawOrders?.length) return input.rawOrders;
    if (input.marketplaceIdentifier) return getFixtureForMarketplace(input.marketplaceIdentifier);
    if (input.includeFixtureCatalog !== false) {
      const fixtures = getFixtureCatalog();
      return this.includeDuplicateFixtures ? [...fixtures, ...getDuplicateOrderFixtures()] : fixtures;
    }
    return [];
  }

  async normalizeOrders(
    input: NormalizeOrdersInput,
    config: MarketplaceOrderNormalizationConfiguration,
  ): Promise<OrderNormalizationReport> {
    const started = Date.now();
    const rawOrders = this.resolveRawOrders(input);
    const invalidOrders = this.validationEngine.detectInvalidRawOrders(rawOrders);

    const validRaw = rawOrders.filter(
      (o) =>
        !invalidOrders.some(
          (inv) =>
            inv.marketplaceIdentifier === o.marketplaceIdentifier &&
            inv.marketplaceOrderId === o.marketplaceOrderId,
        ),
    );

    const orders = this.mapper.mapBatch(validRaw, config);
    const duplicates = this.duplicateDetector.detect(orders, config);
    const missingAttributes = this.validationEngine.detectMissingAttributes(orders, config);
    const baseValidation = this.validationEngine.validateCatalog(orders, config);
    const validation = this.normalizationValidator.validateNormalizationResult({
      orders,
      duplicates,
      missingAttributes,
      invalidOrders,
      config,
      baseValidation,
    });

    if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
      appendOrderNormalizationLog({
        event: "validation_result",
        level: "warn",
        details: "Validation failed — preserving existing catalog",
      });
      return this.metadataGenerator.buildNormalizationReport({
        action: "normalize",
        orders: this.catalog,
        duplicates: [],
        missingAttributes: [],
        invalidOrders,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (validation.decision !== "fail") {
      this.catalog = orders;
    }

    this.verifyMcfConsumption();

    return this.metadataGenerator.buildNormalizationReport({
      action: "normalize",
      orders: this.catalog,
      duplicates,
      missingAttributes,
      invalidOrders,
      validation,
      durationMs: Date.now() - started,
    });
  }

  normalizeOrder(
    input: NormalizeOrderInput,
    config: MarketplaceOrderNormalizationConfiguration,
  ): OrderNormalizationReport {
    const started = Date.now();
    const payload: RawMarketplaceOrderPayload = {
      marketplaceIdentifier: input.marketplaceIdentifier,
      marketplaceOrderId: input.marketplaceOrderId,
      sourceData: input.sourceData,
    };

    const invalidOrders = this.validationEngine.detectInvalidRawOrders([payload]);
    const order = invalidOrders.length === 0 ? this.mapper.map(payload, config) : null;
    const orders = order ? [order] : [];
    const duplicates = order ? this.duplicateDetector.detect([...this.catalog, order], config) : [];
    const missingAttributes = order
      ? this.validationEngine.detectMissingAttributes(orders, config)
      : [];
    const baseValidation = order
      ? this.validationEngine.validateOrder(order)
      : this.validationEngine.validateConfiguration(config);
    if (!order) baseValidation.decision = "fail";

    const validation = this.normalizationValidator.validateNormalizationResult({
      orders,
      duplicates,
      missingAttributes,
      invalidOrders,
      config,
      baseValidation,
    });

    if (order && validation.decision !== "fail") {
      const existingIdx = this.catalog.findIndex((o) => o.orderId === order.orderId);
      if (existingIdx >= 0) {
        this.catalog[existingIdx] = order;
      } else {
        this.catalog.push(order);
      }
    }

    return this.metadataGenerator.buildNormalizationReport({
      action: "normalize",
      orders,
      duplicates,
      missingAttributes,
      invalidOrders,
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectDuplicates(
    input: DetectDuplicatesInput,
    config: MarketplaceOrderNormalizationConfiguration,
  ): OrderNormalizationReport {
    const started = Date.now();
    const orders = input.orders ?? this.catalog;
    const duplicates = this.duplicateDetector.detect(orders, config);
    const validation = this.validationEngine.validateCatalog(orders, config);

    return this.metadataGenerator.buildNormalizationReport({
      action: "detect_duplicates",
      orders,
      duplicates,
      missingAttributes: [],
      invalidOrders: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private verifyMcfConsumption(): void {
    if (!this.mcf) return;
    try {
      const connectors = this.mcf.getRegisteredConnectors();
      appendOrderNormalizationLog({
        event: "mcf_consumption",
        level: "info",
        details: connectors.length === 0
          ? "MCF available — no connectors registered yet"
          : `MCF consumed — ${connectors.length} connector(s) available`,
      });
    } catch {
      appendOrderNormalizationLog({
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
