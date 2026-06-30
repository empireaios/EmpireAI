import { z } from "zod";

import type { ConnectionLifecycleState } from "./connection-lifecycle.js";

/** REAL-002A — Canonical live commerce provider lifecycle (provider-agnostic). */
export const LIVE_COMMERCE_LIFECYCLE_STATES = [
  "NOT_CONNECTED",
  "AUTHORIZATION_REQUIRED",
  "CONNECTED",
  "VERIFIED",
  "READY",
  "ACTIVE",
  "DEGRADED",
  "DISCONNECTED",
  "REVOKED",
] as const;

export type LiveCommerceLifecycleState = (typeof LIVE_COMMERCE_LIFECYCLE_STATES)[number];

/** First certified marketplace + future global providers. */
export const LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS = [
  "amazon-seller",
  "ebay",
  "shopee",
  "lazada",
  "walmart",
  "etsy",
  "tiktok-shop",
] as const;

export type LiveCommerceMarketplaceProviderId = (typeof LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS)[number];

/** REAL-002A — Standard operational capabilities every provider reports. */
export const PROVIDER_OPERATIONAL_CAPABILITIES = [
  "publish",
  "inventory",
  "orders",
  "pricing",
  "returns",
  "messaging",
  "analytics",
  "advertising",
  "settlement",
  "webhooks",
] as const;

export type ProviderOperationalCapability = (typeof PROVIDER_OPERATIONAL_CAPABILITIES)[number];

export const providerCapabilityStatusSchema = z.object({
  capability: z.enum(PROVIDER_OPERATIONAL_CAPABILITIES),
  supported: z.boolean(),
  verified: z.boolean(),
  missingPermissions: z.array(z.string()),
  health: z.enum(["HEALTHY", "WARNING", "FAILED", "DISABLED"]),
});

export const providerCapabilityVerificationSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  verificationState: z.enum(LIVE_COMMERCE_LIFECYCLE_STATES),
  capabilities: z.array(providerCapabilityStatusSchema),
  missingPermissions: z.array(z.string()),
  health: z.enum(["HEALTHY", "WARNING", "FAILED", "DISABLED"]),
  computedAt: z.string().datetime({ offset: true }),
});

export const runtimeActivationAssessmentSchema = z.object({
  providerId: z.string(),
  workspaceId: z.string(),
  lifecycle: z.enum(LIVE_COMMERCE_LIFECYCLE_STATES),
  activated: z.boolean(),
  blocked: z.boolean(),
  blockers: z.array(z.string()),
  requiresFounderApproval: z.boolean(),
  founderApproved: z.boolean(),
  runtimePluginEligible: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export const liveCommerceFoundationDashboardSchema = z.object({
  moduleId: z.literal("reality-integration"),
  missionId: z.literal("REAL-002A"),
  amazonFirst: z.boolean(),
  globalByDesign: z.boolean(),
  marketplaceProviders: z.array(z.string()),
  operationalAccessSummary: z.object({
    totalPlatforms: z.number().int(),
    connected: z.number().int(),
    verified: z.number().int(),
    active: z.number().int(),
    blocked: z.number().int(),
    awaitingApproval: z.number().int(),
  }),
  credentialHealth: z.object({
    total: z.number().int(),
    verified: z.number().int(),
    expiringSoon: z.number().int(),
    revoked: z.number().int(),
  }),
  activationReadiness: z.object({
    eligible: z.number().int(),
    blocked: z.number().int(),
  }),
  computedAt: z.string().datetime({ offset: true }),
});

export type ProviderCapabilityVerification = z.infer<typeof providerCapabilityVerificationSchema>;
export type RuntimeActivationAssessment = z.infer<typeof runtimeActivationAssessmentSchema>;
export type LiveCommerceFoundationDashboard = z.infer<typeof liveCommerceFoundationDashboardSchema>;

const LIFECYCLE_MAP: Record<ConnectionLifecycleState, LiveCommerceLifecycleState> = {
  DISCOVERED: "NOT_CONNECTED",
  CONFIGURED: "NOT_CONNECTED",
  CREDENTIALS_REQUIRED: "AUTHORIZATION_REQUIRED",
  AUTHORIZATION_REQUIRED: "AUTHORIZATION_REQUIRED",
  CONNECTED: "CONNECTED",
  VERIFIED: "VERIFIED",
  READY: "READY",
  ACTIVE: "ACTIVE",
  DEGRADED: "DEGRADED",
  DISCONNECTED: "DISCONNECTED",
  REVOKED: "REVOKED",
  ERROR: "DEGRADED",
};

export function mapToLiveCommerceLifecycle(
  lifecycle: ConnectionLifecycleState | null | undefined,
): LiveCommerceLifecycleState {
  if (!lifecycle) return "NOT_CONNECTED";
  return LIFECYCLE_MAP[lifecycle] ?? "NOT_CONNECTED";
}

export function isLiveCommerceOperationalState(state: LiveCommerceLifecycleState): boolean {
  return state === "VERIFIED" || state === "READY" || state === "ACTIVE";
}
