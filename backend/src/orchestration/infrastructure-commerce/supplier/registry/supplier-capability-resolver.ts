/**
 * G2-03 — Supplier capability resolution from registry-backed contracts.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  SUPPLIER_DOMAIN_CAPABILITIES,
  SUPPLIER_INTEGRATION_LIFECYCLE,
  type SupplierCapabilityResolution,
  type SupplierDomainCapability,
  type SupplierFeatureFlag,
  type SupplierIntegrationLifecyclePhase,
} from "../contracts/supplier-integration-types.js";
import {
  buildSupplierAdapterContract,
  parseSupplierIntegrationConfiguration,
  resolveProductSourceRefsForSupplier,
} from "../validation/supplier-contract-validator.js";
import {
  resolvePolicyForSupplier,
  resolveSupplierRegistrySnapshot,
} from "./supplier-registry-resolver.js";

function resolveDomainCapabilities(
  configuration: ReturnType<typeof parseSupplierIntegrationConfiguration>,
): SupplierDomainCapability[] {
  return SUPPLIER_DOMAIN_CAPABILITIES.filter(
    (domain) => configuration.domainContracts[domain]?.supported === true,
  );
}

function isPolicyCompliant(
  context: RegistryLoaderContext,
  supplier: Parameters<typeof resolvePolicyForSupplier>[1],
): boolean {
  const policy = resolvePolicyForSupplier(context, supplier);
  if (!policy) {
    return supplier.dependencies.length === 0;
  }
  return policy.status === "VALIDATED" || policy.status === "PUBLISHED";
}

export function resolveSupplierCapabilities(
  context: RegistryLoaderContext,
  supplierId: string,
  lifecyclePhase: SupplierIntegrationLifecyclePhase = "discover",
): SupplierCapabilityResolution {
  const snapshot = resolveSupplierRegistrySnapshot(context, { registryRowId: supplierId });
  const supplier = snapshot.suppliers[0];
  if (!supplier) {
    throw new Error(`Unknown supplier registry row: ${supplierId}`);
  }

  const integration = parseSupplierIntegrationConfiguration(supplier.configuration);
  buildSupplierAdapterContract(
    supplier,
    resolveProductSourceRefsForSupplier(supplier.id, snapshot.productSources),
  );

  return {
    supplierId: supplier.id,
    resolvedCapabilities: resolveDomainCapabilities(integration),
    supportedFeatures: integration.supportedFeatures as SupplierFeatureFlag[],
    lifecyclePhase,
    policyCompliant: isPolicyCompliant(context, supplier),
    registryBacked: true,
  };
}

export function resolveAllSupplierCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: SupplierIntegrationLifecyclePhase = "discover",
): SupplierCapabilityResolution[] {
  const snapshot = resolveSupplierRegistrySnapshot(context);
  return snapshot.suppliers.map((supplier) =>
    resolveSupplierCapabilities(context, supplier.id, lifecyclePhase),
  );
}

export function listSupportedSupplierLifecyclePhases(): readonly SupplierIntegrationLifecyclePhase[] {
  return SUPPLIER_INTEGRATION_LIFECYCLE;
}
