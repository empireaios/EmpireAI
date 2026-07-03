/**
 * EKLS — Governance Gateway.
 * All EKLS access must pass through Pillow governance.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

import { requireWorkspaceMatch } from "../policies/workspace-isolation-policy.js";
import { EKLS_OWNERSHIP_POLICY } from "../policies/ownership-policy.js";

export type EklsGovernanceContext = {
  /** Must be true — enforced at gateway */
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string | null;
  consumerChannel:
    | "cockpit"
    | "pillow"
    | "global-ai-assistant"
    | "business-automation"
    | "executive-reports"
    | "brain"
    | "executive-ai-engine"
    | "business-engine"
    | "guardian"
    | "mission-system"
    | "executive-audit"
    | "infrastructure-commerce"
    | "production-certification"
    | "grand-king-live-operations"
    | "grand-king-production-workspace"
    | "grand-king-commerce-operations"
    | "grand-king-business-automation-operations"
    | "grand-king-executive-decision-centre"
    | "grand-king-revenue-financial-operations"
    | "grand-king-continuous-intelligence-optimization"
    | "grand-king-autonomous-operations"
    | "grand-king-self-healing-operations"
    | "grand-king-operational-intelligence-executive-insights"
    | "identity-authorization"
    | "connection-registry"
    | "authorization-framework"
    | "credential-vault-integration"
    | "connection-health-monitoring"
    | "operational-readiness-engine"
    | "automatic-reauthorization"
    | "multi-workspace-isolation"
    | "identity-plugin-integration"
    | "empire-version-governance";
  operation: "store" | "retrieve" | "search" | "link" | "summarise" | "compare" | "schedule" | "aggregate";
  crossWorkspaceApproved?: boolean;
};

export type EklsGovernanceResult = {
  allowed: boolean;
  governanceState: "pillow-governed" | "rejected";
  reason: string;
  auditedAt: string;
};

export function validateEklsGovernanceContext(context: EklsGovernanceContext): EklsGovernanceResult {
  const auditedAt = new Date().toISOString();

  if (!context.pillowGovernance) {
    return {
      allowed: false,
      governanceState: "rejected",
      reason: "EKLS requires Pillow governance — pillowGovernance must be true",
      auditedAt,
    };
  }

  if (!context.workspaceId?.trim()) {
    return {
      allowed: false,
      governanceState: "rejected",
      reason: "workspaceId is required for all EKLS operations",
      auditedAt,
    };
  }

  if (!context.actorId?.trim()) {
    return {
      allowed: false,
      governanceState: "rejected",
      reason: "actorId is required for auditability",
      auditedAt,
    };
  }

  return {
    allowed: true,
    governanceState: "pillow-governed",
    reason: `EKLS ${context.operation} authorised for ${context.consumerChannel} under Pillow`,
    auditedAt,
  };
}

export function enforceEklsAccess(
  context: EklsGovernanceContext,
  targetWorkspaceId: string,
): EklsGovernanceResult {
  const base = validateEklsGovernanceContext(context);
  if (!base.allowed) return base;

  try {
    requireWorkspaceMatch(context.workspaceId, targetWorkspaceId, context.crossWorkspaceApproved ?? false);
  } catch (err) {
    return {
      allowed: false,
      governanceState: "rejected",
      reason: err instanceof Error ? err.message : String(err),
      auditedAt: new Date().toISOString(),
    };
  }

  return base;
}

export const EKLS_CANONICAL_SPEC_REF = "CANONICAL_EKLS_SPECIFICATION.md";
export const EKLS_OWNER = EKLS_OWNERSHIP_POLICY.owner;
