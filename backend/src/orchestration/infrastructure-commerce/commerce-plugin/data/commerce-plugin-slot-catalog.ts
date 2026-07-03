/**
 * G2-09 — Foundation commerce plugin slot catalog (registry-backed — no hardcoded providers).
 */

import {
  COMMERCE_PLUGIN_INTEGRATION_VERSION,
  type CommercePluginCategory,
  type CommercePluginKind,
  type CommercePluginSlotRow,
} from "../contracts/commerce-plugin-integration-types.js";

function createSlot(input: {
  id: string;
  name: string;
  category: CommercePluginCategory;
  pluginKind: CommercePluginKind;
  registryId: string;
  registryRowId: string;
  supportedCapabilities: string[];
}): CommercePluginSlotRow {
  return {
    id: input.id,
    name: input.name,
    description: `Generic ${input.name} extension slot — provider resolved from registry at runtime`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["pol-foundation-commerce-default"],
    policyRef: "pol-foundation-commerce-default",
    configuration: {
      pluginSlot: {
        schemaVersion: COMMERCE_PLUGIN_INTEGRATION_VERSION,
        category: input.category,
        pluginKind: input.pluginKind,
        supportedCapabilities: input.supportedCapabilities,
        supportedInterfaces: ["framework_register", "capability_resolve", "health_probe"],
        registryRef: { registryId: input.registryId, registryRowId: input.registryRowId },
        permissions: [{ permissionId: "commerce.plugin.execute", scope: "execute" }],
        compatibility: {
          minFrameworkVersion: "ea-003-v1",
          supportedCategories: [input.category],
          isolationRequired: true,
        },
        lifecycleHooks: ["discover", "validate", "register", "load", "enable", "monitor", "disable"],
        configuration: { extensionMode: "framework_only" },
      },
    },
  };
}

export const COMMERCE_PLUGIN_SLOT_CATALOG: CommercePluginSlotRow[] = [
  createSlot({
    id: "cplugin-slot-foundation-marketplace",
    name: "Foundation Marketplace Plugin Slot",
    category: "marketplace_plugins",
    pluginKind: "commerce_marketplace",
    registryId: "REG-MARKETPLACE",
    registryRowId: "mkt-foundation-primary-channel",
    supportedCapabilities: ["connection", "publish-route"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-supplier",
    name: "Foundation Supplier Plugin Slot",
    category: "supplier_plugins",
    pluginKind: "commerce_supplier",
    registryId: "REG-SUPPLIER",
    registryRowId: "sup-foundation-primary-fulfillment",
    supportedCapabilities: ["catalog-sync", "fulfillment-handoff"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-storefront",
    name: "Foundation Storefront Plugin Slot",
    category: "storefront_plugins",
    pluginKind: "commerce_storefront",
    registryId: "REG-STOREFRONT",
    registryRowId: "sto-foundation-managed-storefront",
    supportedCapabilities: ["deploy", "publish-route"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-payment",
    name: "Foundation Payment Plugin Slot",
    category: "payment_plugins",
    pluginKind: "commerce_payment",
    registryId: "REG-PAYMENT",
    registryRowId: "pay-foundation-psp-primary",
    supportedCapabilities: ["authorize", "capture"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-logistics",
    name: "Foundation Logistics Plugin Slot",
    category: "logistics_plugins",
    pluginKind: "commerce_logistics",
    registryId: "REG-LOGISTICS",
    registryRowId: "log-foundation-carrier-primary",
    supportedCapabilities: ["tracking", "status-normalize"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-analytics",
    name: "Foundation Analytics Plugin Slot",
    category: "analytics_plugins",
    pluginKind: "commerce_analytics",
    registryId: "REG-COMMERCE-POLICY",
    registryRowId: "pol-foundation-commerce-default",
    supportedCapabilities: ["collect", "publish"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-workflow",
    name: "Foundation Commerce Workflow Plugin Slot",
    category: "commerce_workflow_plugins",
    pluginKind: "commerce_workflow",
    registryId: "REG-COMMERCE-POLICY",
    registryRowId: "pol-foundation-commerce-default",
    supportedCapabilities: ["coordinate", "synchronise"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-validation",
    name: "Foundation Commerce Validation Plugin Slot",
    category: "commerce_validation_plugins",
    pluginKind: "commerce_validation",
    registryId: "REG-COMMERCE-POLICY",
    registryRowId: "pol-foundation-commerce-default",
    supportedCapabilities: ["validate", "policy-check"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-monitoring",
    name: "Foundation Commerce Monitoring Plugin Slot",
    category: "commerce_monitoring_plugins",
    pluginKind: "commerce_monitoring",
    registryId: "REG-COMMERCE-POLICY",
    registryRowId: "pol-foundation-commerce-default",
    supportedCapabilities: ["monitor", "health-probe"],
  }),
  createSlot({
    id: "cplugin-slot-foundation-future",
    name: "Foundation Future Commerce Plugin Slot",
    category: "future_commerce_plugins",
    pluginKind: "commerce_future",
    registryId: "REG-COMMERCE-POLICY",
    registryRowId: "pol-foundation-commerce-default",
    supportedCapabilities: ["discover", "extend"],
  }),
];
