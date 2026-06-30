import { z } from "zod";

export const LIVE_COMMERCE_SYNC_TYPES = [
  "catalog",
  "inventory",
  "pricing",
  "orders",
] as const;

export type LiveCommerceSyncType = (typeof LIVE_COMMERCE_SYNC_TYPES)[number];

export const liveCommerceOAuthStateSchema = z.object({
  stateId: z.string(),
  workspaceId: z.string(),
  providerId: z.string(),
  redirectUri: z.string(),
  scopes: z.array(z.string()),
  status: z.enum(["pending", "completed", "expired", "failed"]),
  createdAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).nullable(),
});

export const liveCommerceSyncJobSchema = z.object({
  jobId: z.string(),
  workspaceId: z.string(),
  providerId: z.string(),
  syncType: z.enum(LIVE_COMMERCE_SYNC_TYPES),
  status: z.enum(["queued", "running", "completed", "failed", "recovered"]),
  itemsProcessed: z.number().int(),
  itemsFailed: z.number().int(),
  errorMessage: z.string().nullable(),
  mode: z.enum(["sandbox", "production"]),
  startedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).nullable(),
});

export const liveCommerceWebhookEventSchema = z.object({
  eventId: z.string(),
  workspaceId: z.string(),
  providerId: z.string(),
  topic: z.string(),
  payloadHash: z.string(),
  status: z.enum(["received", "processed", "failed", "dead_letter"]),
  signatureValid: z.boolean(),
  processedAt: z.string().datetime({ offset: true }).nullable(),
  receivedAt: z.string().datetime({ offset: true }),
});

export const liveCommerceAuditEntrySchema = z.object({
  auditId: z.string(),
  workspaceId: z.string(),
  providerId: z.string(),
  action: z.string(),
  actor: z.string(),
  outcome: z.enum(["success", "failure", "blocked"]),
  metadata: z.record(z.unknown()),
  recordedAt: z.string().datetime({ offset: true }),
});

export const liveCommerceSecurityReviewSchema = z.object({
  reviewId: z.string(),
  workspaceId: z.string(),
  providerId: z.string(),
  passed: z.boolean(),
  findings: z.array(
    z.object({
      severity: z.enum(["critical", "high", "medium", "low"]),
      code: z.string(),
      message: z.string(),
      remediated: z.boolean(),
    }),
  ),
  computedAt: z.string().datetime({ offset: true }),
});

export const liveCommerceIntegrationDashboardSchema = z.object({
  missionId: z.literal("REAL-002B"),
  moduleId: z.literal("reality-integration"),
  mode: z.enum(["disabled", "sandbox", "production"]),
  liveIntegrationEnabled: z.boolean(),
  marketplaceProviders: z.array(
    z.object({
      providerId: z.string(),
      authenticated: z.boolean(),
      validated: z.boolean(),
      syncHealth: z.enum(["HEALTHY", "WARNING", "FAILED", "DISABLED"]),
    }),
  ),
  supplierProviders: z.array(
    z.object({
      providerId: z.string(),
      authenticated: z.boolean(),
      validated: z.boolean(),
    }),
  ),
  syncSummary: z.object({
    catalog: z.number().int(),
    inventory: z.number().int(),
    pricing: z.number().int(),
    orders: z.number().int(),
    failed: z.number().int(),
  }),
  webhookSummary: z.object({
    received: z.number().int(),
    processed: z.number().int(),
    deadLetter: z.number().int(),
  }),
  securityReviewsPassed: z.number().int(),
  commercialReadiness: z.object({
    score: z.number().int(),
    goLiveEligible: z.boolean(),
    blockers: z.array(z.string()),
  }),
  computedAt: z.string().datetime({ offset: true }),
});

export type LiveCommerceOAuthState = z.infer<typeof liveCommerceOAuthStateSchema>;
export type LiveCommerceSyncJob = z.infer<typeof liveCommerceSyncJobSchema>;
export type LiveCommerceWebhookEvent = z.infer<typeof liveCommerceWebhookEventSchema>;
export type LiveCommerceAuditEntry = z.infer<typeof liveCommerceAuditEntrySchema>;
export type LiveCommerceSecurityReview = z.infer<typeof liveCommerceSecurityReviewSchema>;
export type LiveCommerceIntegrationDashboard = z.infer<
  typeof liveCommerceIntegrationDashboardSchema
>;

export const LIVE_COMMERCE_ARTIFACT_TYPES = [
  "constitution_update",
  "architecture_decision_record",
  "executive_learning",
  "executive_knowledge_base_update",
  "journey_update",
  "repository_policy",
  "commercial_strategy",
  "product_strategy",
  "improvement_vault_entry",
  "mission_specification",
] as const;
