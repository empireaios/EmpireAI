/**
 * G8-00 — Identity & Authorization Platform registry types.
 */

import { z } from "zod";
import { PRODUCTION_WORKSPACE_REGISTRY_VERSION } from "./production-workspace-registry-types.js";

export const IDENTITY_AUTHORIZATION_REGISTRY_VERSION = "g8-00-v1" as const;

export const FOUNDATION_PROVIDER_IDS = [
  "amazon",
  "stripe",
  "meta",
  "google",
  "shopify",
  "tiktok",
  "openai",
  "anthropic",
  "github",
  "vercel",
  "cloudflare",
  "cjdropshipping",
] as const;

export type FoundationProviderId = (typeof FOUNDATION_PROVIDER_IDS)[number];

export const CONNECTION_STATES = [
  "configured",
  "authorized",
  "disconnected",
  "pending",
  "expired",
  "unknown",
] as const;

export type ConnectionState = (typeof CONNECTION_STATES)[number];

export type IdentityAuthorizationRegistryRowBase = {
  id: string;
  name: string;
  description: string;
  status: "VALIDATED" | "DRAFT" | "PUBLISHED" | "DEPRECATED" | "RETIRED";
  version: string;
  owner: string;
  dependencies: string[];
  capabilities: string[];
  configuration: Record<string, unknown>;
  supportedRegions: string[];
  supportedCountries: string[];
  validation: { schemaVersion: typeof IDENTITY_AUTHORIZATION_REGISTRY_VERSION };
  pluginSupport: { allowPluginRegistration: boolean };
  workspaceScope: { scope: "global" | "workspace" };
  futureCompatibility: { notes: string };
};

export const authorizationProviderConfigurationSchema = z.object({
  schemaVersion: z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  providerKind: z.string().min(1),
  configurable: z.literal(true),
  oauthCapable: z.boolean().default(false),
  credentialCapable: z.boolean().default(false),
  authorizationScopes: z.array(z.string()).default([]),
  registryRef: z.string().optional(),
});

export const credentialTypeConfigurationSchema = z.object({
  schemaVersion: z.union([z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION), z.literal("g8-03-v1")]),
  credentialTypeId: z.string().min(1),
  credentialTypeName: z.string().min(1),
  providerId: z.string().min(1),
  configurable: z.literal(true),
  storageDeferred: z.boolean().default(true),
  credentialKind: z.enum([
    "api_key",
    "secret_key",
    "publishable_key",
    "refresh_token",
    "access_token",
    "oauth_client_id",
    "oauth_client_secret",
    "lwa_client_id",
    "lwa_client_secret",
    "iam_role",
    "webhook_secret",
    "private_key",
    "public_key",
    "future_credential_type",
  ]).optional(),
  vaultBackend: z.string().optional(),
  vaultPathTemplate: z.string().optional(),
  rotationPolicyRef: z.string().optional(),
  expiryPolicyRef: z.string().optional(),
  healthPolicyRef: z.string().optional(),
});

export const connectionTypeConfigurationSchema = z.object({
  schemaVersion: z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION),
  connectionTypeId: z.string().min(1),
  connectionTypeName: z.string().min(1),
  providerId: z.string().min(1),
  configurable: z.literal(true),
  defaultState: z.enum(CONNECTION_STATES).default("configured"),
});

export const connectionPolicyConfigurationSchema = z.object({
  schemaVersion: z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION),
  policyId: z.string().min(1),
  policyName: z.string().min(1),
  providerId: z.string().min(1),
  configurable: z.literal(true),
  authorizationRuleRefs: z.array(z.string()).default([]),
  reconnectRuleRefs: z.array(z.string()).default([]),
});

export const identityReportConfigurationSchema = z.object({
  schemaVersion: z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION),
  reportId: z.string().min(1),
  reportName: z.string().min(1),
  reportKind: z.enum(["executive_summary", "provider_status", "connection_status", "readiness"]),
  configurable: z.literal(true),
});

export const identityNotificationConfigurationSchema = z.object({
  schemaVersion: z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION),
  notificationId: z.string().min(1),
  notificationName: z.string().min(1),
  eventKindRefs: z.array(z.string()).default([]),
  configurable: z.literal(true),
});
