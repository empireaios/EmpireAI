/** R1-04 — Amazon order status mapper. */

import {
  AMAZON_ORDER_MARKETPLACE_ID,
  AMAZON_ORDER_METADATA_VERSION,
  AMAZON_ORDERS_API_PATHS,
} from "./paths.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type { AmazonOrderRecord, RawAmazonOrderPayload } from "./types.js";

export function buildOrderId(amazonOrderId: string): string {
  return `amzord-${amazonOrderId.replace(/[^a-zA-Z0-9]/g, "")}`;
}

export class AmazonOrderStatusMapper {
  map(payload: RawAmazonOrderPayload, config: AmazonOrderManagementConfiguration): AmazonOrderRecord {
    const now = new Date().toISOString();
    const quantity = payload.items.reduce((sum, i) => sum + i.quantity, 0);

    const buyerRef = config.maskSensitiveValues
      ? payload.buyerReference
        ? `buyer-ref-${payload.buyerReference.slice(-4)}`
        : null
      : (payload.buyerReference ?? null);

    return {
      orderId: buildOrderId(payload.amazonOrderId),
      amazonOrderId: payload.amazonOrderId,
      marketplaceId: AMAZON_ORDER_MARKETPLACE_ID,
      orderTimestamp: payload.orderTimestamp,
      buyerReference: buyerRef,
      orderStatus: payload.orderStatus,
      orderItems: payload.items.map((i) => ({ ...i })),
      quantity,
      price: payload.price,
      currency: payload.currency,
      fulfilmentStatus: payload.fulfilmentStatus,
      shippingStatus: payload.shippingStatus ?? null,
      refundStatus: payload.refundStatus ?? null,
      cancellationStatus: payload.cancellationStatus ?? null,
      sourceApiReference: `${AMAZON_ORDERS_API_PATHS.listOrders}#${payload.amazonOrderId}`,
      metadataVersion: AMAZON_ORDER_METADATA_VERSION,
      lastSyncedAt: now,
    };
  }

  mapBatch(
    payloads: RawAmazonOrderPayload[],
    config: AmazonOrderManagementConfiguration,
  ): AmazonOrderRecord[] {
    return payloads.map((p) => this.map(p, config));
  }

  mapAmazonStatusToLifecycle(
    order: AmazonOrderRecord,
  ): "new" | "updated" | "cancelled" | "fulfilled" | "refunded" | "unchanged" {
    if (order.orderStatus === "cancelled" || order.cancellationStatus === "confirmed") {
      return "cancelled";
    }
    if (order.refundStatus === "full" || order.refundStatus === "partial") {
      return "refunded";
    }
    if (order.orderStatus === "fulfilled" || order.fulfilmentStatus === "delivered") {
      return "fulfilled";
    }
    return "unchanged";
  }
}
