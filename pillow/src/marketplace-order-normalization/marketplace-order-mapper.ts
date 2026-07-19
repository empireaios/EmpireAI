/** R1-13 — Marketplace order mapper. */

import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type { NormalizedOrderRecord, RawMarketplaceOrderPayload } from "./types.js";
import { OrderAttributeMapper } from "./order-attribute-mapper.js";
import { UnifiedOrderSchemaEngine } from "./unified-order-schema-engine.js";

export class MarketplaceOrderMapper {
  private readonly attributeMapper = new OrderAttributeMapper();
  private readonly schemaEngine = new UnifiedOrderSchemaEngine();

  map(
    payload: RawMarketplaceOrderPayload,
    config: MarketplaceOrderNormalizationConfiguration,
  ): NormalizedOrderRecord | null {
    if (!this.schemaEngine.isSupportedMarketplace(payload.marketplaceIdentifier)) {
      return null;
    }

    const source = payload.sourceData;
    const orderItems = this.attributeMapper.mapLineItems(source, payload.marketplaceIdentifier);
    const pricingSummary = this.attributeMapper.mapPricingSummary(source, orderItems);
    const itemQuantities = orderItems.map((i) => i.quantity);

    const draft: Omit<NormalizedOrderRecord, "schemaVersion" | "metadataVersion" | "normalizedAt"> = {
      orderId: this.schemaEngine.buildOrderId(payload.marketplaceIdentifier, payload.marketplaceOrderId),
      marketplaceIdentifier: payload.marketplaceIdentifier,
      marketplaceOrderId: payload.marketplaceOrderId,
      customerReference: this.attributeMapper.extractCustomerReference(source, payload.marketplaceIdentifier),
      orderStatus: String(source.order_status ?? source.status ?? source.orderStatus ?? "pending"),
      orderItems,
      itemQuantities,
      pricingSummary,
      currency: pricingSummary.currency,
      paymentStatus: String(source.payment_status ?? source.paymentStatus ?? "unknown"),
      fulfilmentStatus: String(source.fulfillment_status ?? source.fulfilment_status ?? source.fulfillmentStatus ?? "unfulfilled"),
      shippingStatus: source.shipping_status != null
        ? String(source.shipping_status)
        : source.shippingStatus != null
          ? String(source.shippingStatus)
          : null,
      refundStatus: source.refund_status != null
        ? String(source.refund_status)
        : source.refundStatus != null
          ? String(source.refundStatus)
          : null,
      marketplaceMetadata: this.buildMetadata(payload, source),
      normalizationStatus: "normalized",
    };

    if (!config.marketplaceMappingRulesEnabled) {
      draft.normalizationStatus = "normalized";
    }

    return this.schemaEngine.applySchema(draft, config);
  }

  mapBatch(
    payloads: RawMarketplaceOrderPayload[],
    config: MarketplaceOrderNormalizationConfiguration,
  ): NormalizedOrderRecord[] {
    return payloads
      .map((p) => this.map(p, config))
      .filter((o): o is NormalizedOrderRecord => o !== null);
  }

  private buildMetadata(
    payload: RawMarketplaceOrderPayload,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      marketplace_order_id: payload.marketplaceOrderId,
      marketplace_identifier: payload.marketplaceIdentifier,
      ...source,
    };
  }
}
