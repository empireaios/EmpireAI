import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTHORIZATION_FLOW_STATES,
  AUTHORIZATION_FRAMEWORK_EKLS_KINDS,
  AUTHORIZATION_FRAMEWORK_VERSION,
  AUTHORIZATION_TYPES,
  authorizationFrameworkTools,
  buildCockpitAuthorizationFlowView,
  cancelAuthorization,
  createAuthorizationFrameworkModuleContract,
  getAuthorizationRequirements,
  getAuthorizationStatus,
  isValidAuthorizationTransition,
  listAuthorizationFrameworkEklsKinds,
  listAuthorizationFrameworkPlugins,
  previewAuthorizationCallback,
  redactAuthorizationSecrets,
  registerAuthorizationFrameworkPlugin,
  resetAuthorizationFrameworkHarnessForTests,
  resolveProviderAuthorizationRequirements,
  searchAuthorizationFrameworkEklsObservations,
  startAuthorization,
  submitAuthorizationCredentials,
  validateAuthorizationFrameworkPillowGovernance,
  validateAuthorizationResult,
  validateRequestedPermissions,
  validateRequestedScopes,
} from "../../orchestration/identity-authorization-platform/authorization-framework/index.js";
import { resetConnectionRegistryHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  pillowGovernance: true as const,
};

function seedAuthorizationHarness() {
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
}

