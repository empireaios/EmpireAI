/**
 * G7-04 — Executive policy seed (REG-EXECUTIVE-POLICY).
 */

import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const EXECUTIVE_POLICY_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  {
    id: "executive-policy-grand-king-production",
    name: "Grand King Executive Decision Policy",
    description: "Registry-driven executive KPI, decision, and risk policy for Version 1 production",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: [
      "REG-READINESS-POLICY",
      "REG-COMMERCE-POLICY",
      "REG-AUTOMATION-POLICY",
      "REG-IDENTITY-PROVIDER",
    ],
    capabilities: ["executive-decide", "executive-aggregate"],
    configuration: {
      executivePolicy: {
        schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
        policyId: "executive-policy-grand-king-production",
        policyName: "Grand King Executive Decision Policy",
        kpiMetricRefs: [
          "kpi:revenue",
          "kpi:orders",
          "kpi:automation_success_rate",
          "kpi:workflow_queue",
          "kpi:approval_queue",
          "kpi:recovery_queue",
          "kpi:provider_health",
          "kpi:production_readiness",
          "kpi:commerce_readiness",
          "kpi:business_health",
          "kpi:risk_level",
          "kpi:incident_count",
          "kpi:learning_growth",
          "kpi:empire_health_score",
        ],
        decisionRuleRefs: [
          "rule:approve-when-ready",
          "rule:pause-on-risk",
          "rule:escalate-on-blocker",
          "rule:delegate-to-module",
        ],
        riskScoringRefs: ["risk:production-blocker", "risk:provider-degraded", "risk:approval-backlog"],
        approvalChainRef: "REG-AUTOMATION-APPROVAL",
        escalationPolicyRef: "REG-AUTOMATION-POLICY",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-EXECUTIVE-POLICY rows" },
  },
];
