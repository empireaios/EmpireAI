/**
 * G6-04 — Operational readiness rule seed (REG-CERTIFICATION-OPERATIONAL).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";

type RuleKind =
  | "automation"
  | "commerce"
  | "marketplace_connection"
  | "supplier_connection"
  | "storefront_connection"
  | "payment_connection"
  | "identity_authorization"
  | "monitoring"
  | "alerting"
  | "recovery"
  | "observability"
  | "queue_processing"
  | "plugin_framework"
  | "brain_availability"
  | "pillow_governance"
  | "ekls_availability"
  | "registry_availability"
  | "external_dependency"
  | "provider";

function operationalRow(input: {
  id: string;
  name: string;
  ruleKind: RuleKind;
  readinessDomain: string;
  serviceId: string;
  readinessSignals?: string[];
  blockerConditions?: string[];
  registryRef?: string;
  moduleResolverRef?: string;
  providerRef?: string;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Operational readiness ${input.ruleKind} rule for ${input.readinessDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.readinessSignals ?? [],
    capabilities: ["operational-validate"],
    configuration: {
      operationalReadinessRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        readinessDomain: input.readinessDomain,
        serviceId: input.serviceId,
        readinessSignals: input.readinessSignals ?? [],
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
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-OPERATIONAL rows" },
  };
}

export const OPERATIONAL_READINESS_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  operationalRow({
    id: "opready-rule-automation",
    name: "Business automation readiness",
    ruleKind: "automation",
    readinessDomain: "business_automation",
    serviceId: "business-automation",
    readinessSignals: ["signal:automation-module", "signal:brain-available", "signal:pillow-available"],
    blockerConditions: ["automation_unavailable", "workflow_failures", "scheduler_failures"],
    moduleResolverRef: "resolve:business-automation-module",
  }),
  operationalRow({
    id: "opready-rule-commerce",
    name: "Commerce infrastructure readiness",
    ruleKind: "commerce",
    readinessDomain: "commerce_infrastructure",
    serviceId: "infrastructure-commerce",
    readinessSignals: ["signal:commerce-module", "signal:registry-available"],
    blockerConditions: ["missing_providers"],
    moduleResolverRef: "resolve:infrastructure-commerce-module",
    registryRef: "REG-MARKETPLACE",
  }),
  operationalRow({
    id: "opready-rule-marketplace",
    name: "Marketplace connection readiness",
    ruleKind: "marketplace_connection",
    readinessDomain: "marketplace_connections",
    serviceId: "marketplace-connection",
    readinessSignals: ["signal:marketplace-registry"],
    registryRef: "REG-MARKETPLACE",
    providerRef: "provider:marketplace",
  }),
  operationalRow({
    id: "opready-rule-supplier",
    name: "Supplier connection readiness",
    ruleKind: "supplier_connection",
    readinessDomain: "supplier_connections",
    serviceId: "supplier-connection",
    readinessSignals: ["signal:supplier-registry"],
    registryRef: "REG-SUPPLIER",
    providerRef: "provider:supplier",
  }),
  operationalRow({
    id: "opready-rule-storefront",
    name: "Storefront connection readiness",
    ruleKind: "storefront_connection",
    readinessDomain: "storefront_connections",
    serviceId: "storefront-connection",
    readinessSignals: ["signal:storefront-registry"],
    registryRef: "REG-STOREFRONT",
  }),
  operationalRow({
    id: "opready-rule-payment",
    name: "Payment connection readiness",
    ruleKind: "payment_connection",
    readinessDomain: "payment_connections",
    serviceId: "payment-connection",
    readinessSignals: ["signal:payment-registry"],
    blockerConditions: ["missing_authorizations"],
    registryRef: "REG-PAYMENT",
    providerRef: "provider:payment",
  }),
  operationalRow({
    id: "opready-rule-identity",
    name: "Identity & authorization readiness",
    ruleKind: "identity_authorization",
    readinessDomain: "identity_authorization",
    serviceId: "identity-registry",
    readinessSignals: ["signal:identity-module"],
    blockerConditions: ["missing_authorizations"],
    moduleResolverRef: "resolve:identity-registry-module",
  }),
  operationalRow({
    id: "opready-rule-monitoring",
    name: "Monitoring readiness",
    ruleKind: "monitoring",
    readinessDomain: "monitoring",
    serviceId: "platform-monitoring",
    readinessSignals: ["signal:monitoring-ready"],
    blockerConditions: ["monitoring_disabled"],
  }),
  operationalRow({
    id: "opready-rule-alerting",
    name: "Alerting readiness",
    ruleKind: "alerting",
    readinessDomain: "alerting",
    serviceId: "platform-alerting",
    readinessSignals: ["signal:monitoring-ready"],
    blockerConditions: ["monitoring_disabled"],
  }),
  operationalRow({
    id: "opready-rule-recovery",
    name: "Recovery readiness",
    ruleKind: "recovery",
    readinessDomain: "recovery",
    serviceId: "operational-recovery",
    readinessSignals: ["signal:recovery-ready", "signal:automation-module"],
    blockerConditions: ["recovery_unavailable"],
  }),
  operationalRow({
    id: "opready-rule-observability",
    name: "Observability readiness",
    ruleKind: "observability",
    readinessDomain: "observability",
    serviceId: "platform-observability",
    readinessSignals: ["signal:logging-ready", "signal:monitoring-ready"],
    blockerConditions: ["monitoring_disabled"],
  }),
  operationalRow({
    id: "opready-rule-queue",
    name: "Queue processing readiness",
    ruleKind: "queue_processing",
    readinessDomain: "queue_processing",
    serviceId: "job-queue",
    readinessSignals: ["signal:queue-ready"],
    blockerConditions: ["queue_failures"],
  }),
  operationalRow({
    id: "opready-rule-plugin",
    name: "Plugin framework readiness",
    ruleKind: "plugin_framework",
    readinessDomain: "plugin_framework",
    serviceId: "plugin-runtime",
    readinessSignals: ["signal:registry-available", "signal:pillow-available"],
    blockerConditions: ["plugin_failures"],
    registryRef: "REG-DOCTRINE",
  }),
  operationalRow({
    id: "opready-rule-brain",
    name: "Brain availability",
    ruleKind: "brain_availability",
    readinessDomain: "brain_availability",
    serviceId: "brain",
    readinessSignals: ["signal:brain-available"],
    blockerConditions: ["brain_unavailable"],
  }),
  operationalRow({
    id: "opready-rule-pillow",
    name: "Pillow governance availability",
    ruleKind: "pillow_governance",
    readinessDomain: "pillow_governance",
    serviceId: "pillow",
    readinessSignals: ["signal:pillow-available"],
    blockerConditions: ["pillow_unavailable"],
  }),
  operationalRow({
    id: "opready-rule-ekls",
    name: "EKLS availability",
    ruleKind: "ekls_availability",
    readinessDomain: "ekls_availability",
    serviceId: "ekls",
    readinessSignals: ["signal:ekls-available", "signal:pillow-available"],
    blockerConditions: ["ekls_unavailable"],
  }),
  operationalRow({
    id: "opready-rule-registry",
    name: "Registry availability",
    ruleKind: "registry_availability",
    readinessDomain: "registry_availability",
    serviceId: "registry",
    readinessSignals: ["signal:registry-available"],
    blockerConditions: ["registry_failures"],
    registryRef: "REG-DOCTRINE",
  }),
  operationalRow({
    id: "opready-rule-external-dependency",
    name: "External dependency readiness",
    ruleKind: "external_dependency",
    readinessDomain: "external_dependencies",
    serviceId: "external-providers",
    readinessSignals: ["signal:provider-catalog", "signal:integration-registry"],
    registryRef: "REG-INTEGRATION",
    providerRef: "provider:external",
  }),
  operationalRow({
    id: "opready-rule-provider",
    name: "Provider readiness aggregate",
    ruleKind: "provider",
    readinessDomain: "provider_readiness",
    serviceId: "provider-gateway",
    readinessSignals: ["signal:provider-catalog"],
    blockerConditions: ["missing_providers"],
    registryRef: "REG-PROVIDER",
  }),
];
