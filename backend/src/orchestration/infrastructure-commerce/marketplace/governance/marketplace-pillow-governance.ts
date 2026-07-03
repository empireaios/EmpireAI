/**
 * G2-02 — Pillow governance for marketplace trust, permissions, policy, and isolation.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  MarketplaceIntegrationLifecyclePhase,
  MarketplacePluginManifest,
} from "../contracts/marketplace-integration-types.js";
import { resolvePolicyForMarketplace, resolveMarketplaceRowById } from "../registry/marketplace-registry-resolver.js";

export type MarketplacePillowGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  marketplaceId: string;
  operation:
    | "discover"
    | "validate"
    | "register"
    | "authenticate"
    | "connect"
    | "synchronise"
    | "monitor"
    | "disconnect"
    | "retire";
  lifecyclePhase?: MarketplaceIntegrationLifecyclePhase;
  pillowGovernance: true;
};

export type MarketplacePillowGovernanceResult = {
  allowed: boolean;
  reason: string;
  trustVerified: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  eklsGoverned: boolean;
};

export function validateMarketplacePluginManifestStructure(
  manifest: MarketplacePluginManifest,
): MarketplacePillowGovernanceResult {
  if (!manifest.pillowGovernance) {
    return {
      allowed: false,
      reason: "Marketplace plugins require pillowGovernance: true",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }
  if (!manifest.pluginId?.trim() || !manifest.version?.trim()) {
    return {
      allowed: false,
      reason: "Marketplace plugin manifest requires pluginId and version",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }
  if (!manifest.marketplaceRegistryRowId?.trim()) {
    return {
      allowed: false,
      reason: "Marketplace plugin manifest requires marketplaceRegistryRowId",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }
  return {
    allowed: true,
    reason: "Marketplace plugin manifest structure valid",
    trustVerified: true,
    policyCompliant: false,
    workspaceIsolated: false,
    eklsGoverned: false,
  };
}

export function validateMarketplacePillowGovernance(
  context: MarketplacePillowGovernanceContext,
): MarketplacePillowGovernanceResult {
  if (!context.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }

  if (!context.actorId?.trim()) {
    return {
      allowed: false,
      reason: "actorId is required for marketplace governance audit",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }

  if (!context.workspaceId?.trim()) {
    return {
      allowed: false,
      reason: "workspaceId is required for marketplace workspace isolation",
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }

  const marketplace = resolveMarketplaceRowById(context, context.marketplaceId);
  if (!marketplace) {
    return {
      allowed: false,
      reason: `Marketplace registry row not found: ${context.marketplaceId}`,
      trustVerified: false,
      policyCompliant: false,
      workspaceIsolated: false,
      eklsGoverned: false,
    };
  }

  const policy = resolvePolicyForMarketplace(context, marketplace);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";

  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Marketplace policy compliance check failed",
      trustVerified: true,
      policyCompliant: false,
      workspaceIsolated: true,
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
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Marketplace trust, permissions, policy, and workspace isolation passed",
    trustVerified: true,
    policyCompliant: true,
    workspaceIsolated: true,
    eklsGoverned: true,
  };
}
