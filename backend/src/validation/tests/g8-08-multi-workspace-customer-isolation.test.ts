import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCockpitIsolationSummary,
  buildIdentityVisibilityMatrix,
  assertNoSecretsInIsolationPayload,
  checkIdentityIsolation,
  createCredentialReference,
  createDelegation,
  createMultiWorkspaceIsolationModuleContract,
  enforceIsolationBoundary,
  filterAuthorizationRecords,
  filterCredentialReferences,
  filterIsolatedHealthRecords,
  getCredentialReferenceVisibility,
  getWorkspaceAuthorizationScope,
  isolationTools,
  ISOLATION_EKLS_KINDS,
  listIsolationEklsKinds,
  loadAuthorizationCentreView,
  MULTI_WORKSPACE_ISOLATION_VERSION,
  redactIsolationSecrets,
  registerIsolationPlugin,
  resetAutomaticReauthorizationHarnessForTests,
  resetMultiWorkspaceIsolationHarnessForTests,
  searchIsolationEklsObservations,
  startAuthorization,
  submitAuthorizationCredentials,
  validateAuthorizationResult,
  validateIsolationPillowGovernance,
  VISIBILITY_SCOPES,
  wrapG8BrainToolsWithIsolation,
} from "../../orchestration/identity-authorization-platform/index.js";
import { resetConnectionRegistryHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
import { resetAuthorizationFrameworkHarnessForTests } from "../../orchestration/identity-authorization-platform/authorization-framework/index.js";
import { resetCredentialVaultHarnessForTests } from "../../orchestration/identity-authorization-platform/credential-vault-integration/index.js";
import { resetConnectionHealthHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-health-monitoring/index.js";
import { resetOperationalReadinessHarnessForTests } from "../../orchestration/identity-authorization-platform/operational-readiness-engine/index.js";
import { listAuthorizationRequests } from "../../orchestration/identity-authorization-platform/authorization-framework/services/authorization-flow-service.js";
import { listCredentialReferences } from "../../orchestration/identity-authorization-platform/credential-vault-integration/services/credential-handoff-service.js";
import { connectionRegistryTools } from "../../orchestration/identity-authorization-platform/connection-registry/tools/connection-registry-tools.js";
import type { ToolContext } from "../../brain/types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";
const OTHER_WORKSPACE_ID = "ws_customer_2";

const GRAND_KING_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  accountHolderTypeId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  pillowGovernance: true as const,
};

const EXTERNAL_ACTOR = {
  actorId: "external-user",
  ownerId: "external-user",
  accountHolderId: "external-user",
  accountHolderTypeId: "external-owner",
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

function seedIsolationHarness() {
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
  resetCredentialVaultHarnessForTests();
  resetConnectionHealthHarnessForTests();
  resetOperationalReadinessHarnessForTests();
  resetAutomaticReauthorizationHarnessForTests();
  resetMultiWorkspaceIsolationHarnessForTests();
}

function connectProvider(providerId: string, workspaceId = CANONICAL_WORKSPACE_ID, accountHolderId = "grand-king") {
  const actor = { ...GRAND_KING_ACTOR, workspaceId, accountHolderId };
  const started = startAuthorization({ ...actor, providerId });
  submitAuthorizationCredentials({
    ...actor,
    authorizationId: started.request.authorizationId,
    credentialKind: "api_key",
  });
  validateAuthorizationResult({
    ...actor,
    authorizationId: started.request.authorizationId,
  });
  createCredentialReference({
    ...actor,
    providerId,
    authorizationId: started.request.authorizationId,
    connectionId: started.request.connectionId,
  });
}

describe("G8-08 — Multi-Workspace & Customer Isolation", () => {
  it("exposes multi-workspace isolation version and scopes", () => {
    assert.equal(MULTI_WORKSPACE_ISOLATION_VERSION, "g8-08-v1");
    assert.equal(VISIBILITY_SCOPES.length, 9);
    assert.equal(ISOLATION_EKLS_KINDS.length, 6);
  });

  it("registers multi-workspace isolation module contract", () => {
    const contract = createMultiWorkspaceIsolationModuleContract();
    assert.equal(contract.moduleId, "multi-workspace-isolation");
    assert.equal(contract.missionId, "G8-08");
    assert.ok(contract.registryRefs.includes("REG-CONNECTION-ACCOUNT-HOLDER"));
    assert.equal(contract.brainTools.length, 5);
  });

  it("denies cross-workspace access", () => {
    seedIsolationHarness();
    const check = checkIdentityIsolation({
      actor: GRAND_KING_ACTOR,
      targetWorkspaceId: OTHER_WORKSPACE_ID,
    });
    assert.equal(check.allowed, false);
    assert.equal(check.workspaceBoundary, false);
    assert.equal(check.accessDecision, "deny");
  });

  it("enforces account holder isolation for external owners", () => {
    seedIsolationHarness();
    connectProvider("stripe");
    const check = enforceIsolationBoundary({
      actor: EXTERNAL_ACTOR,
      targetWorkspaceId: CANONICAL_WORKSPACE_ID,
      targetAccountHolderId: "grand-king",
      operation: "read",
    });
    assert.equal(check.allowed, false);
    assert.equal(check.accountHolderBoundary, false);
  });

  it("isolates credential references by account holder", () => {
    seedIsolationHarness();
    connectProvider("stripe");
    const creds = filterCredentialReferences(listCredentialReferences({ workspaceId: CANONICAL_WORKSPACE_ID }), EXTERNAL_ACTOR);
    assert.equal(creds.length, 0);
  });

  it("isolates authorization records within workspace scope", () => {
    seedIsolationHarness();
    connectProvider("meta");
    const scope = getWorkspaceAuthorizationScope({ actor: GRAND_KING_ACTOR });
    assert.equal(scope.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.ok(scope.authorizationRecords.length >= 1);
    assert.equal(scope.governanceState, "pillow-governed");
  });

  it("filters health records by isolation boundary", () => {
    seedIsolationHarness();
    const records = filterIsolatedHealthRecords({ actor: GRAND_KING_ACTOR });
    assert.ok(Array.isArray(records));
  });

  it("builds identity visibility matrix from registry account holders", () => {
    seedIsolationHarness();
    const matrix = buildIdentityVisibilityMatrix({ actor: GRAND_KING_ACTOR });
    assert.ok(matrix.accountHolders.length >= 5);
    assert.ok(matrix.providers.length >= 15);
    assert.equal(matrix.viewerScope, "grand_king_visible");
    assert.ok(matrix.registryRefs.includes("REG-CONNECTION-ACCOUNT-HOLDER"));
  });

  it("returns credential reference visibility without vault paths", () => {
    seedIsolationHarness();
    connectProvider("google");
    const visibility = getCredentialReferenceVisibility({ actor: GRAND_KING_ACTOR, providerId: "google" });
    assert.ok(visibility.count >= 1);
    assert.ok(visibility.visibleReferences.every((r) => !("vaultPath" in r)));
    assert.equal(visibility.governanceState, "pillow-governed");
  });

  it("wraps G8 Brain tools with isolation enforcement", async () => {
    seedIsolationHarness();
    const wrapped = wrapG8BrainToolsWithIsolation(connectionRegistryTools);
    const tool = wrapped.find((t) => t.name === connectionRegistryTools[0]!.name);
    assert.ok(tool);
    const blocked = await tool!.handler(
      { workspaceId: OTHER_WORKSPACE_ID, actorId: "grand-king", ownerId: "grand-king" },
      toolContext(),
    );
    assert.equal((blocked as { isolationBlocked?: boolean }).isolationBlocked, true);
  });

  it("registers isolation Brain tools", () => {
    const names = new Set(isolationTools.map((tool) => tool.name));
    for (const toolName of [
      "identity_isolation_check",
      "identity_visibility_matrix",
      "account_holder_connection_scope",
      "workspace_authorization_scope",
      "credential_reference_visibility",
    ]) {
      assert.equal(names.has(toolName), true, `Missing tool: ${toolName}`);
    }
  });

  it("applies Cockpit isolation filter for external account holder", () => {
    seedIsolationHarness();
    const fullView = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID, GRAND_KING_ACTOR);
    const externalView = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID, EXTERNAL_ACTOR);
    assert.equal(fullView.providerCards.length, 15);
    assert.ok(externalView.isolationSummary);
    assert.equal(externalView.isolationSummary!.isolationEnforced, true);
  });

  it("builds cockpit isolation summary", () => {
    seedIsolationHarness();
    const view = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID);
    const summary = buildCockpitIsolationSummary({ view, actor: GRAND_KING_ACTOR });
    assert.equal(summary.isolationEnforced, true);
    assert.equal(summary.visibleProviderCount, 15);
  });

  it("passes Pillow governance for isolation operations", () => {
    seedIsolationHarness();
    const result = validateIsolationPillowGovernance({
      ...GRAND_KING_ACTOR,
      operation: "enforce",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.workspaceBoundary, true);
    assert.equal(result.brainToolAccess, true);
  });

  it("rejects Pillow governance bypass", () => {
    seedIsolationHarness();
    const result = validateIsolationPillowGovernance({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
      operation: "enforce",
      pillowGovernance: false as unknown as true,
    });
    assert.equal(result.allowed, false);
  });

  it("records EKLS isolation events", () => {
    seedIsolationHarness();
    assert.deepEqual(listIsolationEklsKinds(), [...ISOLATION_EKLS_KINDS]);
    checkIdentityIsolation({
      actor: GRAND_KING_ACTOR,
      targetWorkspaceId: OTHER_WORKSPACE_ID,
    });
    const observations = searchIsolationEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "isolation_check_failed" || o.kind === "unauthorized_access_blocked"));
  });

  it("supports delegation lifecycle with EKLS", () => {
    seedIsolationHarness();
    const delegation = createDelegation({
      actor: GRAND_KING_ACTOR,
      toAccountHolderId: "operator",
    });
    assert.ok(delegation.delegationId);
    const observations = searchIsolationEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "delegation_created",
      pillowGovernance: true,
    });
    assert.ok(observations.length >= 1);
  });

  it("redacts secrets from isolation payloads", () => {
    const redacted = redactIsolationSecrets({ vaultPath: "vault://secret", providerId: "stripe" }) as Record<
      string,
      unknown
    >;
    assert.equal(redacted.vaultPath, "[REDACTED]");
    assert.equal(redacted.providerId, "stripe");
  });

  it("supports plugin registration within isolation boundary", () => {
    seedIsolationHarness();
    const registered = registerIsolationPlugin({
      ...GRAND_KING_ACTOR,
      manifest: {
        pluginId: "test-isolation-policy",
        pluginName: "Test Isolation Policy",
        pluginKind: "isolation_policy",
        pillowGovernance: true,
      },
    });
    assert.equal(registered.accepted, true);
  });

  it("prevents cross-workspace leakage in authorization filter", () => {
    seedIsolationHarness();
    connectProvider("amazon");
    const auths = filterAuthorizationRecords(listAuthorizationRequests(), {
      ...GRAND_KING_ACTOR,
      workspaceId: OTHER_WORKSPACE_ID,
    });
    assert.equal(auths.length, 0);
  });

  it("Brain isolation tools never expose secrets", async () => {
    seedIsolationHarness();
    connectProvider("anthropic");
    const tool = isolationTools.find((t) => t.name === "credential_reference_visibility");
    assert.ok(tool);
    const result = await tool!.handler({ ...GRAND_KING_ACTOR }, toolContext());
    assert.equal(assertNoSecretsInIsolationPayload(result), true);
  });
});
