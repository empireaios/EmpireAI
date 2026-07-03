/**
 * EA-003 — Registry plugin manifest placeholder (future Provider/Marketplace/Engine plugins).
 */

import type { RegistryId, RegistryTier } from "./registry-ids.js";

export type RegistryPluginKind =
  | "provider"
  | "marketplace"
  | "supplier"
  | "engine"
  | "workflow"
  | "policy_pack"
  | "automation_trigger"
  | "automation_policy"
  | "automation_scheduler"
  | "automation_executor"
  | "automation_recovery"
  | "automation_notification"
  | "automation_monitor"
  | "commerce_marketplace"
  | "commerce_supplier"
  | "commerce_storefront"
  | "commerce_payment"
  | "commerce_logistics"
  | "commerce_analytics"
  | "commerce_orchestration"
  | "commerce_workflow"
  | "commerce_validation"
  | "commerce_monitoring"
  | "commerce_future"
  | "commerce_provider"
  | "commerce_brand"
  | "commerce_category"
  | "commerce_product_source";

export type RegistryPluginManifest = {
  pluginId: string;
  kind: RegistryPluginKind;
  targetRegistryId: RegistryId;
  tier: RegistryTier;
  version: string;
  description: string;
  /** Row payloads or extension hooks — applied in future EA missions. */
  extensions: Record<string, unknown>;
  registeredAt?: string;
};

export type RegistryPluginRegistrationResult = {
  accepted: boolean;
  pluginId: string;
  message: string;
};
