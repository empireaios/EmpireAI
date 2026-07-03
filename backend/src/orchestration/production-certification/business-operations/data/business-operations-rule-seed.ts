/**
 * G6-05 — Business operations rule seed (REG-CERTIFICATION-BUSINESS).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";

type RuleKind =
  | "marketplace"
  | "supplier"
  | "storefront"
  | "payment"
  | "logistics"
  | "analytics"
  | "workflow"
  | "automation"
  | "commerce"
  | "customer_journey"
  | "order_flow"
  | "refund_flow"
  | "inventory_flow"
  | "executive_reporting"
  | "business_engine_coordination";

function businessRow(input: {
  id: string;
  name: string;
  ruleKind: RuleKind;
  businessDomain: string;
  serviceId: string;
  businessSignals?: string[];
  blockerConditions?: string[];
  registryRef?: string;
  moduleResolverRef?: string;
  providerRef?: string;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Business operations ${input.ruleKind} rule for ${input.businessDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.businessSignals ?? [],
    capabilities: ["business-validate"],
    configuration: {
      businessOperationsRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        businessDomain: input.businessDomain,
        serviceId: input.serviceId,
        businessSignals: input.businessSignals ?? [],
        blockerConditions: input.blockerConditions ?? [],
        registryRef: input.registryRef,
        moduleResolverRef: input.moduleResolverRef,
        providerRef: input.providerRef,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-BUSINESS rows" },
  };
}

export const BUSINESS_OPERATIONS_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  businessRow({
    id: "bizops-rule-marketplace",
    name: "Marketplace operations certification",
    ruleKind: "marketplace",
    businessDomain: "marketplace_operations",
    serviceId: "marketplace-operations",
    businessSignals: ["signal:marketplace-registry", "signal:commerce-module"],
    blockerConditions: ["marketplace_unavailable"],
    registryRef: "REG-MARKETPLACE",
    moduleResolverRef: "resolve:infrastructure-commerce-module",
  }),
  businessRow({
    id: "bizops-rule-supplier",
    name: "Supplier operations certification",
    ruleKind: "supplier",
    businessDomain: "supplier_operations",
    serviceId: "supplier-operations",
    businessSignals: ["signal:supplier-registry"],
    blockerConditions: ["supplier_unavailable"],
    registryRef: "REG-SUPPLIER",
  }),
  businessRow({
    id: "bizops-rule-storefront",
    name: "Storefront operations certification",
    ruleKind: "storefront",
    businessDomain: "storefront_operations",
    serviceId: "storefront-operations",
    businessSignals: ["signal:storefront-registry"],
    blockerConditions: ["storefront_unavailable"],
    registryRef: "REG-STOREFRONT",
  }),
  businessRow({
    id: "bizops-rule-payment",
    name: "Payment flow certification",
    ruleKind: "payment",
    businessDomain: "payment_flow",
    serviceId: "payment-flow",
    businessSignals: ["signal:payment-registry", "signal:payment-flow-ready"],
    blockerConditions: ["payment_unavailable"],
    registryRef: "REG-PAYMENT",
  }),
  businessRow({
    id: "bizops-rule-logistics",
    name: "Logistics certification",
    ruleKind: "logistics",
    businessDomain: "inventory_flow",
    serviceId: "logistics-operations",
    businessSignals: ["signal:logistics-registry"],
    registryRef: "REG-LOGISTICS",
  }),
  businessRow({
    id: "bizops-rule-customer-journey",
    name: "Customer journey certification",
    ruleKind: "customer_journey",
    businessDomain: "customer_journey",
    serviceId: "customer-journey",
    businessSignals: ["signal:storefront-registry", "signal:commerce-policy-registry"],
    blockerConditions: ["commerce_inconsistency"],
    registryRef: "REG-COMMERCE-POLICY",
  }),
  businessRow({
    id: "bizops-rule-order-flow",
    name: "Order flow certification",
    ruleKind: "order_flow",
    businessDomain: "order_flow",
    serviceId: "order-lifecycle",
    businessSignals: ["signal:order-flow-ready", "signal:commerce-module"],
    blockerConditions: ["order_lifecycle_incomplete"],
    moduleResolverRef: "resolve:infrastructure-commerce-module",
  }),
  businessRow({
    id: "bizops-rule-refund-flow",
    name: "Refund flow certification",
    ruleKind: "refund_flow",
    businessDomain: "refund_flow",
    serviceId: "refund-lifecycle",
    businessSignals: ["signal:payment-flow-ready", "signal:commerce-policy-registry"],
    blockerConditions: ["payment_unavailable"],
    registryRef: "REG-COMMERCE-POLICY",
  }),
  businessRow({
    id: "bizops-rule-inventory",
    name: "Inventory flow certification",
    ruleKind: "inventory_flow",
    businessDomain: "inventory_flow",
    serviceId: "inventory-management",
    businessSignals: ["signal:supplier-registry", "signal:logistics-registry"],
    registryRef: "REG-PRODUCT-SOURCE",
  }),
  businessRow({
    id: "bizops-rule-commerce-automation",
    name: "Commerce automation certification",
    ruleKind: "commerce",
    businessDomain: "commerce_automation",
    serviceId: "commerce-automation",
    businessSignals: ["signal:commerce-module", "signal:commerce-policy-registry"],
    blockerConditions: ["commerce_inconsistency"],
    registryRef: "REG-COMMERCE-POLICY",
    moduleResolverRef: "resolve:infrastructure-commerce-module",
  }),
  businessRow({
    id: "bizops-rule-business-automation",
    name: "Business automation certification",
    ruleKind: "automation",
    businessDomain: "business_automation",
    serviceId: "business-automation",
    businessSignals: ["signal:automation-module", "signal:automation-workflow-registry"],
    blockerConditions: ["automation_unavailable", "workflow_failure"],
    moduleResolverRef: "resolve:business-automation-module",
    registryRef: "REG-AUTOMATION-WORKFLOW",
  }),
  businessRow({
    id: "bizops-rule-workflow",
    name: "Workflow certification",
    ruleKind: "workflow",
    businessDomain: "business_automation",
    serviceId: "business-workflows",
    businessSignals: ["signal:automation-workflow-registry"],
    blockerConditions: ["workflow_failure", "business_workflow_failure"],
    registryRef: "REG-AUTOMATION-WORKFLOW",
  }),
  businessRow({
    id: "bizops-rule-analytics",
    name: "Analytics certification",
    ruleKind: "analytics",
    businessDomain: "analytics",
    serviceId: "business-analytics",
    businessSignals: ["signal:analytics-ready", "signal:automation-report-registry"],
    blockerConditions: ["analytics_unavailable"],
    registryRef: "REG-AUTOMATION-REPORT",
  }),
  businessRow({
    id: "bizops-rule-executive-reporting",
    name: "Executive reporting certification",
    ruleKind: "executive_reporting",
    businessDomain: "executive_reporting",
    serviceId: "executive-reporting",
    businessSignals: ["signal:executive-intelligence-module", "signal:automation-report-registry"],
    moduleResolverRef: "resolve:executive-intelligence-orchestrator-module",
    registryRef: "REG-AUTOMATION-REPORT",
  }),
  businessRow({
    id: "bizops-rule-engine-coordination",
    name: "Business engine coordination certification",
    ruleKind: "business_engine_coordination",
    businessDomain: "business_engine_coordination",
    serviceId: "business-engine-coordinator",
    businessSignals: [
      "signal:commerce-module",
      "signal:automation-module",
      "signal:executive-intelligence-module",
    ],
    blockerConditions: ["plugin_incompatibility"],
    moduleResolverRef: "resolve:infrastructure-commerce-module",
  }),
];
