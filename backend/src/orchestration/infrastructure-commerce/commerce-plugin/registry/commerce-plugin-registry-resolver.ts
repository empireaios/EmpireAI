/**
 * G2-09 — Commerce plugin registry resolver.
 */

import type {
  CommerceLogisticsRow,
  CommerceMarketplaceRow,
  CommercePaymentRow,
  CommercePolicyRow,
  CommerceStorefrontRow,
  CommerceSupplierRow,
} from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_COMMERCE_POLICY,
  REG_LOGISTICS,
  REG_MARKETPLACE,
  REG_PAYMENT,
  REG_STOREFRONT,
  REG_SUPPLIER,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";
import { listCommercePluginSlots } from "../data/commerce-plugin-slot-store.js";

export type CommercePluginRegistrySnapshot = {
  slots: ReturnType<typeof listCommercePluginSlots>;
  policies: CommercePolicyRow[];
  marketplaces: CommerceMarketplaceRow[];
  suppliers: CommerceSupplierRow[];
  storefronts: CommerceStorefrontRow[];
  payments: CommercePaymentRow[];
  logistics: CommerceLogisticsRow[];
  resolvedAt: string;
  registrySource: "REG-COMMERCE-POLICY|REG-MARKETPLACE|REG-SUPPLIER|REG-STOREFRONT|REG-PAYMENT|REG-LOGISTICS|CommercePluginSlotCatalog";
};

export function resolveCommercePluginRegistrySnapshot(
  context: RegistryLoaderContext = {},
): CommercePluginRegistrySnapshot {
  return {
    slots: listCommercePluginSlots(),
    policies: resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows,
    marketplaces: resolveCommerceRegistry<CommerceMarketplaceRow>(context, REG_MARKETPLACE).rows,
    suppliers: resolveCommerceRegistry<CommerceSupplierRow>(context, REG_SUPPLIER).rows,
    storefronts: resolveCommerceRegistry<CommerceStorefrontRow>(context, REG_STOREFRONT).rows,
    payments: resolveCommerceRegistry<CommercePaymentRow>(context, REG_PAYMENT).rows,
    logistics: resolveCommerceRegistry<CommerceLogisticsRow>(context, REG_LOGISTICS).rows,
    resolvedAt: new Date().toISOString(),
    registrySource:
      "REG-COMMERCE-POLICY|REG-MARKETPLACE|REG-SUPPLIER|REG-STOREFRONT|REG-PAYMENT|REG-LOGISTICS|CommercePluginSlotCatalog",
  };
}

export function verifyPluginSlotRegistryRef(
  context: RegistryLoaderContext,
  registryId: string,
  registryRowId: string,
): boolean {
  const snapshot = resolveCommercePluginRegistrySnapshot(context);
  switch (registryId) {
    case "REG-MARKETPLACE":
      return snapshot.marketplaces.some((row) => row.id === registryRowId);
    case "REG-SUPPLIER":
      return snapshot.suppliers.some((row) => row.id === registryRowId);
    case "REG-STOREFRONT":
      return snapshot.storefronts.some((row) => row.id === registryRowId);
    case "REG-PAYMENT":
      return snapshot.payments.some((row) => row.id === registryRowId);
    case "REG-LOGISTICS":
      return snapshot.logistics.some((row) => row.id === registryRowId);
    case "REG-COMMERCE-POLICY":
      return snapshot.policies.some((row) => row.id === registryRowId);
    default:
      return false;
  }
}
