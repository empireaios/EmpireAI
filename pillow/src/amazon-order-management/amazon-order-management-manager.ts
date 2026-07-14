/** R1-04 — Amazon Order Management Manager. */

import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import type { AmazonProductIntelligenceEngine } from "../amazon-product-intelligence/engine.js";
import { appendOrderLog } from "./amzord-logging.js";
import { AmazonOrderApiClient } from "./amazon-order-api-client.js";
import { AmazonOrderFetcher } from "./amazon-order-fetcher.js";
import { AmazonOrderStatusMapper } from "./amazon-order-status-mapper.js";
import { AmazonOrderLifecycleEngine } from "./amazon-order-lifecycle-engine.js";
import { AmazonOrderEventProcessor } from "./amazon-order-event-processor.js";
import { AmazonOrderValidator } from "./amazon-order-validator.js";
import { AmazonOrderMetadataGenerator } from "./amazon-order-metadata-generator.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type {
  AmazonOrderRecord,
  AmazonOrderSyncReport,
  FetchAmazonOrderInput,
  ProcessAmazonOrderEventInput,
  SyncAmazonOrdersInput,
} from "./types.js";

export class AmazonOrderManagementManager {
  private orders: AmazonOrderRecord[] = [];
  private readonly apiClient: AmazonOrderApiClient;
  private readonly fetcher: AmazonOrderFetcher;
  private readonly mapper = new AmazonOrderStatusMapper();
  private readonly lifecycleEngine: AmazonOrderLifecycleEngine;
  private readonly eventProcessor = new AmazonOrderEventProcessor();
  private readonly validator = new AmazonOrderValidator();
  private readonly metadataGenerator = new AmazonOrderMetadataGenerator();
  private fixtureOptions: Parameters<AmazonOrderFetcher["fetchAll"]>[2] = {};

  constructor(
    amazonIntegration: AmazonMarketplaceIntegrationEngine | null,
    _productIntelligence: AmazonProductIntelligenceEngine | null,
  ) {
    void _productIntelligence;
    this.apiClient = new AmazonOrderApiClient(amazonIntegration);
    this.fetcher = new AmazonOrderFetcher(this.apiClient);
    this.lifecycleEngine = new AmazonOrderLifecycleEngine(this.fetcher, this.mapper);
  }

  getOrders(): AmazonOrderRecord[] {
    return [...this.orders];
  }

  setFixtureOptionsForTesting(
    options: Parameters<AmazonOrderFetcher["fetchAll"]>[2],
  ): void {
    this.fixtureOptions = options;
  }

  async syncAmazonOrders(
    input: SyncAmazonOrdersInput,
    config: AmazonOrderManagementConfiguration,
  ): Promise<AmazonOrderSyncReport> {
    const started = Date.now();

    try {
      const { orders, changes, events } = await this.lifecycleEngine.sync(
        input.forceFullSync ? [] : this.orders,
        config,
        input,
        this.fixtureOptions,
      );

      const validation = this.validator.validateOrders(orders, config);
      if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
        appendOrderLog({
          event: "validation_result",
          level: "warn",
          details: "Validation failed — preserving existing orders",
        });
        return this.metadataGenerator.buildSyncReport({
          action: "sync",
          orders: this.orders,
          changes: {
            newOrders: [],
            updatedOrders: [],
            cancelledOrders: [],
            fulfilledOrders: [],
            refundedOrders: [],
            unchangedCount: 0,
          },
          events: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (validation.decision !== "fail") {
        this.orders = orders;
      }

      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        orders: this.orders,
        changes,
        events,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Order sync failed");

      return this.metadataGenerator.buildSyncReport({
        action: "sync",
        orders: this.orders,
        changes: {
          newOrders: [],
          updatedOrders: [],
          cancelledOrders: [],
          fulfilledOrders: [],
          refundedOrders: [],
          unchangedCount: 0,
        },
        events: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  async fetchAmazonOrder(
    input: FetchAmazonOrderInput,
    config: AmazonOrderManagementConfiguration,
  ): Promise<AmazonOrderSyncReport> {
    const started = Date.now();
    const raw = await this.fetcher.fetchOne(input, config);

    if (!raw) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push(`Order not found: ${input.amazonOrderId}`);
      return this.metadataGenerator.buildSyncReport({
        action: "fetch",
        orders: this.orders,
        changes: {
          newOrders: [],
          updatedOrders: [],
          cancelledOrders: [],
          fulfilledOrders: [],
          refundedOrders: [],
          unchangedCount: 0,
        },
        events: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const order = this.mapper.map(raw, config);
    const validation = this.validator.validateOrder(order);

    return this.metadataGenerator.buildSyncReport({
      action: "fetch",
      orders: validation.decision !== "fail" ? [order] : [],
      changes: {
        newOrders: validation.decision !== "fail" ? [order] : [],
        updatedOrders: [],
        cancelledOrders: [],
        fulfilledOrders: [],
        refundedOrders: [],
        unchangedCount: 0,
      },
      events: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  processOrderEvent(
    input: ProcessAmazonOrderEventInput,
    config: AmazonOrderManagementConfiguration,
  ): AmazonOrderSyncReport {
    const started = Date.now();
    const { events, orders, duplicate } = this.eventProcessor.process(
      input,
      this.orders,
      config,
    );

    if (!duplicate && config.allowOrderModification) {
      this.orders = orders;
    }

    const validation = this.validator.validateOrders(this.orders, config);

    return this.metadataGenerator.buildSyncReport({
      action: "process_event",
      orders: this.orders,
      changes: {
        newOrders: [],
        updatedOrders: [],
        cancelledOrders: [],
        fulfilledOrders: [],
        refundedOrders: [],
        unchangedCount: 0,
      },
      events,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.orders = [];
    this.fixtureOptions = {};
    this.eventProcessor.resetForTesting();
  }
}
