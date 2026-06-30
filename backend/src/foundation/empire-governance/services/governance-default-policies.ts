import { randomUUID } from "node:crypto";

import type {
  GovernanceDomain,
  GovernancePolicyRule,
} from "../models/governance-policy.js";
import { GOVERNANCE_ENV_FLAGS } from "../config/governance-env-bridge.js";

function policy(
  input: Omit<GovernancePolicyRule, "policyId" | "createdAt" | "updatedAt"> & {
    policyId?: string;
  },
): GovernancePolicyRule {
  const timestamp = new Date().toISOString();
  return {
    policyId: input.policyId ?? randomUUID(),
    workspaceId: input.workspaceId,
    domain: input.domain,
    name: input.name,
    description: input.description,
    module: input.module,
    action: input.action,
    effect: input.effect,
    envFlag: input.envFlag,
    requiredRole: input.requiredRole,
    priority: input.priority,
    enabled: input.enabled,
    metadata: input.metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default Empire governance policies — Protect The Empire doctrine, not hardcoded in modules. */
export function createDefaultGovernancePolicies(workspaceId: string): GovernancePolicyRule[] {
  const rules: Array<Omit<GovernancePolicyRule, "policyId" | "workspaceId" | "createdAt" | "updatedAt">> = [
    {
      domain: "founder",
      name: "Founder Role for Live Approvals",
      description: "Grand King founder or admin role required for approval actions",
      module: "*",
      action: "apply_approval",
      effect: "REQUIRE_FOUNDER_APPROVAL",
      requiredRole: "founder",
      priority: 900,
      enabled: true,
      metadata: { code: "FOUNDER_APPROVAL_REQUIRED" },
    },
    {
      domain: "founder",
      name: "Founder Role for Launch Actions",
      description: "Live launch and submit actions require founder governance",
      module: "*",
      action: "launch_campaign",
      effect: "REQUIRE_FOUNDER_APPROVAL",
      requiredRole: "founder",
      priority: 900,
      enabled: true,
      metadata: { code: "FOUNDER_LAUNCH_REQUIRED" },
    },
    {
      domain: "founder",
      name: "Founder Role for Live Submit",
      description: "LIVE CJ submit requires founder governance path",
      module: "live-cj-fulfillment",
      action: "submit_live",
      effect: "REQUIRE_FOUNDER_APPROVAL",
      requiredRole: "founder",
      priority: 900,
      enabled: true,
      metadata: { code: "FOUNDER_LIVE_SUBMIT" },
    },
    {
      domain: "deployment",
      name: "Production Deploy Env Gate",
      description: "Production deployment requires PRODUCTION_DEPLOYMENT_ENABLED via governance",
      module: "production-deploy",
      action: "execute_vercel",
      effect: "REQUIRE_ENV_ENABLED",
      envFlag: GOVERNANCE_ENV_FLAGS.PRODUCTION_DEPLOYMENT,
      priority: 800,
      enabled: true,
      metadata: { code: "DEPLOY_ENV_DISABLED" },
    },
    {
      domain: "deployment",
      name: "Production Deploy Founder Gate",
      description: "Production deployment requires Grand King approval before execute",
      module: "production-deploy",
      action: "execute_vercel",
      effect: "REQUIRE_FOUNDER_APPROVAL",
      priority: 850,
      enabled: true,
      metadata: { code: "DEPLOY_FOUNDER_REQUIRED" },
    },
    {
      domain: "marketing",
      name: "Meta Ads Launch Env Gate",
      description: "Meta campaign launch requires META_ADS_LAUNCH_ENABLED via governance",
      module: "meta-ads-connector",
      action: "launch_campaign",
      effect: "REQUIRE_ENV_ENABLED",
      envFlag: GOVERNANCE_ENV_FLAGS.META_ADS_LAUNCH,
      priority: 800,
      enabled: true,
      metadata: { code: "META_LAUNCH_ENV_DISABLED" },
    },
    {
      domain: "marketing",
      name: "Meta Ads Launch Approval",
      description: "Meta campaign launch requires founder approval token",
      module: "meta-ads-connector",
      action: "launch_campaign",
      effect: "REQUIRE_FOUNDER_APPROVAL",
      priority: 850,
      enabled: true,
      metadata: { code: "META_LAUNCH_APPROVAL" },
    },
    {
      domain: "supplier",
      name: "Live CJ Fulfillment Env Gate",
      description: "LIVE CJ fulfillment requires LIVE_CJ_FULFILLMENT_ENABLED via governance",
      module: "live-cj-fulfillment",
      action: "submit_live",
      effect: "REQUIRE_ENV_ENABLED",
      envFlag: GOVERNANCE_ENV_FLAGS.LIVE_CJ_FULFILLMENT,
      priority: 800,
      enabled: true,
      metadata: { code: "CJ_LIVE_ENV_DISABLED" },
    },
    {
      domain: "supplier",
      name: "Customer Order Live Fulfillment Gate",
      description: "Customer order live fulfillment env gate",
      module: "customer-orders",
      action: "submit_fulfillment",
      effect: "REQUIRE_ENV_ENABLED",
      envFlag: GOVERNANCE_ENV_FLAGS.CUSTOMER_ORDER_LIVE_FULFILLMENT,
      priority: 800,
      enabled: true,
      metadata: { code: "ORDER_LIVE_ENV_DISABLED" },
    },
    {
      domain: "capital",
      name: "Live Payment Env Gate",
      description: "Live payment processing requires LIVE_PAYMENT_ENABLED via governance",
      module: "live-payments",
      action: "create_checkout",
      effect: "REQUIRE_ENV_ENABLED",
      envFlag: GOVERNANCE_ENV_FLAGS.LIVE_PAYMENT,
      priority: 800,
      enabled: true,
      metadata: { code: "PAYMENT_LIVE_ENV_DISABLED" },
    },
    {
      domain: "capital",
      name: "Capital Withdrawal Founder Gate",
      description: "Treasury withdrawals require founder approval",
      module: "finance",
      action: "withdraw",
      effect: "REQUIRE_FOUNDER_APPROVAL",
      priority: 850,
      enabled: true,
      metadata: { code: "WITHDRAWAL_FOUNDER_REQUIRED" },
    },
    {
      domain: "grandKings",
      name: "Grand King's Revenue Cycle",
      description: "Grand King's Account operational cycles allowed for authenticated workspaces",
      module: "grand-kings-revenue-engine",
      action: "run_cycle",
      effect: "ALLOW",
      priority: 100,
      enabled: true,
      metadata: { code: "GRAND_KINGS_CYCLE_ALLOWED" },
    },
    {
      domain: "grandKings",
      name: "First Revenue Validation",
      description: "Sandbox revenue validation permitted under governance",
      module: "first-revenue-validation",
      action: "run",
      effect: "SANDBOX_ONLY",
      priority: 200,
      enabled: true,
      metadata: { code: "REVENUE_VALIDATION_SANDBOX" },
    },
    {
      domain: "approval",
      name: "Default Allow Read Operations",
      description: "Read and list operations pass governance by default",
      module: "*",
      action: "list_*",
      effect: "ALLOW",
      priority: 50,
      enabled: true,
      metadata: { code: "READ_ALLOW" },
    },
    {
      domain: "policies",
      name: "Governance Self-Management",
      description: "Governance policy reads allowed for operators",
      module: "empire-governance",
      action: "list_policies",
      effect: "ALLOW",
      priority: 100,
      enabled: true,
      metadata: { code: "GOVERNANCE_READ" },
    },
    {
      domain: "policies",
      name: "Governance Evaluation Always Allowed",
      description: "Modules must evaluate decisions through governance without being blocked",
      module: "empire-governance",
      action: "evaluate",
      effect: "ALLOW",
      priority: 1000,
      enabled: true,
      metadata: { code: "GOVERNANCE_EVAL_ALLOW" },
    },
  ];

  return rules.map((rule) => policy({ ...rule, workspaceId }));
}

export function resolveGovernanceDomain(module: string, action: string): GovernanceDomain {
  if (module === "production-deploy") return "deployment";
  if (module === "meta-ads-connector") return "marketing";
  if (module === "live-cj-fulfillment" || module === "suppliers") return "supplier";
  if (module === "live-payments" || module === "finance" || module === "revenue-loop") {
    return "capital";
  }
  if (module === "grand-kings-revenue-engine" || module === "first-revenue-validation") {
    return "grandKings";
  }
  if (module === "empire-governance" || module === "soul-file" || module === "soul-runtime") {
    return "policies";
  }
  if (action.includes("approve") || action.includes("approval")) return "approval";
  if (module === "dashboard" || module === "settings") return "identity";
  return "policies";
}
