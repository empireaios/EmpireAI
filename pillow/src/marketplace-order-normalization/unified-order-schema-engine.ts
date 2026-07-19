/** R1-13 — Unified order schema engine. */

import {
  MON_METADATA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  UNIFIED_ORDER_SCHEMA_VERSION,
} from "./paths.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type { NormalizedOrderRecord } from "./types.js";

export class UnifiedOrderSchemaEngine {
  getSchemaVersion(): string {
    return UNIFIED_ORDER_SCHEMA_VERSION;
  }

  isSupportedMarketplace(marketplaceIdentifier: string): boolean {
    return (SUPPORTED_MARKETPLACE_IDENTIFIERS as readonly string[]).includes(
      marketplaceIdentifier,
    );
  }

  buildOrderId(marketplaceIdentifier: string, marketplaceOrderId: string): string {
    const safeId = marketplaceOrderId.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `mon-${marketplaceIdentifier}-${safeId}`;
  }

  applySchema(
    draft: Omit<NormalizedOrderRecord, "schemaVersion" | "metadataVersion" | "normalizedAt">,
    config: MarketplaceOrderNormalizationConfiguration,
  ): NormalizedOrderRecord {
    const now = new Date().toISOString();

    if (!config.orderSchemaRulesEnabled) {
      return {
        ...draft,
        schemaVersion: UNIFIED_ORDER_SCHEMA_VERSION,
        metadataVersion: MON_METADATA_VERSION,
        normalizedAt: now,
      };
    }

    return {
      orderId: draft.orderId,
      marketplaceIdentifier: draft.marketplaceIdentifier,
      marketplaceOrderId: config.preserveSourceIdentifiers
        ? draft.marketplaceOrderId
        : draft.marketplaceOrderId.trim(),
      customerReference: draft.customerReference?.trim() || null,
      orderStatus: draft.orderStatus.trim(),
      orderItems: draft.orderItems.map((i) => ({ ...i })),
      itemQuantities: [...draft.itemQuantities],
      pricingSummary: { ...draft.pricingSummary },
      currency: draft.currency.toUpperCase(),
      paymentStatus: draft.paymentStatus.trim(),
      fulfilmentStatus: draft.fulfilmentStatus.trim(),
      shippingStatus: draft.shippingStatus?.trim() ?? null,
      refundStatus: draft.refundStatus?.trim() ?? null,
      marketplaceMetadata: { ...draft.marketplaceMetadata },
      normalizationStatus: draft.normalizationStatus,
      schemaVersion: UNIFIED_ORDER_SCHEMA_VERSION,
      metadataVersion: MON_METADATA_VERSION,
      normalizedAt: now,
    };
  }
}
