import { z } from "zod";

import { CREDENTIAL_TYPES } from "./reality-integration.js";

/** REAL-004 — Credential governance model (extends vault, does not duplicate). */
export const CREDENTIAL_GOVERNANCE_EVENTS = [
  "stored",
  "rotated",
  "verified",
  "expired",
  "revoked",
  "scope_changed",
  "audit_check",
] as const;

export type CredentialGovernanceEvent = (typeof CREDENTIAL_GOVERNANCE_EVENTS)[number];

export const credentialGovernanceRecordSchema = z.object({
  eventId: z.string().min(1),
  credentialsRef: z.string().min(1),
  workspaceId: z.string().min(1),
  providerId: z.string().min(1),
  event: z.enum(CREDENTIAL_GOVERNANCE_EVENTS),
  actor: z.string(),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  verified: z.boolean(),
  recordedAt: z.string().datetime({ offset: true }),
});

export const credentialGovernanceSummarySchema = z.object({
  workspaceId: z.string().min(1),
  totalCredentials: z.number().int().min(0),
  activeCredentials: z.number().int().min(0),
  expiringWithin7Days: z.number().int().min(0),
  expiredCredentials: z.number().int().min(0),
  revokedCredentials: z.number().int().min(0),
  verifiedCredentials: z.number().int().min(0),
  pendingVerification: z.number().int().min(0),
  rotationRecommended: z.number().int().min(0),
  records: z.array(credentialGovernanceRecordSchema),
  computedAt: z.string().datetime({ offset: true }),
});

export const credentialVerificationResultSchema = z.object({
  credentialsRef: z.string(),
  providerId: z.string(),
  credentialType: z.enum(CREDENTIAL_TYPES),
  verified: z.boolean(),
  expired: z.boolean(),
  scopesValid: z.boolean(),
  rotationDue: z.boolean(),
  reason: z.string(),
  verifiedAt: z.string().datetime({ offset: true }),
});

export type CredentialGovernanceRecord = z.infer<typeof credentialGovernanceRecordSchema>;
export type CredentialGovernanceSummary = z.infer<typeof credentialGovernanceSummarySchema>;
export type CredentialVerificationResult = z.infer<typeof credentialVerificationResultSchema>;
