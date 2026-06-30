import type {
  GovernanceDecisionRequest,
  GovernancePolicyRule,
  GovernanceVerdict,
} from "../models/governance-policy.js";
import { readGovernanceEnvFlag } from "../config/governance-env-bridge.js";

function matchesPattern(value: string, pattern?: string): boolean {
  if (!pattern || pattern === "*") return true;
  if (pattern.endsWith("*")) {
    return value.startsWith(pattern.slice(0, -1));
  }
  return value === pattern;
}

function policyMatches(rule: GovernancePolicyRule, request: GovernanceDecisionRequest): boolean {
  if (!rule.enabled) return false;

  const moduleMatches =
    !rule.module || matchesPattern(request.module, rule.module) || rule.module === "*";
  const actionMatches =
    !rule.action || matchesPattern(request.action, rule.action) || rule.action === "*";

  if (!moduleMatches || !actionMatches) return false;

  if (rule.domain === request.domain || rule.domain === "policies") {
    return true;
  }

  // Cross-domain rules apply when module/action explicitly match (e.g. founder gates on launch)
  return Boolean(rule.module && rule.module !== "*");
}

function founderRole(role?: string): boolean {
  return role === "founder" || role === "admin";
}

function buildVerdict(
  request: GovernanceDecisionRequest,
  rule: GovernancePolicyRule,
  partial: Omit<GovernanceVerdict, "domain" | "policyId" | "policyName">,
): GovernanceVerdict {
  return {
    ...partial,
    domain: request.domain,
    policyId: rule.policyId,
    policyName: rule.name,
  };
}

/** Evaluates a governance decision request against workspace policies. */
export function evaluateGovernancePolicies(
  request: GovernanceDecisionRequest,
  policies: GovernancePolicyRule[],
): GovernanceVerdict {
  if (!request.workspaceId?.trim()) {
    return {
      allowed: false,
      requiresApproval: false,
      sandboxOnly: false,
      reason: "Workspace identity is required for every Empire decision",
      code: "IDENTITY_WORKSPACE_REQUIRED",
      domain: "identity",
    };
  }

  const applicable = policies
    .filter((rule) => policyMatches(rule, request))
    .sort((a, b) => b.priority - a.priority);

  let sandboxOnly = false;
  let explicitAllow: GovernanceVerdict | null = null;

  for (const rule of applicable) {
    const code = rule.metadata.code ?? rule.effect;

    switch (rule.effect) {
      case "DENY":
        return buildVerdict(request, rule, {
          allowed: false,
          requiresApproval: false,
          sandboxOnly: false,
          reason: rule.description,
          code,
        });

      case "REQUIRE_ENV_ENABLED": {
        const enabled = rule.envFlag ? readGovernanceEnvFlag(rule.envFlag) : false;
        if (!enabled) {
          return buildVerdict(request, rule, {
            allowed: false,
            requiresApproval: false,
            sandboxOnly: false,
            reason: `${rule.description} (${rule.envFlag ?? "env"}=false)`,
            code,
          });
        }
        break;
      }

      case "REQUIRE_FOUNDER_APPROVAL": {
        const approved =
          request.founderApproved === true ||
          request.payload.founderApproved === true ||
          request.action.includes("approve");
        const roleOk = !rule.requiredRole || founderRole(request.actorRole);

        if (!roleOk) {
          return buildVerdict(request, rule, {
            allowed: false,
            requiresApproval: true,
            approvalType: "founder",
            sandboxOnly: false,
            reason: "Grand King founder role required",
            code: "FOUNDER_ROLE_REQUIRED",
          });
        }

        if (!approved) {
          return buildVerdict(request, rule, {
            allowed: false,
            requiresApproval: true,
            approvalType: "founder",
            sandboxOnly: false,
            reason: rule.description,
            code,
          });
        }
        break;
      }

      case "REQUIRE_OPERATOR_ROLE": {
        const roleOk =
          request.actorRole === "operator" ||
          request.actorRole === "admin" ||
          founderRole(request.actorRole);
        if (!roleOk) {
          return buildVerdict(request, rule, {
            allowed: false,
            requiresApproval: false,
            sandboxOnly: false,
            reason: rule.description,
            code,
          });
        }
        break;
      }

      case "SANDBOX_ONLY":
        sandboxOnly = true;
        explicitAllow = buildVerdict(request, rule, {
          allowed: true,
          requiresApproval: false,
          sandboxOnly: true,
          reason: rule.description,
          code,
        });
        break;

      case "ALLOW":
        explicitAllow = buildVerdict(request, rule, {
          allowed: true,
          requiresApproval: false,
          sandboxOnly,
          reason: rule.description,
          code,
        });
        break;
    }
  }

  if (explicitAllow) {
    return { ...explicitAllow, sandboxOnly: sandboxOnly || explicitAllow.sandboxOnly };
  }

  return {
    allowed: true,
    requiresApproval: false,
    sandboxOnly,
    reason: "No governance policy blocked this decision — default allow",
    code: "GOVERNANCE_DEFAULT_ALLOW",
    domain: request.domain,
  };
}
