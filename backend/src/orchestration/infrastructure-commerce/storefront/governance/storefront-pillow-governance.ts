/**
 * G2-04 — Pillow governance for storefront provisioning, permissions, policy, isolation, publishing authority.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  StorefrontIntegrationLifecyclePhase,
  StorefrontPluginManifest,
} from "../contracts/storefront-integration-types.js";
import {
  resolvePolicyForStorefront,
  resolveStorefrontRowById,
} from "../registry/storefront-registry-resolver.js";

export type StorefrontPillowGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  storefrontId: string;
  operation:
    | "discover"
    | "validate"
    | "register"
    | "provision"
    | "configure"
    | "publish"
    | "synchronise"
    | "monitor"
    | "suspend"
    | "archive"
    | "retire";
  lifecyclePhase?: StorefrontIntegrationLifecyclePhase;
  pillowGovernance: true;
};

export type StorefrontPillowGovernanceResult = {
  allowed: boolean;
  reason: string;
  provisioningAuthorized: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  publishingAuthorized: boolean;
  eklsGoverned: boolean;
};

export function validateStorefrontPluginManifestStructure(
  manifest: StorefrontPluginManifest,
): StorefrontPillowGovernanceResult {
  if (!manifest.pillowGovernance) {
    return {
      allowed: false,
      reason: "Storefront plugins require pillowGovernance: true",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }
  if (!manifest.pluginId?.trim() || !manifest.version?.trim()) {
    return {
      allowed: false,
      reason: "Storefront plugin manifest requires pluginId and version",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }
  if (!manifest.storefrontRegistryRowId?.trim()) {
    return {
      allowed: false,
      reason: "Storefront plugin manifest requires storefrontRegistryRowId",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }
  return {
    allowed: true,
    reason: "Storefront plugin manifest structure valid",
    provisioningAuthorized: false,
    policyCompliant: false,
    workspaceIsolated: false,
    publishingAuthorized: false,
    eklsGoverned: false,
  };
}

export function validateStorefrontPillowGovernance(
  context: StorefrontPillowGovernanceContext,
): StorefrontPillowGovernanceResult {
  if (!context.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }

  if (!context.actorId?.trim()) {
    return {
      allowed: false,
      reason: "actorId is required for storefront governance audit",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }

  if (!context.workspaceId?.trim()) {
    return {
      allowed: false,
      reason: "workspaceId is required for storefront workspace isolation",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }

  const storefront = resolveStorefrontRowById(context, context.storefrontId);
  if (!storefront) {
    return {
      allowed: false,
      reason: `Storefront registry row not found: ${context.storefrontId}`,
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }

  const policy = resolvePolicyForStorefront(context, storefront);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";

  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Storefront policy compliance check failed",
      provisioningAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: true,
      publishingAuthorized: false,
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
      provisioningAuthorized: false,
      policyCompliant: true,
      workspaceIsolated: false,
      publishingAuthorized: false,
      eklsGoverned: false,
    };
  }

  const publishingAuthorized =
    context.operation === "publish" || context.operation === "synchronise"
      ? policyCompliant
      : true;

  const provisioningAuthorized =
    context.operation === "provision" || context.operation === "configure"
      ? policyCompliant
      : true;

  return {
    allowed: true,
    reason: "Storefront provisioning, permissions, policy, isolation, and publishing authority passed",
    provisioningAuthorized,
    policyCompliant: true,
    workspaceIsolated: true,
    publishingAuthorized,
    eklsGoverned: true,
  };
}
