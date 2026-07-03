/**
 * G2-01 — Infrastructure & Commerce registry resolver.
 * Consumes Pillow-governed commerce registries via RegistryLoader — never owns registry data.
 */

import {
  COMMERCE_REGISTRY_IDS,
  getRegistryLoader,
  type CommerceRegistryId,
  type RegistryLoaderContext,
  type RegistryQuery,
  type RegistryResolveResult,
} from "../../../registry/index.js";
import type { CommerceRegistryRowBase } from "../../../registry/types/commerce-registry-types.js";

export function listCommerceRegistryIds(): readonly CommerceRegistryId[] {
  return COMMERCE_REGISTRY_IDS;
}

export function resolveCommerceRegistry<T extends CommerceRegistryRowBase = CommerceRegistryRowBase>(
  context: RegistryLoaderContext,
  registryId: CommerceRegistryId,
  query?: RegistryQuery,
): RegistryResolveResult<T> {
  return getRegistryLoader().resolve<T>(context, registryId, query);
}

export function resolveAllCommerceRegistries(
  context: RegistryLoaderContext = {},
): Record<CommerceRegistryId, RegistryResolveResult<CommerceRegistryRowBase>> {
  const catalog = {} as Record<
    CommerceRegistryId,
    RegistryResolveResult<CommerceRegistryRowBase>
  >;
  for (const registryId of COMMERCE_REGISTRY_IDS) {
    catalog[registryId] = resolveCommerceRegistry(context, registryId);
  }
  return catalog;
}

export function discoverCommerceCapabilitiesForBrain(
  context: RegistryLoaderContext = {},
): Array<{
  registryId: CommerceRegistryId;
  rowCount: number;
  capabilities: string[];
  wired: boolean;
}> {
  return COMMERCE_REGISTRY_IDS.map((registryId) => {
    const result = resolveCommerceRegistry(context, registryId);
    const capabilities = new Set<string>();
    for (const row of result.rows) {
      for (const capability of row.capabilities) {
        capabilities.add(capability);
      }
    }
    return {
      registryId,
      rowCount: result.rows.length,
      capabilities: [...capabilities],
      wired: result.meta.wired,
    };
  });
}
