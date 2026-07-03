/**
 * G8-00 — Identity & Authorization Platform contract types.
 */

import { z } from "zod";
import type {
  ConnectionState,
  FoundationProviderId,
} from "../../../registry/types/identity-authorization-registry-types.js";
import {
  CONNECTION_STATES,
  FOUNDATION_PROVIDER_IDS,
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
} from "../../../registry/types/identity-authorization-registry-types.js";

export const IDENTITY_AUTHORIZATION_PLATFORM_VERSION = "g8-00-v1" as const;

export { FOUNDATION_PROVIDER_IDS, CONNECTION_STATES, IDENTITY_AUTHORIZATION_REGISTRY_VERSION };
export type { FoundationProviderId, ConnectionState };

export const IDENTITY_LEARNING_RECORD_KINDS = [
  "connection",
  "disconnection",
  "authorization",
  "permission_change",
  "provider_failure",
  "expiry",
  "manual_override",
  "executive_action",
] as const;

export type IdentityLearningRecordKind = (typeof IDENTITY_LEARNING_RECORD_KINDS)[number];

export type ProviderConnectionState = {
  providerId: FoundationProviderId;
  providerName: string;
  connectionState: ConnectionState;
  configurable: true;
  ruleReference: string;
};

export type IdentityPlatformSummary = {
  frameworkVersion: typeof IDENTITY_AUTHORIZATION_PLATFORM_VERSION;
  providerCount: number;
  connectionCount: number;
  authorizedCount: number;
  disconnectedCount: number;
  readinessPercentage: number;
  executiveSummary: string;
  workspaceId: string;
  generatedAt: string;
};

export type IdentityPlatformOverview = {
  frameworkVersion: typeof IDENTITY_AUTHORIZATION_PLATFORM_VERSION;
  initialized: boolean;
  registryCount: number;
  providerCount: number;
  programmeStatus: string;
  workspaceId: string;
  generatedAt: string;
};

export type IdentityHealthSummary = {
  healthy: boolean;
  score: number;
  providerCount: number;
  configuredCount: number;
  issues: string[];
  computedAt: string;
};

export const identityAuthorizationPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "identity_provider",
    "oauth_provider",
    "credential_provider",
    "readiness_provider",
    "health_provider",
    "notification_provider",
  ]),
  pillowGovernance: z.literal(true),
});

export type IdentityAuthorizationPluginManifest = z.infer<typeof identityAuthorizationPluginManifestSchema>;

export function redactIdentityAuthorizationSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential") ||
      lower.includes("oauth")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactIdentityAuthorizationSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactIdentityAuthorizationSecrets(entry),
      ]),
    );
  }
  return value;
}
