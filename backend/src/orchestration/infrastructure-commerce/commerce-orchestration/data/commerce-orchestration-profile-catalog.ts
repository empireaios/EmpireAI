/**
 * G2-08 — Foundation commerce orchestration profile seed (registry-backed refs only).
 */

import { COMMERCE_ORCHESTRATION_VERSION } from "../contracts/commerce-orchestration-types.js";
import type { CommerceOrchestrationProfileRow } from "../contracts/commerce-orchestration-types.js";

const foundationDomainContracts = {
  workflow_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  marketplace_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  supplier_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  storefront_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  payment_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  logistics_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  analytics_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  state_management: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
  health_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: true },
} as const;

const primaryOrchestrationConfiguration = {
  schemaVersion: COMMERCE_ORCHESTRATION_VERSION,
  executionScope: "cross_component" as const,
  participatingComponents: [
    {
      component: "marketplace" as const,
      registryRef: { registryId: "REG-MARKETPLACE", registryRowId: "mkt-foundation-primary-channel" },
      enabled: true,
    },
    {
      component: "supplier" as const,
      registryRef: { registryId: "REG-SUPPLIER", registryRowId: "sup-foundation-primary-fulfillment" },
      enabled: true,
    },
    {
      component: "storefront" as const,
      registryRef: { registryId: "REG-STOREFRONT", registryRowId: "sto-foundation-managed-storefront" },
      enabled: true,
    },
    {
      component: "payment" as const,
      registryRef: { registryId: "REG-PAYMENT", registryRowId: "pay-foundation-psp-primary" },
      enabled: true,
    },
    {
      component: "logistics" as const,
      registryRef: { registryId: "REG-LOGISTICS", registryRowId: "log-foundation-carrier-primary" },
      enabled: true,
    },
    {
      component: "analytics" as const,
      registryRef: {
        registryId: "REG-COMMERCE-POLICY",
        registryRowId: "pol-foundation-commerce-default",
      },
      enabled: true,
    },
  ],
  coordinationCapabilities: [
    "workflow_coordination",
    "marketplace_coordination",
    "supplier_coordination",
    "storefront_coordination",
    "payment_coordination",
    "logistics_coordination",
    "analytics_coordination",
    "state_management",
    "health_coordination",
  ] as const,
  domainContracts: foundationDomainContracts,
};

const secondaryOrchestrationConfiguration = {
  ...primaryOrchestrationConfiguration,
  executionScope: "multi_workspace" as const,
  participatingComponents: [
    {
      component: "marketplace" as const,
      registryRef: {
        registryId: "REG-MARKETPLACE",
        registryRowId: "mkt-foundation-secondary-channel",
      },
      enabled: true,
    },
    {
      component: "supplier" as const,
      registryRef: {
        registryId: "REG-SUPPLIER",
        registryRowId: "sup-foundation-secondary-wholesale",
      },
      enabled: true,
    },
    {
      component: "storefront" as const,
      registryRef: {
        registryId: "REG-STOREFRONT",
        registryRowId: "sto-foundation-headless-storefront",
      },
      enabled: true,
    },
    {
      component: "payment" as const,
      registryRef: { registryId: "REG-PAYMENT", registryRowId: "pay-foundation-psp-secondary" },
      enabled: true,
    },
    {
      component: "logistics" as const,
      registryRef: {
        registryId: "REG-LOGISTICS",
        registryRowId: "log-foundation-warehouse-secondary",
      },
      enabled: true,
    },
    {
      component: "analytics" as const,
      registryRef: {
        registryId: "REG-COMMERCE-POLICY",
        registryRowId: "pol-foundation-commerce-default",
      },
      enabled: false,
    },
  ],
  domainContracts: {
    ...foundationDomainContracts,
    analytics_coordination: { contractVersion: COMMERCE_ORCHESTRATION_VERSION, supported: false },
  },
};

export const COMMERCE_ORCHESTRATION_PROFILE_SEED: CommerceOrchestrationProfileRow[] = [
  {
    id: "orch-foundation-commerce-primary",
    name: "Foundation Primary Commerce Orchestration",
    description: "Generic cross-component commerce coordination profile",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["coordinate", "synchronise", "monitor"],
    configuration: { orchestrationFramework: primaryOrchestrationConfiguration },
    policyRef: "pol-foundation-commerce-default",
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_orchestration" },
  },
  {
    id: "orch-foundation-commerce-secondary",
    name: "Foundation Secondary Commerce Orchestration",
    description: "Multi-workspace commerce coordination profile slot",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["pol-foundation-commerce-default"],
    capabilities: ["coordinate", "recover"],
    configuration: { orchestrationFramework: secondaryOrchestrationConfiguration },
    policyRef: "pol-foundation-commerce-default",
    pluginSupport: { allowPluginRegistration: true, pluginKind: "commerce_orchestration" },
  },
];
