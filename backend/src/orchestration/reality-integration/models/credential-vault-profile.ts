import { z } from "zod";

import { CREDENTIAL_TYPES } from "./reality-integration.js";

/** REAL-002A — Credential vault profile (extends governance; no duplicate store). */
export const credentialVaultProfileSchema = z.object({
  credentialsRef: z.string().min(1),
  providerId: z.string().min(1),
  account: z.string().nullable(),
  credentialType: z.enum(CREDENTIAL_TYPES),
  scopes: z.array(z.string()),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  refreshStatus: z.enum(["NOT_REQUIRED", "VALID", "DUE", "FAILED"]),
  verifiedAt: z.string().datetime({ offset: true }).nullable(),
  owner: z.string().nullable(),
  approvalPolicy: z.string(),
  revoked: z.boolean(),
});

export type CredentialVaultProfile = z.infer<typeof credentialVaultProfileSchema>;
