/**
 * G7-00 — Live operation domain seed (REG-LIVE-OPERATIONS-DOMAIN).
 */

import {
  LIVE_OPERATIONS_REGISTRY_VERSION,
  type LiveOperationDomainId,
  type LiveOperationsRegistryRowBase,
} from "../../../registry/types/live-operations-registry-types.js";

function domainRow(input: {
  id: string;
  name: string;
  domainId: LiveOperationDomainId;
  operationType: string;
  certificationRegistryRef?: string;
  commerceRegistryRef?: string;
  automationRegistryRef?: string;
  identityRegistryRef?: string;
  readinessPolicyRef?: string;
  providerRef?: string;
}): LiveOperationsRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Grand King live operation domain: ${input.domainId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: [
      input.certificationRegistryRef,
      input.commerceRegistryRef,
      input.automationRegistryRef,
      input.identityRegistryRef,
    ].filter(Boolean) as string[],
    capabilities: ["live-operate"],
    configuration: {
      liveOperationDomain: {
        schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION,
        domainId: input.domainId,
        operationType: input.operationType,
        certificationRegistryRef: input.certificationRegistryRef,
        commerceRegistryRef: input.commerceRegistryRef,
        automationRegistryRef: input.automationRegistryRef,
        identityRegistryRef: input.identityRegistryRef,
        readinessPolicyRef: input.readinessPolicyRef,
        providerRef: input.providerRef,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: LIVE_OPERATIONS_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-LIVE-OPERATIONS-DOMAIN rows" },
  };
}

export const LIVE_OPERATION_DOMAIN_SEED_ROWS: LiveOperationsRegistryRowBase[] = [
  domainRow({
    id: "live-domain-grand-king-account",
    name: "Grand King account",
    domainId: "grand_king_account",
    operationType: "account_operations",
    identityRegistryRef: "REG-TENANT",
    certificationRegistryRef: "REG-CERTIFICATION-FINAL-READINESS",
    readinessPolicyRef: "policy:grand-king-account-boundary",
  }),
  domainRow({
    id: "live-domain-luminousyou-brand",
    name: "LuminousYou brand",
    domainId: "luminousyou_brand",
    operationType: "brand_operations",
    commerceRegistryRef: "REG-BRAND",
    certificationRegistryRef: "REG-CERTIFICATION-BUSINESS",
  }),
  domainRow({
    id: "live-domain-amazon",
    name: "Amazon operations",
    domainId: "amazon_operations",
    operationType: "marketplace_operations",
    commerceRegistryRef: "REG-MARKETPLACE",
    providerRef: "provider:amazon",
  }),
  domainRow({
    id: "live-domain-stripe",
    name: "Stripe operations",
    domainId: "stripe_operations",
    operationType: "payment_provider_operations",
    commerceRegistryRef: "REG-PAYMENT",
    providerRef: "provider:stripe",
  }),
  domainRow({
    id: "live-domain-storefront",
    name: "Storefront operations",
    domainId: "storefront_operations",
    operationType: "storefront_operations",
    commerceRegistryRef: "REG-STOREFRONT",
  }),
  domainRow({
    id: "live-domain-supplier",
    name: "Supplier operations",
    domainId: "supplier_operations",
    operationType: "supplier_operations",
    commerceRegistryRef: "REG-SUPPLIER",
  }),
  domainRow({
    id: "live-domain-payment",
    name: "Payment operations",
    domainId: "payment_operations",
    operationType: "payment_operations",
    commerceRegistryRef: "REG-PAYMENT",
  }),
  domainRow({
    id: "live-domain-automation",
    name: "Automation operations",
    domainId: "automation_operations",
    operationType: "automation_operations",
    automationRegistryRef: "REG-AUTOMATION-WORKFLOW",
    certificationRegistryRef: "REG-CERTIFICATION-OPERATIONAL",
  }),
  domainRow({
    id: "live-domain-executive-monitoring",
    name: "Executive monitoring",
    domainId: "executive_monitoring",
    operationType: "executive_monitoring",
    certificationRegistryRef: "REG-CERTIFICATION-EXECUTIVE",
  }),
  domainRow({
    id: "live-domain-incident-tracking",
    name: "Incident tracking",
    domainId: "incident_tracking",
    operationType: "incident_tracking",
    certificationRegistryRef: "REG-CERTIFICATION-FAILURE-RECOVERY",
    automationRegistryRef: "REG-AUTOMATION-RECOVERY",
  }),
  domainRow({
    id: "live-domain-outcome-learning",
    name: "Outcome learning",
    domainId: "outcome_learning",
    operationType: "outcome_learning",
    certificationRegistryRef: "REG-CERTIFICATION-DOMAIN",
    readinessPolicyRef: "policy:ekls-outcome-learning",
  }),
];
