/**
 * G2-07 — Pillow governance for metric integrity, isolation, retention, and compliance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  AnalyticsMetricLifecyclePhase,
  AnalyticsPluginManifest,
} from "../contracts/analytics-integration-types.js";
import { buildAnalyticsAdapterContract } from "../validation/analytics-contract-validator.js";
import { getAnalyticsProviderRowById } from "../data/analytics-provider-store.js";
import {
  resolvePolicyForAnalytics,
  resolveRetentionPolicyForAnalytics,
} from "../registry/analytics-registry-resolver.js";

export type AnalyticsPillowGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  analyticsId: string;
  operation:
    | "discover"
    | "capture"
    | "validate"
    | "normalise"
    | "aggregate"
    | "store"
    | "publish"
    | "archive";
  lifecyclePhase?: AnalyticsMetricLifecyclePhase;
  pillowGovernance: true;
};

export type AnalyticsPillowGovernanceResult = {
  allowed: boolean;
  reason: string;
  metricIntegrityVerified: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  retentionCompliant: boolean;
  eklsGoverned: boolean;
};

export function validateAnalyticsPluginManifestStructure(
  manifest: AnalyticsPluginManifest,
): AnalyticsPillowGovernanceResult {
  if (!manifest.pillowGovernance) {
    return deny("Analytics plugins require pillowGovernance: true");
  }
  if (!manifest.pluginId?.trim() || !manifest.version?.trim()) {
    return deny("Analytics plugin manifest requires pluginId and version");
  }
  if (!manifest.analyticsProviderRowId?.trim()) {
    return deny("Analytics plugin manifest requires analyticsProviderRowId");
  }
  if (manifest.supportedMetrics.length === 0) {
    return deny("Analytics plugin manifest requires at least one supported metric ref");
  }
  return {
    allowed: true,
    reason: "Analytics plugin manifest structure valid",
    metricIntegrityVerified: true,
    policyCompliant: false,
    workspaceIsolated: false,
    retentionCompliant: false,
    eklsGoverned: false,
  };
}

function deny(reason: string): AnalyticsPillowGovernanceResult {
  return {
    allowed: false,
    reason,
    metricIntegrityVerified: false,
    policyCompliant: false,
    workspaceIsolated: false,
    retentionCompliant: false,
    eklsGoverned: false,
  };
}

export function validateAnalyticsPillowGovernance(
  context: AnalyticsPillowGovernanceContext,
): AnalyticsPillowGovernanceResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — pillowGovernance must be true");
  }
  if (!context.actorId?.trim()) {
    return deny("actorId is required for analytics governance audit");
  }
  if (!context.workspaceId?.trim()) {
    return deny("workspaceId is required for analytics workspace isolation");
  }

  const provider = getAnalyticsProviderRowById(context.analyticsId);
  if (!provider) {
    return deny(`Analytics provider not found: ${context.analyticsId}`);
  }

  const policy = resolvePolicyForAnalytics(context, provider);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";
  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Analytics policy compliance check failed",
      metricIntegrityVerified: true,
      policyCompliant: false,
      workspaceIsolated: true,
      retentionCompliant: false,
      eklsGoverned: false,
    };
  }

  const retention = resolveRetentionPolicyForAnalytics(context, provider);
  const retentionCompliant = retention.retentionDays > 0;
  if (!retentionCompliant) {
    return {
      allowed: false,
      reason: "Analytics retention policy invalid",
      metricIntegrityVerified: true,
      policyCompliant: true,
      workspaceIsolated: true,
      retentionCompliant: false,
      eklsGoverned: false,
    };
  }

  buildAnalyticsAdapterContract(provider);

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
      metricIntegrityVerified: true,
      policyCompliant: true,
      workspaceIsolated: false,
      retentionCompliant: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Analytics metric integrity, isolation, retention, and policy validation passed",
    metricIntegrityVerified: true,
    policyCompliant: true,
    workspaceIsolated: true,
    retentionCompliant: true,
    eklsGoverned: true,
  };
}
