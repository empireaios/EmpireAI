/**
 * G7-06 — Optimization policy seed (REG-OPTIMIZATION-POLICY).
 */

import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const OPTIMIZATION_POLICY_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  {
    id: "optimization-policy-grand-king-production",
    name: "Grand King Production Optimization Policy",
    description: "Registry-driven continuous intelligence and optimization policy for Version 1 live operations",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: [
      "REG-AUTOMATION-POLICY",
      "REG-COMMERCE-POLICY",
      "REG-READINESS-POLICY",
      "REG-CONNECTION-PROVIDER",
      "REG-FINANCIAL-POLICY",
    ],
    capabilities: ["optimize", "detect-opportunity", "detect-anomaly"],
    configuration: {
      optimizationPolicy: {
        schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
        policyId: "optimization-policy-grand-king-production",
        policyName: "Grand King Production Optimization Policy",
        domainRefs: [
          "domain:commerce",
          "domain:automation",
          "domain:financial_operations",
          "domain:identity",
          "domain:infrastructure",
          "domain:performance",
          "domain:business_engines",
          "domain:executive_ai",
          "domain:cockpit",
          "domain:production_workspace",
          "domain:providers",
          "domain:workflows",
        ],
        optimizationTypeRefs: [
          "type:performance_optimization",
          "type:cost_optimization",
          "type:automation_optimization",
          "type:workflow_optimization",
          "type:commerce_optimization",
          "type:financial_optimization",
          "type:provider_optimization",
          "type:resource_optimization",
          "type:risk_reduction",
          "type:revenue_opportunity",
          "type:future_optimization_type",
        ],
        opportunityRuleRefs: [
          "rule:commerce-throughput",
          "rule:automation-success-rate",
          "rule:financial-margin",
          "rule:provider-health",
          "rule:workflow-queue-depth",
        ],
        anomalyRuleRefs: [
          "rule:performance-degradation",
          "rule:cost-spike",
          "rule:automation-failure",
          "rule:financial-anomaly",
        ],
        prioritizationRuleRefs: [
          "rule:roi-weighted",
          "rule:risk-adjusted",
          "rule:revenue-impact",
        ],
        schedulerPolicyRef: "REG-READINESS-POLICY",
        approvalChainRef: "REG-READINESS-POLICY",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-OPTIMIZATION-POLICY rows" },
  },
];
