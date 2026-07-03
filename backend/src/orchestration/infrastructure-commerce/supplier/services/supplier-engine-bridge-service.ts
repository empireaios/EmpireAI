/**
 * G2-03 — Supplier capability bridge for Business Engines (no embedded business logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { SupplierEngineCapabilityEnvelope } from "../contracts/supplier-integration-types.js";
import { discoverSuppliers } from "./supplier-integration-service.js";
import { resolveAllSupplierCapabilities } from "../registry/supplier-capability-resolver.js";

const SUPPLIER_ENGINE_BINDINGS: readonly CommerceEngineModule[] = [
  "supplier-intelligence-engine",
  "marketplace-infrastructure-engine",
  "storefront-assembly-engine",
  "order-execution-bridge",
  "analytics-intelligence-engine",
];

export function listSupplierEngineBindings(): readonly CommerceEngineModule[] {
  return SUPPLIER_ENGINE_BINDINGS;
}

export function provideSupplierCapabilityToEngine(
  context: RegistryLoaderContext,
  engineModule: CommerceEngineModule,
  supplierId?: string,
): SupplierEngineCapabilityEnvelope[] {
  if (!SUPPLIER_ENGINE_BINDINGS.includes(engineModule)) {
    return [];
  }

  const discovery = discoverSuppliers(context);
  const capabilities = resolveAllSupplierCapabilities(context);
  const targets = supplierId
    ? discovery.suppliers.filter((entry) => entry.supplierId === supplierId)
    : discovery.suppliers;

  return targets.map((supplier) => {
    const resolved = capabilities.find((entry) => entry.supplierId === supplier.supplierId);
    return {
      engineModule,
      supplierId: supplier.supplierId,
      capabilityIds: supplier.capabilities.map((capability) => `REG-SUPPLIER:${capability}`),
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      discoverySource: "RegistryLoader:supplier-engine-bridge" as const,
    };
  });
}

export function provideSupplierCapabilityToAllEngines(
  context: RegistryLoaderContext = {},
): SupplierEngineCapabilityEnvelope[] {
  return SUPPLIER_ENGINE_BINDINGS.flatMap((engineModule) =>
    provideSupplierCapabilityToEngine(context, engineModule),
  );
}
