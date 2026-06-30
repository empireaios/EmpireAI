import type { SupplierAdapterRecord, SupplierProviderDefinition } from "../models/supplier-abstraction.js";
import { SUPPLIER_PROVIDER_CATALOG } from "../models/supplier-abstraction.js";
import { getConnectorRuntimeState } from "../../orchestration/reality-integration/index.js";

const ADAPTER_CAPABILITIES = [
  "product_search", "product_detail", "inventory", "shipping_estimate", "order_create", "tracking",
];

function resolveStatus(provider: SupplierProviderDefinition, hasCredentials: boolean): SupplierAdapterRecord["status"] {
  if (hasCredentials) return "CONNECTED";
  if (provider.architectureOnly) return "ARCHITECTURE_READY";
  return "CREDENTIALS_PENDING";
}

/** SUP-001 — Build adapter records for all supplier providers. */
export function buildSupplierAdapterRegistry(workspaceId: string): SupplierAdapterRecord[] {
  return SUPPLIER_PROVIDER_CATALOG.map((provider) => {
    let hasCredentials = false;
    if (provider.providerId === "cj-dropshipping") {
      const runtime = getConnectorRuntimeState(workspaceId, "cj-dropshipping");
      hasCredentials = Boolean(runtime?.credentialsRef);
    }

    const status = resolveStatus(provider, hasCredentials);
    const restrictions: string[] = [];
    if (provider.architectureOnly) restrictions.push("Architecture-only — no live API without credentials");
    if (provider.providerId === "cj-dropshipping" && !hasCredentials) {
      restrictions.push("CJ API key required in Reality Integration vault");
    }
    restrictions.push("Supplier product data is input — EmpireAI Intelligence decides");

    return {
      providerId: provider.providerId,
      displayName: provider.displayName,
      status,
      credentialsRef: hasCredentials ? `vault:${provider.providerId}` : null,
      capabilities: ADAPTER_CAPABILITIES,
      restrictions,
      health: hasCredentials ? "HEALTHY" : provider.revenueBlocking ? "WARNING" : "DISABLED",
      updatedAt: new Date().toISOString(),
    };
  });
}

export function getSupplierAdapter(workspaceId: string, providerId: string): SupplierAdapterRecord | null {
  return buildSupplierAdapterRegistry(workspaceId).find((a) => a.providerId === providerId) ?? null;
}