describe("G8-02 — OAuth & API Authorization Framework", () => {
  it("exposes authorization framework version and types", () => {
    assert.equal(AUTHORIZATION_FRAMEWORK_VERSION, "g8-02-v1");
    assert.equal(AUTHORIZATION_TYPES.length, 10);
    assert.equal(AUTHORIZATION_FLOW_STATES.length, 14);
    assert.equal(AUTHORIZATION_FRAMEWORK_EKLS_KINDS.length, 8);
  });

  it("registers authorization-framework Brain module contract", () => {
    const contract = createAuthorizationFrameworkModuleContract();
    assert.equal(contract.moduleId, "authorization-framework");
    assert.equal(contract.missionId, "G8-02");
    assert.equal(contract.programmeStatus, "oauth-api-authorization-framework-established");
    assert.ok(contract.integratesWith.includes("connection-registry"));
  });

  it("resolves provider authorization requirements from registry", () => {
    seedAuthorizationHarness();
    const amazon = resolveProviderAuthorizationRequirements("amazon", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(amazon);
    assert.equal(amazon!.authorizationType, "lwa");
    assert.ok(amazon!.requestedScopes.length >= 1);

    const openai = resolveProviderAuthorizationRequirements("openai", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(openai);
    assert.equal(openai!.authorizationType, "api_key");

    const meta = resolveProviderAuthorizationRequirements("meta", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(meta);
    assert.equal(meta!.authorizationType, "oauth2");
  });

  it("creates authorization request with full contract fields", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "google" });
    const req = started.request;
    assert.ok(req.authorizationId);
    assert.equal(req.providerId, "google");
    assert.ok(req.connectionId);
    assert.equal(req.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.equal(req.accountHolderId, "grand-king");
    assert.equal(req.authorizationType, "oauth2");
    assert.ok(req.requestedScopes.length >= 1);
    assert.ok(req.requestedPermissions.length >= 1);
    assert.ok(req.redirectUri);
    assert.ok(req.callbackUri);
    assert.ok(req.state);
    assert.ok(req.nonce);
    assert.ok(req.expiresAt);
    assert.ok(req.correlationId);
    assert.equal(req.flowState, "awaiting_redirect");
    assert.ok(started.oauthInitiation?.redirectUrl);
  });

  it("initiates OAuth flow for oauth2 providers", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "shopify" });
    assert.equal(started.request.flowState, "awaiting_redirect");
    assert.ok(started.oauthInitiation);
    assert.equal(started.awaitingCredentials, false);
  });

  it("initiates API credential flow for api_key providers", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "anthropic" });
    assert.equal(started.request.flowState, "awaiting_credentials");
    assert.equal(started.awaitingCredentials, true);
    assert.equal(started.oauthInitiation, undefined);
  });

  it("validates scopes and permissions", () => {
    seedAuthorizationHarness();
    const scopeResult = validateRequestedScopes({
      requestedScopes: ["scope:stripe:operate"],
      grantedScopes: ["scope:stripe:operate"],
    });
    assert.equal(scopeResult.valid, true);

    const permResult = validateRequestedPermissions({
      requestedPermissions: ["permission:stripe:read", "permission:stripe:write"],
      grantedPermissions: ["permission:stripe:read"],
    });
    assert.equal(permResult.valid, false);
    assert.ok(permResult.missingPermissions.includes("permission:stripe:write"));
  });

  it("validates authorization state transitions", () => {
    assert.equal(isValidAuthorizationTransition("not_started", "initiated"), true);
    assert.equal(isValidAuthorizationTransition("awaiting_redirect", "awaiting_callback"), true);
    assert.equal(isValidAuthorizationTransition("authorized", "initiated"), false);
  });

  it("processes OAuth callback preview with secrets redacted", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "github" });
    const preview = previewAuthorizationCallback({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
      callbackParams: { code: "secret_oauth_code", state: started.request.state, access_token: "sk_live_bad" },
    });
    assert.equal(preview.secretsRedacted, true);
    assert.equal(preview.callbackReceived, true);
    assert.equal(preview.callbackParams.access_token, "[REDACTED]");
  });

  it("submits credentials with vault reference only", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "openai" });
    const submission = submitAuthorizationCredentials({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
      credentialKind: "api_key",
    });
    assert.ok(submission.credentialReference.startsWith("vault:deferred:"));
    assert.equal(submission.redactedPreview, "[REDACTED]");
    assert.equal(JSON.stringify(submission).includes("sk_"), false);
  });

  it("validates authorization result from registry", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "vercel" });
    submitAuthorizationCredentials({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
      credentialKind: "api_key",
    });
    const result = validateAuthorizationResult({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
    });
    assert.equal(result.status, "authorized");
    assert.ok(result.grantedScopes.length >= 1);
    assert.ok(result.evidence.length >= 1);
    assert.equal(result.missingScopes.length, 0);
  });

  it("passes Pillow governance for authorization operations", () => {
    seedAuthorizationHarness();
    const result = validateAuthorizationFrameworkPillowGovernance({
      ...TEST_ACTOR,
      providerId: "stripe",
      authorizationType: "api_key",
      operation: "start",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.securityPolicy, true);
    assert.equal(result.scopeBoundary, true);
  });

  it("registers all required authorization Brain tools", () => {
    const names = new Set(authorizationFrameworkTools.map((tool) => tool.name));
    for (const toolName of [
      "authorization_start",
      "authorization_callback_preview",
      "authorization_submit_credentials",
      "authorization_validate_result",
      "authorization_status",
      "authorization_cancel",
      "authorization_requirements",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("records EKLS authorization learning events", () => {
    seedAuthorizationHarness();
    assert.deepEqual(listAuthorizationFrameworkEklsKinds(), [...AUTHORIZATION_FRAMEWORK_EKLS_KINDS]);
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "meta" });
    previewAuthorizationCallback({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
    });
    validateAuthorizationResult({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
      partial: true,
    });
    const observations = searchAuthorizationFrameworkEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "authorization_started"));
    assert.ok(observations.some((o) => o.kind === "authorization_callback_received"));
  });

  it("cancels authorization flow", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "tiktok" });
    const cancelled = cancelAuthorization({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
    });
    assert.equal(cancelled.flowState, "cancelled");
  });

  it("supports authorization framework plugins", () => {
    seedAuthorizationHarness();
    const registered = registerAuthorizationFrameworkPlugin({
      manifest: {
        pluginId: "test-oauth-strategy",
        pluginName: "Test OAuth Strategy",
        pluginKind: "oauth_strategy",
        pillowGovernance: true,
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    assert.equal(listAuthorizationFrameworkPlugins().length, 1);
  });

  it("redacts authorization secrets", () => {
    const redacted = redactAuthorizationSecrets({
      api_key: "sk_live_secret",
      token: "oauth_bearer_token",
      provider: "stripe",
    }) as Record<string, unknown>;
    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.token, "[REDACTED]");
    assert.equal(redacted.provider, "stripe");
  });

  it("exposes future Cockpit authorization flow view", () => {
    seedAuthorizationHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "cloudflare" });
    const view = buildCockpitAuthorizationFlowView({ request: started.request });
    assert.equal(view.presentationDeferred, true);
    assert.equal(view.futureMission, "G8-05");
    assert.equal(view.authorizationStartSupported, true);
    assert.ok(view.requiredScopes.length >= 1);

    const status = getAuthorizationStatus(started.request.authorizationId);
    assert.ok(status.request);
  });

  it("returns authorization requirements via service", () => {
    seedAuthorizationHarness();
    const requirements = getAuthorizationRequirements("cjdropshipping", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(requirements);
    assert.equal(requirements!.authorizationType, "api_key");
  });
});
