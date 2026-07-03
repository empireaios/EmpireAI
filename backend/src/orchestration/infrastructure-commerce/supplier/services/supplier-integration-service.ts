/**
 * G2-03 — Supplier integration service (discovery, validation, health monitoring).
 */

import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  SupplierAdapterContract,
  SupplierDiscoveryResult,
  SupplierHealthSnapshot,
  SupplierIntegrationLifecyclePhase,
} from "../contracts/supplier-integration-types.js";
import { validateSupplierPillowGovernance } from "../governance/supplier-pillow-governance.js";
import { transitionSupplierLifecycle } from "../lifecycle/supplier-integration-lifecycle.js";
import { resolveAllSupplierCapabilities } from "../registry/supplier-capability-resolver.js";
import { resolveSupplierRegistrySnapshot } from "../registry/supplier-registry-resolver.js";
import {
  assertUniqueSupplierIds,
  buildSupplierAdapterContract,
  resolveProductSourceRefsForSupplier,
} from "../validation/supplier-contract-validator.js";
import { buildSupplierDomainContractBundle } from "./supplier-domain-contract-service.js";

const lifecycleState = new Map<string, SupplierIntegrationLifecyclePhase>();

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverSuppliers(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): SupplierDiscoveryResult {
  const snapshot = resolveSupplierRegistrySnapshot(context, query);
  const suppliers = snapshot.suppliers.map((row) =>
    buildSupplierAdapterContract(
      row,
      resolveProductSourceRefsForSupplier(row.id, snapshot.productSources),
      "unknown",
      "validated",
    ),
  );
  assertUniqueSupplierIds(suppliers);

  for (const supplier of suppliers) {
    if (!lifecycleState.has(supplier.supplierId)) {
      lifecycleState.set(supplier.supplierId, "discover");
    }
  }

  return {
    discoveredCount: suppliers.length,
    suppliers,
    generatedAt: nowIso(),
    discoverySource: "RegistryLoader:REG-SUPPLIER",
  };
}

export function validateSupplierIntegration(
  context: RegistryLoaderContext,
  supplierId: string,
): { valid: boolean; contract?: SupplierAdapterContract; reason: string } {
  const snapshot = resolveSupplierRegistrySnapshot(context, { registryRowId: supplierId });
  const row = snapshot.suppliers[0];
  if (!row) {
    return {
      valid: false,
      reason: `Supplier registry row not found: ${supplierId}`,
    };
  }

  try {
    const contract = buildSupplierAdapterContract(
      row,
      resolveProductSourceRefsForSupplier(row.id, snapshot.productSources),
    );
    buildSupplierDomainContractBundle(context, row);
    lifecycleState.set(supplierId, "validate");
    return { valid: true, contract, reason: "Supplier integration contract validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function getSupplierHealthSnapshot(
  context: RegistryLoaderContext,
  supplierId: string,
): SupplierHealthSnapshot {
  const capabilities = resolveAllSupplierCapabilities(context).find(
    (entry) => entry.supplierId === supplierId,
  );
  const phase = lifecycleState.get(supplierId) ?? "discover";

  return {
    supplierId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advanceSupplierLifecycle(input: {
  actorId: string;
  workspaceId: string;
  supplierId: string;
  targetPhase: SupplierIntegrationLifecyclePhase;
  pillowGovernance: true;
}): ReturnType<typeof transitionSupplierLifecycle> {
  const governance = validateSupplierPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    supplierId: input.supplierId,
    operation: input.targetPhase,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const currentPhase = lifecycleState.get(input.supplierId) ?? "discover";
    return {
      supplierId: input.supplierId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = lifecycleState.get(input.supplierId) ?? "discover";
  const result = transitionSupplierLifecycle(currentPhase, {
    supplierId: input.supplierId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    lifecycleState.set(input.supplierId, result.currentPhase);
  }

  return result;
}

export function resetSupplierIntegrationStateForTests(): void {
  lifecycleState.clear();
}
