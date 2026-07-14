import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertNoRawSecretsInPayload,
  buildCockpitCredentialDetailView,
  buildCockpitCredentialStatusView,
  createCredentialReference,
  createCredentialVaultModuleContract,
  CREDENTIAL_REFERENCE_STATUSES,
  CREDENTIAL_VAULT_EKLS_KINDS,
  CREDENTIAL_VAULT_INTEGRATION_VERSION,
  credentialVaultTools,
  getCredentialHealth,
  getCredentialReferenceDetail,
  getCredentialRotationStatus,
  handoffSecretToVault,
  listCredentialVaultEklsKinds,
  listCredentialVaultPlugins,
  listCredentialReferences,
  previewCredentialHandoff,
  redactCredentialVaultSecrets,
  registerCredentialVaultPlugin,
  resetCredentialVaultHarnessForTests,
  resolveAllProviderCredentialRequirements,
  resolveProviderCredentialRequirements,
  searchCredentialVaultEklsObservations,
  validateCredentialVaultPillowGovernance,
  verifyCredentialReference,
  verifyVaultReference,
  VAULT_CREDENTIAL_TYPES,
} from "../../orchestration/identity-authorization-platform/credential-vault-integration/index.js";
import { resetConnectionRegistryHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
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

function seedCredentialVaultHarness() {
  resetConnectionRegistryHarnessForTests();
  resetCredentialVaultHarnessForTests();
}

describe("G8-03 — Credential Vault & Secret Management Integration", () => {
  it("exposes credential vault integration version and types", () => {
    assert.equal(CREDENTIAL_VAULT_INTEGRATION_VERSION, "g8-03-v1");
    assert.equal(VAULT_CREDENTIAL_TYPES.length, 14);
    assert.equal(CREDENTIAL_REFERENCE_STATUSES.length, 7);
    assert.equal(CREDENTIAL_VAULT_EKLS_KINDS.length, 6);
  });

  it("registers credential-vault Brain module contract", () => {
    const contract = createCredentialVaultModuleContract();
    assert.equal(contract.moduleId, "credential-vault-integration");
    assert.equal(contract.missionId, "G8-03");
    assert.equal(contract.programmeStatus, "credential-vault-secret-management-established");
    assert.ok(contract.integratesWith.includes("authorization-framework"));
  });

  it("resolves provider credential requirements from registry", () => {
    seedCredentialVaultHarness();
    const stripe = resolveProviderCredentialRequirements("stripe", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(stripe);
    assert.equal(stripe!.credentialKind, "secret_key");
    assert.ok(stripe!.vaultPathTemplate.includes("{providerId}"));
    assert.ok(stripe!.registryRefs.includes("REG-CREDENTIAL-TYPE"));

    const amazon = resolveProviderCredentialRequirements("amazon", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(amazon);
    assert.equal(amazon!.credentialKind, "lwa_client_secret");

    const all = resolveAllProviderCredentialRequirements({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(all.length, 15);
  });

  it("creates credential reference with full contract fields", () => {
    seedCredentialVaultHarness();
    const ref = createCredentialReference({
      ...TEST_ACTOR,
      providerId: "google",
      authorizationId: "auth_google_1",
      connectionId: "conn_google_1",
    });
    assert.ok(ref.credentialRefId);
    assert.equal(ref.providerId, "google");
    assert.equal(ref.connectionId, "conn_google_1");
    assert.equal(ref.authorizationId, "auth_google_1");
    assert.equal(ref.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.equal(ref.accountHolderId, "grand-king");
    assert.equal(ref.credentialType, "oauth_client_secret");
    assert.ok(ref.vaultPath.includes("google"));
    assert.equal(ref.status, "active");
    assert.equal(ref.governanceState, "pillow-governed");
    assert.ok(ref.correlationId);
    assert.ok(ref.createdAt);
    assert.ok(ref.updatedAt);
    assert.equal(ref.rotationPolicy, "rotation:policy:google");
  });

  it("handoffs secrets to vault gateway without persisting raw material", () => {
    seedCredentialVaultHarness();
    const handoff = handoffSecretToVault({
      workspaceId: CANONICAL_WORKSPACE_ID,
      providerId: "openai",
      authorizationId: "auth_openai_1",
      connectionId: "conn_openai_1",
      accountHolderId: "grand-king",
      environment: "production",
      credentialType: "api_key",
      vaultBackend: "empire-credential-vault",
      vaultPathTemplate: "vault://{workspaceId}/{providerId}/{credentialKind}",
      transientMaterial: "sk_live_super_secret_token",
    });
    assert.equal(handoff.accepted, true);
    assert.equal(handoff.materialDiscarded, true);
    assert.ok(handoff.vaultPath.includes("openai"));
    assert.equal(verifyVaultReference(handoff.credentialRefId), true);
    assert.equal(JSON.stringify(handoff).includes("sk_live"), false);
  });

  it("previews credential handoff with secret redaction", () => {
    seedCredentialVaultHarness();
    const preview = previewCredentialHandoff({
      ...TEST_ACTOR,
      providerId: "anthropic",
      authorizationId: "auth_anthropic_1",
      connectionId: "conn_anthropic_1",
      transientMaterial: "sk_live_secret_key_value",
    });
    assert.equal(preview.accepted, true);
    assert.equal(preview.secretRedacted, true);
    assert.equal(preview.materialDiscarded, true);
    assert.ok(preview.credentialRefId);
    assert.ok(preview.vaultPath);
    assert.equal(JSON.stringify(preview).includes("sk_live"), false);
  });

  it("validates credential metadata rotation expiry and health", () => {
    seedCredentialVaultHarness();
    const ref = createCredentialReference({
      ...TEST_ACTOR,
      providerId: "shopify",
      authorizationId: "auth_shopify_1",
      connectionId: "conn_shopify_1",
    });
    const detail = getCredentialReferenceDetail(ref.credentialRefId);
    assert.ok(detail);
    assert.equal(detail!.rotation.rotationPolicy, "rotation:policy:shopify");
    assert.equal(detail!.expiry.expired, false);
    assert.ok(detail!.health.healthStatus === "healthy" || detail!.health.healthStatus === "degraded");
    assert.equal(detail!.vaultVerified, true);
  });

  it("passes Pillow governance for credential vault operations", () => {
    seedCredentialVaultHarness();
    const result = validateCredentialVaultPillowGovernance({
      ...TEST_ACTOR,
      providerId: "stripe",
      credentialType: "secret_key",
      vaultBackend: "empire-credential-vault",
      rotationPolicy: "rotation:policy:stripe",
      operation: "handoff",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.securityPolicy, true);
    assert.equal(result.permissionBoundary, true);
  });

  it("rejects Pillow governance bypass", () => {
    seedCredentialVaultHarness();
    const result = validateCredentialVaultPillowGovernance({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
      operation: "handoff",
      pillowGovernance: false as unknown as true,
    });
    assert.equal(result.allowed, false);
  });

  it("registers all required credential vault Brain tools", () => {
    const names = new Set(credentialVaultTools.map((tool) => tool.name));
    for (const toolName of [
      "credential_reference_list",
      "credential_reference_detail",
      "credential_handoff_preview",
      "credential_health",
      "credential_rotation_status",
      "credential_redaction_test",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("Brain tools never return raw secrets", async () => {
    seedCredentialVaultHarness();
    const previewTool = credentialVaultTools.find((tool) => tool.name === "credential_handoff_preview");
    assert.ok(previewTool);
    const preview = await previewTool!.handler(
      {
        ...TEST_ACTOR,
        providerId: "vercel",
        authorizationId: "auth_vercel_1",
        connectionId: "conn_vercel_1",
        transientMaterial: "sk_live_secret_key_value",
      },
      toolContext(),
    );
    assert.equal(assertNoRawSecretsInPayload(preview), true);
    assert.equal(JSON.stringify(preview).includes("sk_live"), false);

    const redactionTool = credentialVaultTools.find((tool) => tool.name === "credential_redaction_test");
    assert.ok(redactionTool);
    const redaction = await redactionTool!.handler(
      { samplePayload: { api_key: "sk_live_bad", provider: "stripe" } },
      toolContext(),
    ) as { redacted: Record<string, unknown>; leaksDetected: boolean };
    assert.equal(redaction.leaksDetected, false);
    assert.equal(redaction.redacted.api_key, "[REDACTED]");
  });

  it("records EKLS credential vault learning events", () => {
    seedCredentialVaultHarness();
    assert.deepEqual(listCredentialVaultEklsKinds(), [...CREDENTIAL_VAULT_EKLS_KINDS]);
    createCredentialReference({
      ...TEST_ACTOR,
      providerId: "meta",
      authorizationId: "auth_meta_1",
      connectionId: "conn_meta_1",
    });
    verifyCredentialReference({
      ...TEST_ACTOR,
      credentialRefId: listCredentialReferences()[0]!.credentialRefId,
    });
    const observations = searchCredentialVaultEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "credential_reference_created"));
    assert.ok(observations.some((o) => o.kind === "credential_reference_verified"));
    assert.equal(observations.every((o) => o.pillowGoverned), true);
  });

  it("supports credential vault plugins", () => {
    seedCredentialVaultHarness();
    const registered = registerCredentialVaultPlugin({
      manifest: {
        pluginId: "rotation:policy:stripe",
        pluginName: "Stripe Rotation Provider",
        pluginKind: "rotation_provider",
        pillowGovernance: true,
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    assert.equal(listCredentialVaultPlugins().length, 1);
  });

  it("redacts credential vault secrets", () => {
    const redacted = redactCredentialVaultSecrets({
      api_key: "sk_live_secret",
      token: "oauth_bearer_token",
      provider: "stripe",
    }) as Record<string, unknown>;
    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.token, "[REDACTED]");
    assert.equal(redacted.provider, "stripe");
  });

  it("exposes future Cockpit credential status view", () => {
    seedCredentialVaultHarness();
    const view = buildCockpitCredentialStatusView({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(view.presentationDeferred, true);
    assert.equal(view.futureMission, "G8-05");
    assert.equal(view.missingCredentialWarnings.length, 15);

    const ref = createCredentialReference({
      ...TEST_ACTOR,
      providerId: "cloudflare",
      authorizationId: "auth_cf_1",
      connectionId: "conn_cf_1",
    });
    const detailView = buildCockpitCredentialDetailView(ref);
    assert.equal(detailView.reference.credentialRefId, ref.credentialRefId);
    assert.ok(detailView.rotation.rotationPolicy);
  });

  it("returns rotation and health status for references", () => {
    seedCredentialVaultHarness();
    const ref = createCredentialReference({
      ...TEST_ACTOR,
      providerId: "github",
      authorizationId: "auth_github_1",
      connectionId: "conn_github_1",
    });
    const rotation = getCredentialRotationStatus(ref.credentialRefId);
    const health = getCredentialHealth(ref.credentialRefId);
    assert.ok(rotation);
    assert.ok(health);
    assert.equal(rotation!.credentialRefId, ref.credentialRefId);
    assert.equal(health!.credentialRefId, ref.credentialRefId);
  });

  it("prevents security leaks in serialized payloads", () => {
    seedCredentialVaultHarness();
    const ref = createCredentialReference({
      ...TEST_ACTOR,
      providerId: "tiktok",
      authorizationId: "auth_tiktok_1",
      connectionId: "conn_tiktok_1",
    });
    const serialized = JSON.stringify(ref);
    assert.equal(serialized.includes("sk_"), false);
    assert.equal(serialized.includes("secret_key_value"), false);
    assert.ok(serialized.includes("vault://"));
  });
});
