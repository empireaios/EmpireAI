/**
 * G8-02 — OAuth & API Authorization Framework types.
 */

import { z } from "zod";

export const AUTHORIZATION_FRAMEWORK_VERSION = "g8-02-v1" as const;

export const AUTHORIZATION_TYPES = [
  "oauth2",
  "oauth1",
  "api_key",
  "secret_key",
  "refresh_token",
  "lwa",
  "iam_role",
  "webhook_secret",
  "manual_upload",
  "future_authorization_type",
] as const;

export type AuthorizationType = (typeof AUTHORIZATION_TYPES)[number];

export const AUTHORIZATION_FLOW_STATES = [
  "not_started",
  "initiated",
  "awaiting_redirect",
  "awaiting_callback",
  "awaiting_credentials",
  "validating",
  "authorized",
  "partially_authorized",
  "failed",
  "expired",
  "revoked",
  "cancelled",
  "requires_review",
  "unknown",
] as const;

export type AuthorizationFlowState = (typeof AUTHORIZATION_FLOW_STATES)[number];

export const AUTHORIZATION_FRAMEWORK_EKLS_KINDS = [
  "authorization_started",
  "authorization_callback_received",
  "credentials_submitted",
  "authorization_validated",
  "authorization_failed",
  "authorization_cancelled",
  "authorization_expired",
  "authorization_revoked",
] as const;

export type AuthorizationFrameworkEklsKind = (typeof AUTHORIZATION_FRAMEWORK_EKLS_KINDS)[number];

export type AuthorizationRequest = {
  authorizationId: string;
  providerId: string;
  connectionId: string;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  authorizationType: AuthorizationType;
  requestedScopes: string[];
  requestedPermissions: string[];
  redirectUri: string;
  callbackUri: string;
  state: string;
  nonce: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
  flowState: AuthorizationFlowState;
};

export type AuthorizationResult = {
  authorizationId: string;
  providerId: string;
  connectionId: string;
  status: AuthorizationFlowState;
  grantedScopes: string[];
  missingScopes: string[];
  grantedPermissions: string[];
  missingPermissions: string[];
  expiresAt: string | null;
  refreshRequired: boolean;
  healthStatus: string;
  readinessStatus: string;
  evidence: Array<{ evidenceId: string; kind: string; summary: string; ref: string }>;
  correlationId: string;
};

export type CredentialSubmission = {
  submissionId: string;
  authorizationId: string;
  credentialKind: "api_key" | "secret_key" | "webhook_secret" | "manual_upload";
  credentialReference: string;
  submittedAt: string;
  redactedPreview: "[REDACTED]";
};

export type OAuthCallbackPreview = {
  authorizationId: string;
  state: string;
  callbackReceived: boolean;
  callbackParams: Record<string, string>;
  secretsRedacted: true;
};

export const VALID_AUTHORIZATION_TRANSITIONS: Record<AuthorizationFlowState, AuthorizationFlowState[]> = {
  not_started: ["initiated", "cancelled"],
  initiated: ["awaiting_redirect", "awaiting_credentials", "validating", "failed", "cancelled"],
  awaiting_redirect: ["awaiting_callback", "failed", "cancelled", "expired"],
  awaiting_callback: ["validating", "failed", "cancelled", "expired"],
  awaiting_credentials: ["validating", "failed", "cancelled", "expired"],
  validating: ["authorized", "partially_authorized", "failed", "requires_review"],
  authorized: ["revoked", "expired"],
  partially_authorized: ["validating", "revoked", "requires_review"],
  failed: ["initiated", "cancelled"],
  expired: ["initiated"],
  revoked: ["initiated"],
  cancelled: ["initiated"],
  requires_review: ["validating", "authorized", "cancelled"],
  unknown: ["initiated", "failed"],
};

export const authorizationFrameworkPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "authorization_provider",
    "oauth_strategy",
    "credential_validator",
    "scope_mapper",
    "permission_mapper",
    "callback_handler",
  ]),
  pillowGovernance: z.literal(true),
});

export type AuthorizationFrameworkPluginManifest = z.infer<typeof authorizationFrameworkPluginManifestSchema>;

export function isValidAuthorizationTransition(
  from: AuthorizationFlowState,
  to: AuthorizationFlowState,
): boolean {
  return VALID_AUTHORIZATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function redactAuthorizationSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("sk-") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential") ||
      lower.includes("oauth") ||
      lower.includes("bearer") ||
      lower.includes("refresh")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactAuthorizationSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactAuthorizationSecrets(entry),
      ]),
    );
  }
  return value;
}
