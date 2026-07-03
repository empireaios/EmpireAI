/**
 * G6-07 — Executive operations certification rule seed (REG-CERTIFICATION-EXECUTIVE).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";
import type { ExecutiveOperationsRuleKind } from "../../../../registry/types/certification-registry-types.js";

function executiveRow(input: {
  id: string;
  name: string;
  ruleKind: ExecutiveOperationsRuleKind;
  executiveDomain: string;
  serviceId: string;
  executiveSignals?: string[];
  failureConditions?: string[];
  cockpitRouteRef?: string;
  expectedScreenId?: string;
  registryRef?: string;
  moduleResolverRef?: string;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Executive operations certification ${input.ruleKind} rule for ${input.executiveDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.executiveSignals ?? [],
    capabilities: ["executive-validate"],
    configuration: {
      executiveOperationsRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        executiveDomain: input.executiveDomain,
        serviceId: input.serviceId,
        executiveSignals: input.executiveSignals ?? [],
        failureConditions: input.failureConditions ?? [],
        cockpitRouteRef: input.cockpitRouteRef,
        expectedScreenId: input.expectedScreenId,
        registryRef: input.registryRef,
        moduleResolverRef: input.moduleResolverRef,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-EXECUTIVE rows" },
  };
}

export const EXECUTIVE_OPERATIONS_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  executiveRow({
    id: "exec-rule-cockpit-operations",
    name: "Grand King Cockpit operations certification",
    ruleKind: "cockpit_operations",
    executiveDomain: "grand_king_cockpit",
    serviceId: "cockpit",
    executiveSignals: ["signal:cockpit-route-ready", "signal:cockpit-panel-ready"],
    failureConditions: ["missing_executive_route", "broken_cockpit_panel"],
    cockpitRouteRef: "/cockpit",
    expectedScreenId: "SCR-001",
  }),
  executiveRow({
    id: "exec-rule-executive-home",
    name: "Executive Home certification",
    ruleKind: "executive_home",
    executiveDomain: "executive_home",
    serviceId: "executive-home",
    executiveSignals: ["signal:cockpit-route-ready", "signal:status-fresh"],
    failureConditions: ["missing_executive_route", "stale_status"],
    cockpitRouteRef: "/cockpit",
    expectedScreenId: "SCR-001",
    moduleResolverRef: "resolve:executive-home-module",
  }),
  executiveRow({
    id: "exec-rule-command-centre",
    name: "Command Centre certification",
    ruleKind: "command_centre",
    executiveDomain: "command_centre",
    serviceId: "cockpit-command",
    executiveSignals: ["signal:cockpit-route-ready", "signal:cockpit-panel-ready"],
    failureConditions: ["missing_executive_route", "broken_cockpit_panel"],
    cockpitRouteRef: "/cockpit/command",
    expectedScreenId: "SCR-010",
  }),
  executiveRow({
    id: "exec-rule-automation-centre",
    name: "Automation Centre certification",
    ruleKind: "automation_centre",
    executiveDomain: "automation_centre",
    serviceId: "cockpit-automation",
    executiveSignals: ["signal:automation-visibility", "signal:cockpit-route-ready"],
    failureConditions: ["missing_automation_visibility", "missing_executive_route"],
    cockpitRouteRef: "/cockpit/operations/automation",
    expectedScreenId: "SCR-303",
    registryRef: "REG-AUTOMATION-WORKFLOW",
  }),
  executiveRow({
    id: "exec-rule-authorization-centre",
    name: "Authorization Centre certification",
    ruleKind: "authorization_centre",
    executiveDomain: "authorization_centre",
    serviceId: "cockpit-approvals",
    executiveSignals: ["signal:approval-visibility", "signal:cockpit-route-ready"],
    failureConditions: ["missing_approval_visibility", "missing_executive_route"],
    cockpitRouteRef: "/cockpit/development/approvals",
    expectedScreenId: "SCR-801",
  }),
  executiveRow({
    id: "exec-rule-relationship-graph",
    name: "Relationship Graph certification",
    ruleKind: "relationship_graph",
    executiveDomain: "relationship_graph",
    serviceId: "executive-relationship-graph",
    executiveSignals: ["signal:cockpit-route-ready", "signal:ownership-clear"],
    failureConditions: ["missing_executive_route", "unclear_ownership"],
    cockpitRouteRef: "/cockpit/relationship",
    expectedScreenId: "SCR-015",
  }),
  executiveRow({
    id: "exec-rule-global-ai-assistant",
    name: "Global AI Assistant certification",
    ruleKind: "global_ai_assistant",
    executiveDomain: "global_ai_assistant",
    serviceId: "cockpit-global-assistant",
    executiveSignals: ["signal:ai-assistant-context", "signal:brain-module-ready"],
    failureConditions: ["missing_ai_assistant_context", "missing_brain_module"],
    moduleResolverRef: "resolve:cockpit-global-assistant-module",
  }),
  executiveRow({
    id: "exec-rule-approval-flow",
    name: "Approval Queue certification",
    ruleKind: "approval_flow",
    executiveDomain: "approval_queue",
    serviceId: "cockpit-approvals",
    executiveSignals: ["signal:approval-visibility", "signal:evidence-complete"],
    failureConditions: ["missing_approval_visibility", "incomplete_evidence"],
    cockpitRouteRef: "/cockpit/development/approvals",
    expectedScreenId: "SCR-801",
  }),
  executiveRow({
    id: "exec-rule-executive-reporting",
    name: "Executive Reports certification",
    ruleKind: "executive_reporting",
    executiveDomain: "executive_reports",
    serviceId: "executive-reporting",
    executiveSignals: ["signal:executive-report", "signal:evidence-complete"],
    failureConditions: ["missing_executive_report", "incomplete_evidence"],
  }),
  executiveRow({
    id: "exec-rule-decision-visibility",
    name: "Decision Intelligence visibility certification",
    ruleKind: "decision_visibility",
    executiveDomain: "decision_intelligence",
    serviceId: "decision-intelligence-engine",
    executiveSignals: ["signal:decision-visibility", "signal:cockpit-route-ready"],
    failureConditions: ["missing_executive_route"],
    cockpitRouteRef: "/cockpit/intelligence/decisions",
    expectedScreenId: "SCR-109",
  }),
  executiveRow({
    id: "exec-rule-readiness-visibility",
    name: "Readiness visibility certification",
    ruleKind: "readiness_visibility",
    executiveDomain: "readiness_visibility",
    serviceId: "operational-readiness",
    executiveSignals: ["signal:readiness-visibility", "signal:status-fresh"],
    failureConditions: ["missing_readiness_visibility", "stale_status"],
    registryRef: "REG-CERTIFICATION-OPERATIONAL",
  }),
  executiveRow({
    id: "exec-rule-automation-visibility",
    name: "Business Automation visibility certification",
    ruleKind: "automation_visibility",
    executiveDomain: "business_automation_visibility",
    serviceId: "business-automation",
    executiveSignals: ["signal:automation-visibility", "signal:automation-module"],
    failureConditions: ["missing_automation_visibility"],
    registryRef: "REG-AUTOMATION-WORKFLOW",
    moduleResolverRef: "resolve:business-automation-module",
  }),
  executiveRow({
    id: "exec-rule-commerce-visibility",
    name: "Commerce visibility certification",
    ruleKind: "commerce_visibility",
    executiveDomain: "commerce_visibility",
    serviceId: "infrastructure-commerce",
    executiveSignals: ["signal:commerce-visibility", "signal:commerce-module"],
    failureConditions: ["missing_executive_route"],
    cockpitRouteRef: "/cockpit/commerce/store",
    expectedScreenId: "SCR-200",
    registryRef: "REG-STOREFRONT",
  }),
  executiveRow({
    id: "exec-rule-risk-visibility",
    name: "Risk visibility certification",
    ruleKind: "risk_visibility",
    executiveDomain: "risk_visibility",
    serviceId: "risk-intelligence-engine",
    executiveSignals: ["signal:risk-visibility", "signal:cockpit-route-ready"],
    failureConditions: ["missing_executive_route"],
    cockpitRouteRef: "/cockpit/intelligence/risk",
    expectedScreenId: "SCR-108",
  }),
  executiveRow({
    id: "exec-rule-executive-action-safety",
    name: "Executive action safety certification",
    ruleKind: "executive_action_safety",
    executiveDomain: "executive_action_safety",
    serviceId: "pillow-governance",
    executiveSignals: ["signal:executive-action-safe", "signal:ownership-clear", "signal:evidence-complete"],
    failureConditions: ["unsafe_executive_action", "unclear_ownership", "incomplete_evidence"],
  }),
];
