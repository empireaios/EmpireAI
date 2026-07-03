/**
 * G7-05 — Financial policy seed (REG-FINANCIAL-POLICY).
 */

import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const FINANCIAL_POLICY_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  {
    id: "financial-policy-grand-king-production",
    name: "Grand King Production Financial Policy",
    description: "Registry-driven financial policy for Version 1 production operations",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-COMMERCE-POLICY", "REG-CONNECTION-PROVIDER", "REG-READINESS-POLICY"],
    capabilities: ["financial-operate", "financial-reconcile"],
    configuration: {
      financialPolicy: {
        schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
        policyId: "financial-policy-grand-king-production",
        policyName: "Grand King Production Financial Policy",
        defaultCurrency: "USD",
        feeRateRefs: ["fee:stripe-processing", "fee:amazon-referral", "fee:shopify-subscription"],
        taxRateRefs: ["tax:standard-vat", "tax:us-sales"],
        domainRefs: [
          "domain:amazon_revenue",
          "domain:shopify_revenue",
          "domain:stripe_revenue",
          "domain:subscription_revenue",
          "domain:advertising_spend",
          "domain:supplier_cost",
          "domain:refunds",
          "domain:chargebacks",
          "domain:shipping_cost",
          "domain:operational_cost",
          "domain:net_profit",
          "domain:cash_position",
          "domain:projected_profit",
        ],
        kpiMetricRefs: [
          "kpi:gross_revenue",
          "kpi:net_revenue",
          "kpi:gross_profit",
          "kpi:net_profit",
          "kpi:profit_margin",
          "kpi:subscription_mrr",
          "kpi:advertising_roi",
          "kpi:refund_rate",
          "kpi:chargeback_rate",
          "kpi:cash_available",
          "kpi:outstanding_payouts",
          "kpi:operational_expenses",
        ],
        reconciliationPolicyRef: "REG-READINESS-POLICY",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-FINANCIAL-POLICY rows" },
  },
];
