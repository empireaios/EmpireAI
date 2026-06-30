import type { BusinessPolicy } from "../models/business-policy.js";
import { CANONICAL_POLICY_IDS } from "../models/business-policy.js";

function businessPolicy(
  input: Omit<BusinessPolicy, "createdAt" | "updatedAt" | "resolveCount">,
): BusinessPolicy {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    resolveCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default business policies — configurable decisions, not hardcoded module logic. */
export function createDefaultBusinessPolicies(workspaceId: string): BusinessPolicy[] {
  return [
    businessPolicy({
      policyId: CANONICAL_POLICY_IDS.PRODUCT_SELECTION,
      workspaceId,
      category: "productSelection",
      name: "Product Selection Mode",
      description:
        "Controls whether product selection is manual (founder review) or automatic (AI-driven scoring).",
      decisionMode: "manual",
      config: {
        mode: "manual",
        autoScoreThreshold: 0.85,
        requireFounderReview: true,
      },
      status: "ACTIVE",
      version: 1,
      metadata: { configurable: "true" },
    }),
    businessPolicy({
      policyId: CANONICAL_POLICY_IDS.AD_APPROVAL,
      workspaceId,
      category: "adApproval",
      name: "Ad Campaign Approval",
      description: "Requires founder approval before Meta ad campaigns launch live.",
      decisionMode: "approval_required",
      config: {
        requireFounderApproval: true,
        allowDraftWithoutApproval: true,
      },
      executableEnforcement: {
        domain: "marketing",
        module: "meta-ads-connector",
        action: "launch_campaign",
        effect: "REQUIRE_FOUNDER_APPROVAL",
        requiredRole: "founder",
        priority: 840,
      },
      status: "ACTIVE",
      version: 1,
      metadata: { gate: "live-marketing" },
    }),
    businessPolicy({
      policyId: CANONICAL_POLICY_IDS.CAPITAL_APPROVAL,
      workspaceId,
      category: "capitalApproval",
      name: "Capital Deployment Approval",
      description: "Capital actions above threshold require Grand King founder approval.",
      decisionMode: "approval_required",
      config: {
        approvalThresholdCents: 500_000_00,
        requireFounderApproval: true,
        currency: "USD",
      },
      executableEnforcement: {
        domain: "capital",
        module: "live-payments",
        action: "create_checkout",
        effect: "REQUIRE_FOUNDER_APPROVAL",
        requiredRole: "founder",
        priority: 860,
      },
      status: "ACTIVE",
      version: 1,
      metadata: { gate: "capital" },
    }),
    businessPolicy({
      policyId: CANONICAL_POLICY_IDS.PRICING_RULES,
      workspaceId,
      category: "pricing",
      name: "Pricing Rules",
      description: "Pricing strategy and margin guardrails for product offers.",
      decisionMode: "manual",
      config: {
        strategy: "manual",
        minimumMarginPercent: 35,
        maximumDiscountPercent: 15,
        allowDynamicPricing: false,
      },
      status: "ACTIVE",
      version: 1,
      metadata: { domain: "commerce" },
    }),
    businessPolicy({
      policyId: CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE,
      workspaceId,
      category: "founderAi",
      name: "Founder AI Usage",
      description: "Controls AI-CEO and founder-assist agent access and authority levels.",
      decisionMode: "allow",
      config: {
        enabled: true,
        maxAuthorityLevel: "L3",
        requireAuditTrail: true,
        allowedModules: ["ai-ceo", "intelligence", "product-scout"],
      },
      status: "ACTIVE",
      version: 1,
      metadata: { tier: "founder" },
    }),
    businessPolicy({
      policyId: CANONICAL_POLICY_IDS.GRAND_KINGS_PRIVILEGES,
      workspaceId,
      category: "grandKingsPrivileges",
      name: "Grand King's Privileges",
      description: "Privilege matrix for Grand King's Account operations.",
      decisionMode: "allow",
      config: {
        canApproveCapital: true,
        canLaunchAds: true,
        canDeployProduction: true,
        canUseFounderAi: true,
        canOverrideGovernance: false,
        canModifyDoctrines: true,
        canModifyPolicies: true,
      },
      executableEnforcement: {
        domain: "grandKings",
        module: "grand-kings-revenue-engine",
        action: "run_cycle",
        effect: "ALLOW",
        priority: 150,
      },
      status: "ACTIVE",
      version: 1,
      metadata: { account: "grand-kings" },
    }),
  ];
}
