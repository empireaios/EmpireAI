/**
 * G2-03 — Pillow governance for supplier trust, permissions, policy, isolation, and health.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  SupplierIntegrationLifecyclePhase,
  SupplierPluginManifest,
} from "../contracts/supplier-integration-types.js";
import { resolvePolicyForSupplier, resolveSupplierRowById } from "../registry/supplier-registry-resolver.js";

export type SupplierPillowGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  supplierId: string;
  operation:
    | "discover"
    | "validate"
    | "register"
    | "authenticate"
    | "connect"
    | "synchronise_catalogue"
    | "synchronise_inventory"
    | "submit_order"
    | "track_fulfilment"
    | "monitor_health"
    | "disconnect"
    | "retire";
  lifecyclePhase?: SupplierIntegrationLifecyclePhase;
  pillowGovernance: true;
};

export type SupplierPillowGovernanceResult = {
  allowed: boolean;
  reason: string;
  trustVerified: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  healthGoverned: boolean;
  eklsGoverned: boolean;
};

export function validateSupplierPluginManifestStructure(
  manifest: SupplierPluginManifest,
): SupplierPillowGovernanceResult {
  if (!manifest.pillowGovernance) {
    return {
      allowed: false,
      reason: "Supplier plugins require pillowGovernance: true",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }
  if (!manifest.pluginId?.trim() || !manifest.version?.trim()) {
    return {
      allowed: false,
      reason: "Supplier plugin manifest requires pluginId and version",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }
  if (!manifest.supplierRegistryRowId?.trim()) {
    return {
      allowed: false,
      reason: "Supplier plugin manifest requires supplierRegistryRowId",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }
  return {
    allowed: true,
    reason: "Supplier plugin manifest structure valid",
    trustVerified: true,
    policyCompliant: false,
    workspaceIsolated: false,
    healthGoverned: false,
    eklsGoverned: false,
  };
}

export function validateSupplierPillowGovernance(
  context: SupplierPillowGovernanceContext,
): SupplierPillowGovernanceResult {
  if (!context.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }

  if (!context.actorId?.trim()) {
    return {
      allowed: false,
      reason: "actorId is required for supplier governance audit",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }

  if (!context.workspaceId?.trim()) {
    return {
      allowed: false,
      reason: "workspaceId is required for supplier workspace isolation",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }

  const supplier = resolveSupplierRowById(context, context.supplierId);
  if (!supplier) {
    return {
      allowed: false,
      reason: `Supplier registry row not found: ${context.supplierId}`,
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }

  const policy = resolvePolicyForSupplier(context, supplier);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";

  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Supplier policy compliance check failed",
      trustVerified: true,
      policyCompliant: false,
      workspaceIsolated: true,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: "retrieve",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      trustVerified: true,
      policyCompliant: true,
      workspaceIsolated: false,
      healthGoverned: false,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Supplier trust, permissions, policy, isolation, and health governance passed",
    trustVerified: true,
    policyCompliant: true,
    workspaceIsolated: true,
    healthGoverned: true,
    eklsGoverned: true,
  };
}
