/**
 * G8-02 — Authorization flow service.
 */

import { randomUUID, randomBytes } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  type AuthorizationFlowState,
  type AuthorizationRequest,
  type AuthorizationResult,
  type CredentialSubmission,
  type OAuthCallbackPreview,
  AUTHORIZATION_FRAMEWORK_VERSION,
} from "../contracts/authorization-framework-types.js";
import { recordAuthorizationFrameworkEklsObservation } from "../ekls/authorization-framework-ekls-integration.js";
import { validateAuthorizationFrameworkPillowGovernance } from "../governance/authorization-framework-pillow-governance.js";
import { resolveProviderAuthorizationRequirements } from "../registry/authorization-framework-resolver.js";
import {
  deriveGrantedPermissionsFromRequirements,
  deriveGrantedScopesFromRequirements,
  validateRequestedPermissions,
  validateRequestedScopes,
} from "./scope-permission-validator.js";
import {
  resolveFinalStateFromValidation,
  resolveNextStateAfterCallback,
  resolveNextStateAfterCredentials,
  resolveNextStateForOAuthStart,
  transitionAuthorizationState,
} from "./authorization-state-machine.js";

const requests = new Map<string, AuthorizationRequest>();
const results = new Map<string, AuthorizationResult>();
const credentialSubmissions = new Map<string, CredentialSubmission>();
const callbackPreviews = new Map<string, OAuthCallbackPreview>();

export function resetAuthorizationFlowStateForTests(): void {
  requests.clear();
  results.clear();
  credentialSubmissions.clear();
  callbackPreviews.clear();
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  providerId?: string;
  authorizationType?: string;
  requestedScopes?: string[];
  requestedPermissions?: string[];
  operation: "start" | "callback" | "submit" | "validate" | "cancel" | "status" | "requirements";
}) {
  const governance = validateAuthorizationFrameworkPillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
}

function updateRequest(authorizationId: string, patch: Partial<AuthorizationRequest>): AuthorizationRequest {
  const existing = requests.get(authorizationId);
  if (!existing) throw new Error("Authorization request not found");
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  requests.set(authorizationId, updated);
  return updated;
}

export function startAuthorization(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  providerId: string;
  environment?: "sandbox" | "production";
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}) {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const requirements = resolveProviderAuthorizationRequirements(input.providerId, context);
  if (!requirements) {
    throw new Error(`Provider not found in registry: ${input.providerId}`);
  }

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    authorizationType: requirements.authorizationType,
    requestedScopes: requirements.requestedScopes,
    requestedPermissions: requirements.requestedPermissions,
    operation: "start",
  });

  const authorizationId = randomUUID();
  const correlationId = randomUUID();
  const state = randomBytes(16).toString("hex");
  const nonce = randomBytes(12).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const connectionId = `connection:${input.providerId}:${input.workspaceId}`;

  const nextFlowState = resolveNextStateForOAuthStart(requirements.authorizationType);
  const initiatedTransition = transitionAuthorizationState("not_started", "initiated");
  if (!initiatedTransition.ok) throw new Error(initiatedTransition.reason);
  const flowTransition = transitionAuthorizationState("initiated", nextFlowState);
  if (!flowTransition.ok) throw new Error(flowTransition.reason);

  const request: AuthorizationRequest = {
    authorizationId,
    providerId: input.providerId,
    connectionId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    environment: input.environment ?? "production",
    authorizationType: requirements.authorizationType,
    requestedScopes: requirements.requestedScopes,
    requestedPermissions: requirements.requestedPermissions,
    redirectUri: `https://empireai.local/oauth/redirect/${input.providerId}`,
    callbackUri: `https://empireai.local/oauth/callback/${input.providerId}`,
    state,
    nonce,
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    correlationId,
    governanceState: "pillow-governed",
    flowState: nextFlowState,
  };

  requests.set(authorizationId, request);

  recordAuthorizationFrameworkEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    authorizationId,
    providerId: input.providerId,
    kind: "authorization_started",
    summary: `Authorization started for ${requirements.displayName} (${requirements.authorizationType})`,
    pillowGovernance: true,
  });

  const oauthInitiation =
    nextFlowState === "awaiting_redirect"
      ? {
          redirectUrl: `https://provider-placeholder.local/oauth/authorize?provider=${input.providerId}&state=${state}`,
          state,
          nonce,
          authorizationType: requirements.authorizationType,
        }
      : undefined;

  return {
    frameworkVersion: AUTHORIZATION_FRAMEWORK_VERSION,
    request,
    oauthInitiation,
    awaitingCredentials: nextFlowState === "awaiting_credentials",
  };
}

export function previewAuthorizationCallback(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  authorizationId: string;
  callbackParams?: Record<string, string>;
  pillowGovernance: true;
}): OAuthCallbackPreview {
  const request = requests.get(input.authorizationId);
  if (!request) throw new Error("Authorization request not found");

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: request.providerId,
    operation: "callback",
  });

  const safeParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.callbackParams ?? { code: "placeholder_code", state: request.state })) {
    safeParams[key] = key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") ? "[REDACTED]" : value;
  }

  const preview: OAuthCallbackPreview = {
    authorizationId: input.authorizationId,
    state: request.state,
    callbackReceived: safeParams.state === request.state,
    callbackParams: safeParams,
    secretsRedacted: true,
  };

  callbackPreviews.set(input.authorizationId, preview);

  if (preview.callbackReceived) {
    const next = resolveNextStateAfterCallback();
    const transition = transitionAuthorizationState(request.flowState, next);
    if (transition.ok) {
      updateRequest(input.authorizationId, { flowState: transition.state });
    }
    recordAuthorizationFrameworkEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      authorizationId: input.authorizationId,
      providerId: request.providerId,
      kind: "authorization_callback_received",
      summary: "OAuth callback preview processed — secrets redacted",
      pillowGovernance: true,
    });
  }

  return preview;
}

