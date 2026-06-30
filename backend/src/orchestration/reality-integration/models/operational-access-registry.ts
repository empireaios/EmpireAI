import { z } from "zod";

import { LIVE_COMMERCE_LIFECYCLE_STATES, PROVIDER_OPERATIONAL_CAPABILITIES } from "./live-commerce-foundation.js";
import { AUTHENTICATION_METHODS } from "./reality-integration.js";

/** EAR-001 — Operational Access Registry record (authoritative external platform access). */
export const operationalAccessRecordSchema = z.object({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  platform: z.string().min(1),
  providerId: z.string().min(1),
  authentication: z.enum(AUTHENTICATION_METHODS),
  connectionStatus: z.enum(LIVE_COMMERCE_LIFECYCLE_STATES),
  verificationStatus: z.enum(["UNVERIFIED", "VERIFIED", "FAILED"]),
  operationalStatus: z.enum(["BLOCKED", "READY", "ACTIVE", "DEGRADED"]),
  automationStatus: z.enum(["DISABLED", "PENDING_APPROVAL", "ENABLED", "BLOCKED"]),
  approvalRequired: z.boolean(),
  health: z.enum(["HEALTHY", "WARNING", "FAILED", "DISABLED"]),
  lastSync: z.string().datetime({ offset: true }).nullable(),
  supportedCapabilities: z.array(z.enum(PROVIDER_OPERATIONAL_CAPABILITIES)),
  currentRestrictions: z.array(z.string()),
  credentialsRef: z.string().nullable(),
  owner: z.string().nullable(),
  updatedAt: z.string().datetime({ offset: true }),
});

export const operationalAccessRegistrySchema = z.object({
  moduleId: z.literal("operational-access-registry"),
  missionId: z.literal("EAR-001"),
  workspaceId: z.string().min(1),
  records: z.array(operationalAccessRecordSchema),
  summary: z.object({
    totalPlatforms: z.number().int(),
    active: z.number().int(),
    blocked: z.number().int(),
    awaitingApproval: z.number().int(),
    degraded: z.number().int(),
  }),
  computedAt: z.string().datetime({ offset: true }),
});

export type OperationalAccessRecord = z.infer<typeof operationalAccessRecordSchema>;
export type OperationalAccessRegistry = z.infer<typeof operationalAccessRegistrySchema>;
