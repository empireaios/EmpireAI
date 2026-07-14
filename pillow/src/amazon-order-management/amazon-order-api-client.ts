/** R1-04 — Amazon Order API client (structural — consumes R1-02 connector). */

import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import { AMAZON_ORDERS_API_PATHS } from "./paths.js";
import { appendOrderLog } from "./amzord-logging.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type { FetchAmazonOrderInput, RawAmazonOrderPayload } from "./types.js";

/** Structural order fixtures for R1-04 — no live SP-API HTTP. */
export const STRUCTURAL_ORDER_FIXTURES: RawAmazonOrderPayload[] = [
  {
    amazonOrderId: "111-1234567-8901234",
    orderTimestamp: "2026-07-10T08:30:00.000Z",
    buyerReference: "buyer-ref-001",
    orderStatus: "unshipped",
    items: [
      {
        asin: "B08N5WRWNW",
        sku: "AMZ-SKU-001",
        title: "Echo Dot (4th Gen)",
        quantity: 1,
        unitPrice: 49.99,
      },
    ],
    price: 49.99,
    currency: "USD",
    fulfilmentStatus: "pending",
    shippingStatus: "pending",
    refundStatus: "none",
    cancellationStatus: "none",
  },
  {
    amazonOrderId: "111-2345678-9012345",
    orderTimestamp: "2026-07-11T14:15:00.000Z",
    buyerReference: "buyer-ref-002",
    orderStatus: "shipped",
    items: [
      {
        asin: "B07XJ8C8F5",
        sku: "AMZ-SKU-002",
        title: "Fire TV Stick 4K",
        quantity: 2,
        unitPrice: 39.99,
      },
    ],
    price: 79.98,
    currency: "USD",
    fulfilmentStatus: "shipped",
    shippingStatus: "in_transit",
    refundStatus: "none",
    cancellationStatus: "none",
  },
  {
    amazonOrderId: "111-3456789-0123456",
    orderTimestamp: "2026-07-12T10:00:00.000Z",
    buyerReference: "buyer-ref-003",
    orderStatus: "pending",
    items: [
      {
        asin: "B09B8V1LZ3",
        sku: "AMZ-SKU-003",
        title: "Kindle Paperwhite",
        quantity: 1,
        unitPrice: 139.99,
      },
    ],
    price: 139.99,
    currency: "USD",
    fulfilmentStatus: "pending",
    shippingStatus: "pending",
    refundStatus: "none",
    cancellationStatus: "none",
  },
];

export class AmazonOrderApiClient {
  constructor(private readonly amazonIntegration: AmazonMarketplaceIntegrationEngine | null) {}

  async fetchOrders(
    region: "na" | "fe" | "eu",
    config: AmazonOrderManagementConfiguration,
    options?: {
      statusOverride?: RawAmazonOrderPayload["orderStatus"];
      omitOrderId?: string;
      fulfilmentOverride?: RawAmazonOrderPayload["fulfilmentStatus"];
      refundOverride?: RawAmazonOrderPayload["refundStatus"];
    },
  ): Promise<RawAmazonOrderPayload[]> {
    appendOrderLog({
      event: "order_fetch",
      level: "info",
      details: `Fetching Amazon orders (region=${region})`,
    });

    if (this.amazonIntegration) {
      const connector = this.amazonIntegration.getConnectorRecord();
      if (!connector || connector.currentOperationalState !== "active") {
        throw new Error("Amazon connector not active — connect Amazon before syncing orders");
      }
      await this.amazonIntegration.routeAmazonApi({
        method: "GET",
        path: AMAZON_ORDERS_API_PATHS.listOrders,
        region,
      });
    }

    void config;
    let fixtures = [...STRUCTURAL_ORDER_FIXTURES];
    if (options?.omitOrderId) {
      fixtures = fixtures.filter((o) => o.amazonOrderId !== options.omitOrderId);
    }
    if (options?.statusOverride || options?.fulfilmentOverride || options?.refundOverride) {
      fixtures = fixtures.map((o, i) =>
        i === 0
          ? {
              ...o,
              orderStatus: options.statusOverride ?? o.orderStatus,
              fulfilmentStatus: options.fulfilmentOverride ?? o.fulfilmentStatus,
              refundStatus: options.refundOverride ?? o.refundStatus,
              cancellationStatus:
                options.statusOverride === "cancelled" ? "confirmed" : o.cancellationStatus,
            }
          : o,
      );
    }
    return fixtures;
  }

  async fetchOrderById(
    input: FetchAmazonOrderInput,
    config: AmazonOrderManagementConfiguration,
  ): Promise<RawAmazonOrderPayload | null> {
    const region = input.region ?? "na";
    appendOrderLog({
      event: "order_fetch",
      level: "info",
      details: `Fetching Amazon order ${input.amazonOrderId} (region=${region})`,
    });

    if (this.amazonIntegration) {
      await this.amazonIntegration.routeAmazonApi({
        method: "GET",
        path: AMAZON_ORDERS_API_PATHS.getOrder.replace("{orderId}", input.amazonOrderId),
        region,
      });
    }

    void config;
    return STRUCTURAL_ORDER_FIXTURES.find((o) => o.amazonOrderId === input.amazonOrderId) ?? null;
  }
}
