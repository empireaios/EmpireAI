/**
 * G2-03 — Brain supplier capability discovery (RegistryLoader only — never bypasses Brain path).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { SUPPLIER_DOMAIN_CAPABILITIES } from "../contracts/supplier-integration-types.js";
import type { SupplierBrainCapabilityDescriptor } from "../contracts/supplier-integration-types.js";
import { discoverSuppliers } from "./supplier-integration-service.js";
import { resolveAllSupplierCapabilities } from "../registry/supplier-capability-resolver.js";

export function discoverSupplierCapabilitiesForBrain(
  context: RegistryLoaderContext = {},
): SupplierBrainCapabilityDescriptor[] {
  const discovery = discoverSuppliers(context);
  const capabilityMap = new Map(
    resolveAllSupplierCapabilities(context).map((entry) => [entry.supplierId, entry]),
  );

  return discovery.suppliers.map((supplier) => {
    const resolved = capabilityMap.get(supplier.supplierId);
    return {
      supplierId: supplier.supplierId,
      capabilities: supplier.capabilities,
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      supportedFeatures: supplier.supportedFeatures,
      discoverySource: "RegistryLoader:REG-SUPPLIER" as const,
    };
  });
}

export function listSupplierBrainDomainCapabilities(): readonly string[] {
  return SUPPLIER_DOMAIN_CAPABILITIES;
}
