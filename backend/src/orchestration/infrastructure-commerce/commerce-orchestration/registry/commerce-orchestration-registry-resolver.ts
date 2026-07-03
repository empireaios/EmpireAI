/**
 * G2-08 — Commerce orchestration registry resolver (six commerce registries + policy).
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
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";
import type { CommerceOrchestrationProfileRow } from "../contracts/commerce-orchestration-types.js";
import {
  getCommerceOrchestrationProfileById,
  listCommerceOrchestrationProfiles,
} from "../data/commerce-orchestration-profile-store.js";

export type CommerceOrchestrationRegistrySnapshot = {
  profiles: CommerceOrchestrationProfileRow[];
  policies: CommercePolicyRow[];
  marketplaces: CommerceMarketplaceRow[];
  suppliers: CommerceSupplierRow[];
  storefronts: CommerceStorefrontRow[];
  payments: CommercePaymentRow[];
  logistics: CommerceLogisticsRow[];
  resolvedAt: string;
  registrySource: "REG-COMMERCE-POLICY|REG-MARKETPLACE|REG-SUPPLIER|REG-STOREFRONT|REG-PAYMENT|REG-LOGISTICS|CommerceOrchestrationCatalog";
};

export function resolveCommerceOrchestrationRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): CommerceOrchestrationRegistrySnapshot {
  let profiles = listCommerceOrchestrationProfiles();
  if (query?.registryRowId) {
    const row = getCommerceOrchestrationProfileById(query.registryRowId);
    profiles = row ? [row] : [];
  }

  return {
    profiles,
    policies: resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows,
    marketplaces: resolveCommerceRegistry<CommerceMarketplaceRow>(context, REG_MARKETPLACE).rows,
    suppliers: resolveCommerceRegistry<CommerceSupplierRow>(context, REG_SUPPLIER).rows,
    storefronts: resolveCommerceRegistry<CommerceStorefrontRow>(context, REG_STOREFRONT).rows,
    payments: resolveCommerceRegistry<CommercePaymentRow>(context, REG_PAYMENT).rows,
    logistics: resolveCommerceRegistry<CommerceLogisticsRow>(context, REG_LOGISTICS).rows,
    resolvedAt: new Date().toISOString(),
    registrySource:
      "REG-COMMERCE-POLICY|REG-MARKETPLACE|REG-SUPPLIER|REG-STOREFRONT|REG-PAYMENT|REG-LOGISTICS|CommerceOrchestrationCatalog",
  };
}

export function resolvePolicyForOrchestration(
  context: RegistryLoaderContext,
  profile: CommerceOrchestrationProfileRow,
): CommercePolicyRow | undefined {
  if (!profile.policyRef) return undefined;
  return resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: profile.policyRef,
  }).rows[0];
}

export function verifyOrchestrationRegistryRefs(
  context: RegistryLoaderContext,
  profile: CommerceOrchestrationProfileRow,
): { valid: boolean; missingRefs: string[] } {
  const integration = profile.configuration.orchestrationFramework as
    | { participatingComponents?: Array<{ registryRef: { registryId: string; registryRowId: string }; enabled: boolean }> }
    | undefined;
  const missingRefs: string[] = [];
  const snapshot = resolveCommerceOrchestrationRegistrySnapshot(context);

  for (const component of integration?.participatingComponents ?? []) {
    if (!component.enabled) continue;
    const { registryId, registryRowId } = component.registryRef;
    const found =
      (registryId === "REG-MARKETPLACE" &&
        snapshot.marketplaces.some((row) => row.id === registryRowId)) ||
      (registryId === "REG-SUPPLIER" &&
        snapshot.suppliers.some((row) => row.id === registryRowId)) ||
      (registryId === "REG-STOREFRONT" &&
        snapshot.storefronts.some((row) => row.id === registryRowId)) ||
      (registryId === "REG-PAYMENT" &&
        snapshot.payments.some((row) => row.id === registryRowId)) ||
      (registryId === "REG-LOGISTICS" &&
        snapshot.logistics.some((row) => row.id === registryRowId)) ||
      (registryId === "REG-COMMERCE-POLICY" &&
        snapshot.policies.some((row) => row.id === registryRowId));
    if (!found) {
      missingRefs.push(`${registryId}:${registryRowId}`);
    }
  }

  return { valid: missingRefs.length === 0, missingRefs };
}
