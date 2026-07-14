/**
 * P8-03 — Canonical marketplace connector model.
 * Extends G2-02 without competing integration systems.
 */

import { z } from "zod";
import {
  MARKETPLACE_AUTHENTICATION_METHODS,
  MARKETPLACE_FEATURE_FLAGS,
  marketplaceRateLimitSchema,
} from "./marketplace-integration-types.js";

export const MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION = "p8-03-v1" as const;

export const MARKETPLACE_CONNECTOR_IDS = [
  "amazon",
  "shopify",
  "tiktok-shop",
  "meta-commerce",
  "woocommerce",
  "cj-dropshipping",
  "aliexpress",
  "temu",
  "shopee",
  "lazada",
  "ebay",
  "etsy",
] as const;

export type MarketplaceConnectorId = (typeof MARKETPLACE_CONNECTOR_IDS)[number];

export const MARKETPLACE_CONNECTOR_CAPABILITIES = [
  "authentication",
  "catalogue_import",
  "product_publishing",
  "inventory_synchronization",
  "order_synchronization",
  "shipment_tracking",
  "customer_synchronization",
  "analytics",
  "marketing_integration",
  "webhook_processing",
] as const;

export type MarketplaceConnectorCapability = (typeof MARKETPLACE_CONNECTOR_CAPABILITIES)[number];

export const MARKETPLACE_CONNECTOR_STATUSES = [
  "architecture_ready",
  "credentials_pending",
  "connected",
  "syncing",
  "degraded",
  "disconnected",
  "blocked",
] as const;

export type MarketplaceConnectorStatus = (typeof MARKETPLACE_CONNECTOR_STATUSES)[number];

export const MARKETPLACE_FAILURE_KINDS = [
  "authentication_failure",
  "api_failure",
  "rate_limit",
  "network_failure",
  "provider_failure",
  "synchronization_failure",
] as const;

export type MarketplaceFailureKind = (typeof MARKETPLACE_FAILURE_KINDS)[number];

export const marketplaceConnectorDefinitionSchema = z.object({
  connectorId: z.enum(MARKETPLACE_CONNECTOR_IDS),
  displayName: z.string().min(1),
  purpose: z.string().min(1),
  version: z.string().min(1),
  authenticationMethod: z.enum(MARKETPLACE_AUTHENTICATION_METHODS),
  supportedCapabilities: z.array(z.enum(MARKETPLACE_CONNECTOR_CAPABILITIES)).min(1),
  supportedFeatures: z.array(z.enum(MARKETPLACE_FEATURE_FLAGS)).min(1),
  rateLimits: marketplaceRateLimitSchema,
  failureBehaviour: z.string().min(1),
  recoveryBehaviour: z.string().min(1),
  dependencies: z.array(z.string()).min(1),
  healthCheckRef: z.string().min(1),
  monitoringRef: z.string().min(1),
  registryRowRef: z.string().optional(),
  g2AdapterRef: z.string().optional(),
  replaceable: z.literal(true),
});

export type MarketplaceConnectorDefinition = z.infer<typeof marketplaceConnectorDefinitionSchema>;

export const MARKETPLACE_INTEGRATION_PIPELINE = [
  "business_created",
  "marketplace_selected",
  "authentication",
  "store_connection",
  "catalogue_synchronization",
  "product_publishing",
  "inventory_synchronization",
  "order_synchronization",
  "fulfilment_synchronization",
  "analytics_synchronization",
  "continuous_monitoring",
] as const;

export type MarketplaceIntegrationPipelinePhase = (typeof MARKETPLACE_INTEGRATION_PIPELINE)[number];

export const MARKETPLACE_SYNC_DOMAINS = [
  "products",
  "inventory",
  "orders",
  "customers",
  "shipments",
  "pricing",
  "status",
  "analytics",
  "errors",
] as const;

export type MarketplaceSyncDomain = (typeof MARKETPLACE_SYNC_DOMAINS)[number];

export type MarketplaceConnectorRuntimeSnapshot = {
  connectorId: MarketplaceConnectorId;
  displayName: string;
  status: MarketplaceConnectorStatus;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  syncStatus: "idle" | "syncing" | "degraded" | "failed";
  healthStatus: "healthy" | "degraded" | "unhealthy" | "unknown";
  pipelinePhase: MarketplaceIntegrationPipelinePhase;
  activeSyncDomains: MarketplaceSyncDomain[];
  productCount: number;
  orderCount: number;
  inventoryLevel: number | null;
  currentFailures: MarketplaceFailureKind[];
  recoveryStatus: "none" | "in_progress" | "completed" | "blocked";
  lastSyncAt: string | null;
  performanceScore: number;
};

export type MarketplaceFailureRecoveryMapping = {
  failureKind: MarketplaceFailureKind;
  detectionSignal: string;
  recoveryFrameworkRef: string;
  recoveryStrategy: string;
  supervisorRef: string;
  guardianRef: string;
};
