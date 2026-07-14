import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertNoSecretsInHealthPayload,
  buildCockpitConnectionHealthView,
  buildConnectionHealthNotification,
  CONNECTION_HEALTH_EKLS_KINDS,
  CONNECTION_HEALTH_MONITORING_VERSION,
  CONNECTION_HEALTH_STATES,
  connectionHealthTools,
  createConnectionHealthModuleContract,
  createCredentialReference,
  getConnectionHealthAttentionItems,
  getConnectionHealthDetail,
  getConnectionHealthSummary,
  getProviderHealthMatrix,
  HEALTH_CHECK_TYPES,
  listConnectionHealthEklsKinds,
  listConnectionHealthPlugins,
  redactConnectionHealthSecrets,
  registerConnectionHealthPlugin,
  resetConnectionHealthHarnessForTests,
  resolveAllProviderMonitoringProfiles,
  resolveProviderMonitoringProfile,
  runConnectionHealthCheck,
  searchConnectionHealthEklsObservations,
  startAuthorization,
  submitAuthorizationCredentials,
  validateConnectionHealthPillowGovernance,
} from "../../orchestration/identity-authorization-platform/index.js";
import { resetConnectionRegistryHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
import { resetAuthorizationFrameworkHarnessForTests } from "../../orchestration/identity-authorization-platform/authorization-framework/index.js";
import { resetCredentialVaultHarnessForTests } from "../../orchestration/identity-authorization-platform/credential-vault-integration/index.js";
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

function seedConnectionHealthHarness() {
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
  resetCredentialVaultHarnessForTests();
  resetConnectionHealthHarnessForTests();
}

describe("G8-04 — Connection Health & Monitoring", () => {
  it("exposes connection health monitoring version and types", () => {
    assert.equal(CONNECTION_HEALTH_MONITORING_VERSION, "g8-04-v1");
    assert.equal(CONNECTION_HEALTH_STATES.length, 13);
    assert.equal(HEALTH_CHECK_TYPES.length, 12);
    assert.equal(CONNECTION_HEALTH_EKLS_KINDS.length, 7);
  });

  it("registers connection-health Brain module contract", () => {
    const contract = createConnectionHealthModuleContract();
    assert.equal(contract.moduleId, "connection-health-monitoring");
    assert.equal(contract.missionId, "G8-04");
    assert.equal(contract.programmeStatus, "connection-health-monitoring-established");
    assert.ok(contract.integratesWith.includes("credential-vault-integration"));
  });

  it("resolves provider monitoring profiles from registry", () => {
    seedConnectionHealthHarness();
    const stripe = resolveProviderMonitoringProfile("stripe", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(stripe);
    assert.ok(stripe!.checkTypes.includes("credential_present"));
    assert.ok(stripe!.registryRefs.includes("REG-IDENTITY-MONITOR"));

    const all = resolveAllProviderMonitoringProfiles({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(all.length, 15);
  });

  it("evaluates health status with full monitoring contract fields", () => {
    seedConnectionHealthHarness();
    const checks = runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "google" });
    assert.ok(checks.length >= 1);
    const check = checks[0]!;
    assert.ok(check.healthCheckId);
    assert.ok(check.connectionId);
    assert.equal(check.providerId, "google");
    assert.equal(check.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.ok(check.checkType);
    assert.ok(check.status);
    assert.ok(check.severity);
    assert.ok(check.message);
    assert.ok(Array.isArray(check.evidence));
    assert.ok(check.lastCheckedAt);
    assert.ok(check.correlationId);
    assert.equal(check.governanceState, "pillow-governed");
  });

  it("detects missing credentials", () => {
    seedConnectionHealthHarness();
    const checks = runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "openai" });
    const credentialCheck = checks.find((c) => c.checkType === "credential_present");
    assert.ok(credentialCheck);
    assert.equal(credentialCheck!.status, "missing_credentials");
  });

  it("detects healthy state when credential and authorization present", () => {
    seedConnectionHealthHarness();
    const started = startAuthorization({ ...TEST_ACTOR, providerId: "anthropic" });
    submitAuthorizationCredentials({
      ...TEST_ACTOR,
      authorizationId: started.request.authorizationId,
      credentialKind: "api_key",
    });
    createCredentialReference({
      ...TEST_ACTOR,
      providerId: "anthropic",
      authorizationId: started.request.authorizationId,
      connectionId: started.request.connectionId,
    });
    const checks = runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "anthropic" });
    const credentialCheck = checks.find((c) => c.checkType === "credential_present");
    assert.ok(credentialCheck);
    assert.equal(credentialCheck!.status, "healthy");
  });

  it("evaluates expiry metadata from credential references", () => {
    seedConnectionHealthHarness();
    createCredentialReference({
      ...TEST_ACTOR,
      providerId: "stripe",
      authorizationId: "auth_stripe_1",
      connectionId: "conn_stripe_1",
    });
    const checks = runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "stripe" });
    const expiryCheck = checks.find((c) => c.checkType === "credential_expiry");
    assert.ok(expiryCheck);
    assert.ok(["healthy", "unknown", "expired"].includes(expiryCheck!.status));
  });

  it("detects missing permission when authorization incomplete", () => {
    seedConnectionHealthHarness();
    startAuthorization({ ...TEST_ACTOR, providerId: "shopify" });
    const checks = runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "shopify" });
    const permCheck = checks.find((c) => c.checkType === "permission_completeness");
    assert.ok(permCheck);
    assert.equal(permCheck!.status, "healthy");
  });

  it("builds provider health matrix", () => {
    seedConnectionHealthHarness();
    runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "meta" });
    runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "github" });
    const matrix = getProviderHealthMatrix({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(matrix.length, 15);
    const meta = matrix.find((e) => e.providerId === "meta");
    assert.ok(meta);
    assert.ok(meta!.checkCount >= 1);
  });

  it("passes Pillow governance for connection health operations", () => {
    seedConnectionHealthHarness();
    const result = validateConnectionHealthPillowGovernance({
      ...TEST_ACTOR,
      providerId: "vercel",
      operation: "check",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.monitoringPermission, true);
    assert.equal(result.credentialVisibilityBoundary, true);
  });

  it("rejects Pillow governance bypass", () => {
    seedConnectionHealthHarness();
    const result = validateConnectionHealthPillowGovernance({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
      operation: "check",
      pillowGovernance: false as unknown as true,
    });
    assert.equal(result.allowed, false);
  });

  it("registers all required connection health Brain tools", () => {
    const names = new Set(connectionHealthTools.map((tool) => tool.name));
    for (const toolName of [
      "connection_health_list",
      "connection_health_detail",
      "run_connection_health_check",
      "connection_health_summary",
      "connection_health_attention_items",
      "provider_health_matrix",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("Brain tools never expose raw secrets", async () => {
    seedConnectionHealthHarness();
    runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "cloudflare" });
    const detailTool = connectionHealthTools.find((tool) => tool.name === "connection_health_detail");
    assert.ok(detailTool);
    const detail = await detailTool!.handler({ providerId: "cloudflare" }, toolContext());
    assert.equal(assertNoSecretsInHealthPayload(detail), true);
    assert.equal(JSON.stringify(detail).includes("sk_live"), false);
  });

  it("records EKLS connection health events", () => {
    seedConnectionHealthHarness();
    assert.deepEqual(listConnectionHealthEklsKinds(), [...CONNECTION_HEALTH_EKLS_KINDS]);
    runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "tiktok" });
    const observations = searchConnectionHealthEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "connection_health_checked"));
    assert.equal(observations.every((o) => o.pillowGoverned), true);
  });

  it("supports connection health plugins", () => {
    seedConnectionHealthHarness();
    const registered = registerConnectionHealthPlugin({
      manifest: {
        pluginId: "webhook-monitor-stripe",
        pluginName: "Stripe Webhook Monitor",
        pluginKind: "webhook_monitor",
        pillowGovernance: true,
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    assert.equal(listConnectionHealthPlugins().length, 1);
  });

  it("redacts connection health secrets", () => {
    const redacted = redactConnectionHealthSecrets({
      api_key: "sk_live_secret",
      token: "oauth_bearer_token",
      provider: "stripe",
    }) as Record<string, unknown>;
    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.token, "[REDACTED]");
    assert.equal(redacted.provider, "stripe");
  });

  it("exposes future Cockpit connection health view", () => {
    seedConnectionHealthHarness();
    runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "amazon" });
    const view = buildCockpitConnectionHealthView({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(view.presentationDeferred, true);
    assert.equal(view.futureMission, "G8-05");
    assert.equal(view.matrix.length, 15);
    assert.ok(view.summary.providerCount === 15);
  });

  it("returns health summary and attention items", () => {
    seedConnectionHealthHarness();
    runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "cjdropshipping" });
    const summary = getConnectionHealthSummary({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(summary.providerCount, 15);
    const attention = getConnectionHealthAttentionItems({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(Array.isArray(attention));
    const detail = getConnectionHealthDetail("cjdropshipping");
    assert.ok(detail);
    assert.ok(detail!.checks.length >= 1);
  });

  it("prepares notification contracts without UI", () => {
    const notification = buildConnectionHealthNotification({
      kind: "expired_credential",
      providerId: "stripe",
      connectionId: "conn:stripe",
      workspaceId: CANONICAL_WORKSPACE_ID,
      severity: "critical",
      status: "expired",
      message: "Credential expired — metadata only",
      evidenceRefs: ["credential-ref:example"],
    });
    assert.equal(notification.deliveryDeferred, true);
    assert.equal(notification.futureMission, "G8-05");
    assert.equal(JSON.stringify(notification).includes("sk_"), false);
  });

  it("prevents security leaks in health payloads", () => {
    seedConnectionHealthHarness();
    const checks = runConnectionHealthCheck({ ...TEST_ACTOR, providerId: "email-provider" });
    const serialized = JSON.stringify(checks);
    assert.equal(serialized.includes("sk_"), false);
    assert.equal(serialized.includes("secret_key"), false);
  });
});
