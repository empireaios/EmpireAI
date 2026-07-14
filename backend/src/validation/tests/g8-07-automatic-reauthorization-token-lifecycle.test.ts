import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertNoSecretsInTokenLifecyclePayload,
  buildCockpitTokenLifecycleView,
  buildTokenLifecycleNotification,
  cancelReauthorization,
  createAutomaticReauthorizationModuleContract,
  createCredentialReference,
  detectTokenExpiry,
  getRefreshEligibility,
  getReauthorizationStatus,
  getTokenExpiryWarnings,
  getTokenLifecycleDetail,
  getTokenLifecycleSummary,
  listReauthorizationRequired,
  listTokenLifecycleEklsKinds,
  redactTokenLifecycleSecrets,
  registerTokenLifecyclePlugin,
  resetAutomaticReauthorizationHarnessForTests,
  resolveTokenLifecycleProfile,
  searchTokenLifecycleEklsObservations,
  startAuthorization,
  startReauthorization,
  submitAuthorizationCredentials,
  TOKEN_LIFECYCLE_EKLS_KINDS,
  TOKEN_LIFECYCLE_STATES,
  tokenLifecycleTools,
  transitionReauthorizationState,
  validateAuthorizationResult,
  validateTokenLifecyclePillowGovernance,
  AUTOMATIC_REAUTHORIZATION_VERSION,
} from "../../orchestration/identity-authorization-platform/index.js";
import { resetConnectionRegistryHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
import { resetAuthorizationFrameworkHarnessForTests } from "../../orchestration/identity-authorization-platform/authorization-framework/index.js";
import { resetCredentialVaultHarnessForTests } from "../../orchestration/identity-authorization-platform/credential-vault-integration/index.js";
import { resetConnectionHealthHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-health-monitoring/index.js";
import { resetOperationalReadinessHarnessForTests } from "../../orchestration/identity-authorization-platform/operational-readiness-engine/index.js";
import { loadAuthorizationCentreView } from "../../orchestration/identity-authorization-platform/authorization-centre/index.js";
import type { ToolContext } from "../../brain/types.js";
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

function toolContext(): ToolContext {
  return {
    agentId: "test-agent",
    correlationId: "test-correlation",
    workspaceId: CANONICAL_WORKSPACE_ID,
  };
}

function seedTokenLifecycleHarness() {
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
  resetCredentialVaultHarnessForTests();
  resetConnectionHealthHarnessForTests();
  resetOperationalReadinessHarnessForTests();
  resetAutomaticReauthorizationHarnessForTests();
}

function connectProvider(providerId: string) {
  const started = startAuthorization({ ...TEST_ACTOR, providerId });
  submitAuthorizationCredentials({
    ...TEST_ACTOR,
    authorizationId: started.request.authorizationId,
    credentialKind: "api_key",
  });
  validateAuthorizationResult({
    ...TEST_ACTOR,
    authorizationId: started.request.authorizationId,
  });
  createCredentialReference({
    ...TEST_ACTOR,
    providerId,
    authorizationId: started.request.authorizationId,
    connectionId: started.request.connectionId,
  });
  return started;
}

describe("G8-07 — Automatic Reauthorization & Token Lifecycle", () => {
  it("exposes automatic reauthorization version and lifecycle states", () => {
    assert.equal(AUTOMATIC_REAUTHORIZATION_VERSION, "g8-07-v1");
    assert.equal(TOKEN_LIFECYCLE_STATES.length, 13);
    assert.equal(TOKEN_LIFECYCLE_EKLS_KINDS.length, 8);
  });

  it("registers automatic reauthorization Brain module contract", () => {
    const contract = createAutomaticReauthorizationModuleContract();
    assert.equal(contract.moduleId, "automatic-reauthorization");
    assert.equal(contract.missionId, "G8-07");
    assert.ok(contract.registryRefs.includes("REG-CREDENTIAL-TYPE"));
    assert.ok(contract.registryRefs.includes("REG-CONNECTION-POLICY"));
    assert.equal(contract.brainTools.length, 8);
  });

  it("resolves token lifecycle profile from registries", () => {
    seedTokenLifecycleHarness();
    const profile = resolveTokenLifecycleProfile("stripe", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(profile);
    assert.equal(profile!.providerId, "stripe");
    assert.ok(profile!.expiryPolicyRef);
    assert.ok(profile!.reconnectRuleRefs.length >= 1);
    assert.ok(profile!.registryRefs.includes("REG-CREDENTIAL-TYPE"));
  });

  it("detects expiring soon warnings from registry warning window", () => {
    seedTokenLifecycleHarness();
    connectProvider("google");
    const detection = detectTokenExpiry({
      providerId: "google",
      workspaceId: CANONICAL_WORKSPACE_ID,
      authorization: {
        flowState: "authorized",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Parameters<typeof detectTokenExpiry>[0]["authorization"],
      credentialRef: {
        status: "active",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Parameters<typeof detectTokenExpiry>[0]["credentialRef"],
      context: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    assert.equal(detection.lifecycleState, "expiring_soon");
    assert.ok(detection.warningWindow);
  });

  it("detects expired tokens", () => {
    seedTokenLifecycleHarness();
    const detection = detectTokenExpiry({
      providerId: "amazon",
      workspaceId: CANONICAL_WORKSPACE_ID,
      authorization: {
        flowState: "expired",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      } as Parameters<typeof detectTokenExpiry>[0]["authorization"],
      context: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    assert.equal(detection.lifecycleState, "expired");
  });

  it("evaluates refresh eligibility from registry", () => {
    seedTokenLifecycleHarness();
    connectProvider("meta");
    const eligibility = getRefreshEligibility({ ...TEST_ACTOR, providerId: "meta" });
    assert.equal(eligibility.supportsRefreshToken, true);
    assert.equal(eligibility.authorizationType, "oauth2");
    assert.ok(Array.isArray(eligibility.registryRefs));
  });

  it("creates reauthorization request with full contract", () => {
    seedTokenLifecycleHarness();
    connectProvider("stripe");
    const result = startReauthorization({ ...TEST_ACTOR, providerId: "stripe" });
    const request = result.request;
    assert.ok(request.reauthorizationId);
    assert.equal(request.providerId, "stripe");
    assert.ok(request.connectionId);
    assert.ok(request.authorizationId);
    assert.equal(request.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.ok(request.reason);
    assert.ok(request.lifecycleState);
    assert.ok(request.requiredAction);
    assert.equal(typeof request.refreshEligible, "boolean");
    assert.equal(typeof request.requiresUserAction, "boolean");
    assert.equal(typeof request.requiresPillowApproval, "boolean");
    assert.ok(request.correlationId);
    assert.equal(request.governanceState, "pillow-governed");
    assert.equal(result.liveProviderCall, false);
  });

  it("transitions reauthorization state machine", () => {
    assert.equal(transitionReauthorizationState("expired", "reauthorization_pending").ok, true);
    assert.equal(transitionReauthorizationState("refreshing", "reauthorized").ok, true);
    assert.equal(transitionReauthorizationState("revoked", "reauthorization_pending").ok, true);
    assert.equal(transitionReauthorizationState("active", "reauthorized").ok, false);
  });

  it("handles revoked token lifecycle state", () => {
    seedTokenLifecycleHarness();
    const detection = detectTokenExpiry({
      providerId: "shopify",
      workspaceId: CANONICAL_WORKSPACE_ID,
      authorization: { flowState: "revoked" } as Parameters<typeof detectTokenExpiry>[0]["authorization"],
      context: { workspaceId: CANONICAL_WORKSPACE_ID },
    });
    assert.equal(detection.lifecycleState, "revoked");
    const notification = buildTokenLifecycleNotification({
      providerId: "shopify",
      workspaceId: CANONICAL_WORKSPACE_ID,
      lifecycleState: "revoked",
      requiredAction: "reauthorize",
      correlationId: "test-corr",
    });
    assert.equal(notification!.kind, "permission_revoked");
  });

  it("cancels reauthorization requests", () => {
    seedTokenLifecycleHarness();
    connectProvider("anthropic");
    const started = startReauthorization({ ...TEST_ACTOR, providerId: "anthropic" });
    const cancelled = cancelReauthorization({
      ...TEST_ACTOR,
      reauthorizationId: started.request.reauthorizationId,
    });
    assert.equal(cancelled.cancelled, true);
    assert.ok(cancelled.request.updatedAt);
  });

  it("returns token lifecycle summary", () => {
    seedTokenLifecycleHarness();
    connectProvider("vercel");
    const summary = getTokenLifecycleSummary({ ...TEST_ACTOR });
    assert.equal(summary.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.equal(typeof summary.activeCount, "number");
    assert.equal(typeof summary.expiringSoonCount, "number");
    assert.equal(summary.governanceState, "pillow-governed");
  });

  it("lists reauthorization required providers", () => {
    seedTokenLifecycleHarness();
    const required = listReauthorizationRequired({ ...TEST_ACTOR });
    assert.ok(Array.isArray(required.required));
  });

  it("registers all required token lifecycle Brain tools", () => {
    const names = new Set(tokenLifecycleTools.map((tool) => tool.name));
    for (const toolName of [
      "token_lifecycle_summary",
      "token_lifecycle_detail",
      "reauthorization_required",
      "reauthorization_start",
      "reauthorization_cancel",
      "reauthorization_status",
      "token_expiry_warnings",
      "refresh_eligibility",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("Brain tools never expose raw secrets", async () => {
    seedTokenLifecycleHarness();
    connectProvider("cloudflare");
    const tool = tokenLifecycleTools.find((t) => t.name === "token_lifecycle_detail");
    assert.ok(tool);
    const result = await tool!.handler({ providerId: "cloudflare", ...TEST_ACTOR }, toolContext());
    assert.equal(assertNoSecretsInTokenLifecyclePayload(result), true);
    assert.equal(JSON.stringify(result).includes("access_token"), false);
    assert.equal(JSON.stringify(result).includes("refresh_token"), false);
  });

  it("passes Pillow governance for token lifecycle operations", () => {
    seedTokenLifecycleHarness();
    const result = validateTokenLifecyclePillowGovernance({
      ...TEST_ACTOR,
      providerId: "github",
      operation: "start",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.reauthorizationAuthority, true);
    assert.equal(result.workspaceIsolation, true);
  });

  it("rejects Pillow governance bypass", () => {
    seedTokenLifecycleHarness();
    const result = validateTokenLifecyclePillowGovernance({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
      operation: "scan",
      pillowGovernance: false as unknown as true,
    });
    assert.equal(result.allowed, false);
  });

  it("records EKLS token lifecycle events", () => {
    seedTokenLifecycleHarness();
    assert.deepEqual(listTokenLifecycleEklsKinds(), [...TOKEN_LIFECYCLE_EKLS_KINDS]);
    connectProvider("tiktok");
    startReauthorization({ ...TEST_ACTOR, providerId: "tiktok" });
    const observations = searchTokenLifecycleEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "reauthorization_requested"));
  });

  it("redacts secrets from lifecycle payloads", () => {
    const redacted = redactTokenLifecycleSecrets({ refresh_token: "secret-value", providerId: "meta" }) as Record<
      string,
      unknown
    >;
    assert.equal(redacted.refresh_token, "[REDACTED]");
    assert.equal(redacted.providerId, "meta");
  });

  it("supports plugin registration without modifying lifecycle core", () => {
    seedTokenLifecycleHarness();
    const registered = registerTokenLifecyclePlugin({
      ...TEST_ACTOR,
      manifest: {
        pluginId: "test-refresh-provider",
        pluginName: "Test Refresh Provider",
        pluginKind: "refresh_provider",
        pillowGovernance: true,
      },
    });
    assert.equal(registered.accepted, true);
  });

  it("exposes cockpit token lifecycle view for Authorization Centre", () => {
    seedTokenLifecycleHarness();
    connectProvider("openai");
    const view = buildCockpitTokenLifecycleView(CANONICAL_WORKSPACE_ID);
    assert.ok(view.summary);
    assert.ok(Array.isArray(view.expiringSoon));
    assert.ok(Array.isArray(view.expired));
    assert.ok(Array.isArray(view.reconnectRequired));
    assert.equal(view.pillowGovernanceState, "pillow-governed");

    const centre = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID);
    assert.ok(centre.tokenLifecycleSummary);
    assert.equal(typeof centre.tokenLifecycleSummary!.expiringSoonCount, "number");
    assert.ok(centre.tokenLifecycleSummary!.requiredAccountHolderAction);
  });

  it("returns reauthorization status by provider", () => {
    seedTokenLifecycleHarness();
    connectProvider("email-provider");
    startReauthorization({ ...TEST_ACTOR, providerId: "email-provider" });
    const status = getReauthorizationStatus({ ...TEST_ACTOR, providerId: "email-provider" });
    assert.ok("requests" in status && status.requests);
    assert.ok(status.requests!.length >= 1);
  });

  it("emits token expiry warnings through scheduler", () => {
    seedTokenLifecycleHarness();
    connectProvider("google");
    const warnings = getTokenExpiryWarnings({ ...TEST_ACTOR });
    assert.ok(Array.isArray(warnings.warnings));
  });
});