export function submitAuthorizationCredentials(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  authorizationId: string;
  credentialKind: CredentialSubmission["credentialKind"];
  pillowGovernance: true;
}): CredentialSubmission {
  const request = requests.get(input.authorizationId);
  if (!request) throw new Error("Authorization request not found");

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: request.providerId,
    operation: "submit",
  });

  const submission: CredentialSubmission = {
    submissionId: randomUUID(),
    authorizationId: input.authorizationId,
    credentialKind: input.credentialKind,
    credentialReference: `vault:deferred:${input.authorizationId}`,
    submittedAt: new Date().toISOString(),
    redactedPreview: "[REDACTED]",
  };

  credentialSubmissions.set(submission.submissionId, submission);

  const next = resolveNextStateAfterCredentials();
  const transition = transitionAuthorizationState(request.flowState, next);
  if (transition.ok) {
    updateRequest(input.authorizationId, { flowState: transition.state });
  }

  recordAuthorizationFrameworkEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    authorizationId: input.authorizationId,
    providerId: request.providerId,
    kind: "credentials_submitted",
    summary: "Credentials submitted — vault reference only, no secrets stored",
    pillowGovernance: true,
  });

  return submission;
}

export function validateAuthorizationResult(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  authorizationId: string;
  partial?: boolean;
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}): AuthorizationResult {
  const request = requests.get(input.authorizationId);
  if (!request) throw new Error("Authorization request not found");

  const context = input.context ?? { workspaceId: input.workspaceId };
  const requirements = resolveProviderAuthorizationRequirements(request.providerId, context);
  if (!requirements) throw new Error("Provider requirements not found");

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: request.providerId,
    operation: "validate",
  });

  const grantedScopes = deriveGrantedScopesFromRequirements(requirements, input.partial);
  const grantedPermissions = deriveGrantedPermissionsFromRequirements(requirements, input.partial);
  const scopeValidation = validateRequestedScopes({
    requestedScopes: request.requestedScopes,
    grantedScopes,
  });
  const permissionValidation = validateRequestedPermissions({
    requestedPermissions: request.requestedPermissions,
    grantedPermissions,
  });

  const finalState = resolveFinalStateFromValidation({
    scopesValid: scopeValidation.valid,
    permissionsValid: permissionValidation.valid,
    partial: input.partial,
  });

  const validatingTransition = transitionAuthorizationState(request.flowState, "validating");
  const currentForFinal = validatingTransition.ok ? "validating" : request.flowState;
  const finalTransition = transitionAuthorizationState(currentForFinal, finalState);
  if (finalTransition.ok) {
    updateRequest(input.authorizationId, { flowState: finalTransition.state });
  }

  const result: AuthorizationResult = {
    authorizationId: input.authorizationId,
    providerId: request.providerId,
    connectionId: request.connectionId,
    status: finalTransition.ok ? finalTransition.state : finalState,
    grantedScopes: scopeValidation.grantedScopes,
    missingScopes: scopeValidation.missingScopes,
    grantedPermissions: permissionValidation.grantedPermissions,
    missingPermissions: permissionValidation.missingPermissions,
    expiresAt: request.expiresAt,
    refreshRequired: requirements.supportsRefreshToken,
    healthStatus: finalState === "authorized" ? "healthy" : "degraded",
    readinessStatus: finalState === "authorized" ? "ready" : "missing_permissions",
    evidence: [
      {
        evidenceId: randomUUID(),
        kind: "registry_validation",
        summary: "Authorization validated from registry requirements",
        ref: `requirement:${request.providerId}`,
      },
    ],
    correlationId: request.correlationId,
  };

  results.set(input.authorizationId, result);

  recordAuthorizationFrameworkEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    authorizationId: input.authorizationId,
    providerId: request.providerId,
    kind: finalState === "failed" ? "authorization_failed" : "authorization_validated",
    summary: `Authorization ${finalState} for ${request.providerId}`,
    pillowGovernance: true,
  });

  return result;
}

export function getAuthorizationStatus(authorizationId: string): {
  request?: AuthorizationRequest;
  result?: AuthorizationResult;
  credentialSubmission?: CredentialSubmission;
  callbackPreview?: OAuthCallbackPreview;
} {
  const submission = Array.from(credentialSubmissions.values()).find(
    (s) => s.authorizationId === authorizationId,
  );
  return {
    request: requests.get(authorizationId),
    result: results.get(authorizationId),
    credentialSubmission: submission,
    callbackPreview: callbackPreviews.get(authorizationId),
  };
}

export function cancelAuthorization(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  authorizationId: string;
  pillowGovernance: true;
}): AuthorizationRequest {
  const request = requests.get(input.authorizationId);
  if (!request) throw new Error("Authorization request not found");

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: request.providerId,
    operation: "cancel",
  });

  const transition = transitionAuthorizationState(request.flowState, "cancelled");
  if (!transition.ok) throw new Error(transition.reason);

  const updated = updateRequest(input.authorizationId, { flowState: "cancelled" });

  recordAuthorizationFrameworkEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    authorizationId: input.authorizationId,
    providerId: request.providerId,
    kind: "authorization_cancelled",
    summary: "Authorization cancelled",
    pillowGovernance: true,
  });

  return updated;
}

export function getAuthorizationRequirements(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveProviderAuthorizationRequirements(providerId, context);
}

export function listAuthorizationRequests(): AuthorizationRequest[] {
  return Array.from(requests.values());
}
