/**
 * G2-01 — Pillow governance for commerce registry integrity, policy compliance, workspace isolation.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  REG_BRAND,
  REG_CATEGORY,
  REG_COMMERCE_POLICY,
  type CommerceRegistryId,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { CommerceRegistryRowBase } from "../../../registry/types/commerce-registry-types.js";
import { resolveCommerceRegistry } from "../registry/commerce-registry-resolver.js";

const WORKSPACE_SCOPED_REGISTRIES: CommerceRegistryId[] = [REG_BRAND, REG_CATEGORY];

export type CommerceRegistryGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  registryId: CommerceRegistryId;
  registryRowId?: string;
};

export type PillowCommerceRegistryGovernanceResult = {
  eligible: boolean;
  reason: string;
  eklsGoverned: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
};

function assertWorkspaceIsolation(
  context: CommerceRegistryGovernanceContext,
): PillowCommerceRegistryGovernanceResult | null {
  if (!WORKSPACE_SCOPED_REGISTRIES.includes(context.registryId)) {
    return null;
  }
  if (!context.workspaceId?.trim()) {
    return {
      eligible: false,
      reason: `${context.registryId} requires workspaceId for workspace isolation`,
      eklsGoverned: false,
      policyCompliant: false,
      workspaceIsolated: false,
    };
  }
  return null;
}

function assertPolicyCompliance(rows: CommerceRegistryRowBase[]): boolean {
  const policies = resolveCommerceRegistry({}, REG_COMMERCE_POLICY).rows;
  const activePolicyIds = new Set(
    policies.filter((row) => row.status === "VALIDATED" || row.status === "PUBLISHED").map((row) => row.id),
  );
  return rows.every((row) => {
    if (row.dependencies.length === 0) {
      return true;
    }
    return row.dependencies.some((dep) => activePolicyIds.has(dep));
  });
}

export function validateCommerceRegistryGovernance(
  context: CommerceRegistryGovernanceContext,
): PillowCommerceRegistryGovernanceResult {
  const workspaceBlock = assertWorkspaceIsolation(context);
  if (workspaceBlock) {
    return workspaceBlock;
  }

  if (!context.actorId?.trim()) {
    return {
      eligible: false,
      reason: "actorId is required for commerce registry governance audit",
      eklsGoverned: false,
      policyCompliant: false,
      workspaceIsolated: false,
    };
  }

  const resolved = resolveCommerceRegistry(context, context.registryId, {
    registryRowId: context.registryRowId,
  });

  if (!resolved.meta.wired) {
    return {
      eligible: false,
      reason: `${context.registryId} is not wired in foundation`,
      eklsGoverned: false,
      policyCompliant: false,
      workspaceIsolated: !WORKSPACE_SCOPED_REGISTRIES.includes(context.registryId) || Boolean(context.workspaceId),
    };
  }

  const policyCompliant = assertPolicyCompliance(resolved.rows);
  if (!policyCompliant) {
    return {
      eligible: false,
      reason: "Commerce registry row policy dependency chain failed Pillow compliance check",
      eklsGoverned: false,
      policyCompliant: false,
      workspaceIsolated: true,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId ?? "global",
      companyId: context.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: "retrieve",
    },
    context.workspaceId ?? "global",
  );

  if (!ekls.allowed) {
    return {
      eligible: false,
      reason: ekls.reason,
      eklsGoverned: false,
      policyCompliant: true,
      workspaceIsolated: true,
    };
  }

  return {
    eligible: true,
    reason: "Commerce registry integrity, policy compliance, and workspace isolation passed",
    eklsGoverned: true,
    policyCompliant: true,
    workspaceIsolated: true,
  };
}
