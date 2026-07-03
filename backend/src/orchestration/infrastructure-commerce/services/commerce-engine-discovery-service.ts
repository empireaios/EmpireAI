/**
 * G2-01 — Business Engine discovery via commerce registries (no embedded business logic).
 */

import {
  COMMERCE_ENGINE_MODULES,
  type CommerceEngineModule,
} from "../../../registry/types/commerce-registry-types.js";
import {
  COMMERCE_REGISTRY_IDS,
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
  REG_LOGISTICS,
  REG_MARKETPLACE,
  REG_PAYMENT,
  REG_PRODUCT_SOURCE,
  REG_STOREFRONT,
  REG_SUPPLIER,
  type CommerceRegistryId,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryResolveResult } from "../../../registry/types/registry-types.js";
import type { CommerceRegistryRowBase } from "../../../registry/types/commerce-registry-types.js";
import { resolveCommerceRegistry } from "../registry/commerce-registry-resolver.js";

export const COMMERCE_BUSINESS_ENGINE_DOMAINS = [
  "marketplace",
  "supplier",
  "storefront",
  "advertising",
  "payment",
  "logistics",
  "analytics",
] as const;

export type CommerceBusinessEngineDomain = (typeof COMMERCE_BUSINESS_ENGINE_DOMAINS)[number];

type CommerceEngineDiscoveryBinding = {
  domain: CommerceBusinessEngineDomain;
  engineModule: CommerceEngineModule;
  registryIds: readonly CommerceRegistryId[];
};

const ENGINE_DISCOVERY_BINDINGS: readonly CommerceEngineDiscoveryBinding[] = [
  {
    domain: "marketplace",
    engineModule: "marketplace-infrastructure-engine",
    registryIds: [REG_MARKETPLACE, REG_PRODUCT_SOURCE, REG_COMMERCE_POLICY, REG_COUNTRY_COMMERCE],
  },
  {
    domain: "supplier",
    engineModule: "supplier-intelligence-engine",
    registryIds: [REG_SUPPLIER, REG_PRODUCT_SOURCE, REG_COMMERCE_POLICY],
  },
  {
    domain: "storefront",
    engineModule: "storefront-assembly-engine",
    registryIds: [REG_STOREFRONT, REG_COMMERCE_POLICY],
  },
  {
    domain: "advertising",
    engineModule: "advertising-intelligence-engine",
    registryIds: [REG_MARKETPLACE, REG_COMMERCE_POLICY],
  },
  {
    domain: "payment",
    engineModule: "live-payment-engine",
    registryIds: [REG_PAYMENT, REG_COMMERCE_POLICY],
  },
  {
    domain: "logistics",
    engineModule: "order-execution-bridge",
    registryIds: [REG_LOGISTICS, REG_COMMERCE_POLICY],
  },
  {
    domain: "analytics",
    engineModule: "analytics-intelligence-engine",
    registryIds: COMMERCE_REGISTRY_IDS,
  },
];

export type CommerceEngineDiscoverySnapshot = {
  domain: CommerceBusinessEngineDomain;
  engineModule: CommerceEngineModule;
  registries: Record<CommerceRegistryId, RegistryResolveResult<CommerceRegistryRowBase>>;
  capabilityIds: string[];
  discoverySource: "RegistryLoader:commerce-engine-discovery";
};

function collectCapabilities(
  registries: Record<CommerceRegistryId, RegistryResolveResult<CommerceRegistryRowBase>>,
  registryIds: readonly CommerceRegistryId[],
): string[] {
  const capabilities = new Set<string>();
  for (const registryId of registryIds) {
    for (const row of registries[registryId].rows) {
      for (const capability of row.capabilities) {
        capabilities.add(`${registryId}:${capability}`);
      }
    }
  }
  return [...capabilities];
}

export function listCommerceBusinessEngineDomains(): readonly CommerceBusinessEngineDomain[] {
  return COMMERCE_BUSINESS_ENGINE_DOMAINS;
}

export function listCommerceEngineModules(): readonly CommerceEngineModule[] {
  return COMMERCE_ENGINE_MODULES;
}

export function discoverCommerceEngine(
  domain: CommerceBusinessEngineDomain,
  context: RegistryLoaderContext = {},
): CommerceEngineDiscoverySnapshot {
  const binding = ENGINE_DISCOVERY_BINDINGS.find((entry) => entry.domain === domain);
  if (!binding) {
    throw new Error(`Unknown commerce business engine domain: ${domain}`);
  }

  const registries = {} as Record<
    CommerceRegistryId,
    RegistryResolveResult<CommerceRegistryRowBase>
  >;
  for (const registryId of binding.registryIds) {
    registries[registryId] = resolveCommerceRegistry(context, registryId);
  }

  return {
    domain: binding.domain,
    engineModule: binding.engineModule,
    registries,
    capabilityIds: collectCapabilities(registries, binding.registryIds),
    discoverySource: "RegistryLoader:commerce-engine-discovery",
  };
}

export function discoverAllCommerceEngines(
  context: RegistryLoaderContext = {},
): CommerceEngineDiscoverySnapshot[] {
  return COMMERCE_BUSINESS_ENGINE_DOMAINS.map((domain) => discoverCommerceEngine(domain, context));
}
