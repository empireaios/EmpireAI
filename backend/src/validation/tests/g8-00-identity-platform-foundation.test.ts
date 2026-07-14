import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONNECTION_STATES,
  FOUNDATION_PROVIDER_IDS,
  IDENTITY_AUTHORIZATION_PLATFORM_VERSION,
  IDENTITY_LEARNING_RECORD_KINDS,
  buildCockpitIdentityAuthorizationView,
  computeReadinessPercentage,
  createCockpitIdentityAuthorizationRouteRegistration,
  createIdentityAuthorizationModuleContract,
  getConnectionStatus,
  getIdentityHealth,
  getIdentityPlatformOverview,
  getIdentityPlatformSummary,
  getIdentityProviderDetail,
  getOverallReadiness,
  identityAuthorizationTools,
  listIdentityAuthorizationEklsKinds,
  listIdentityAuthorizationPlugins,
  listIdentityPlatformHealthProbes,
  listIdentityPlatformRegistryIds,
  listIdentityProviders,
  loadIdentityPlatform,
  redactIdentityAuthorizationSecrets,
  registerIdentityAuthorizationPlugin,
  resetIdentityAuthorizationPlatformHarnessForTests,
  resolveAuthorizationProviders,
  resolveIdentityPlatformDependencies,
  searchIdentityAuthorizationEklsObservations,
  validateIdentityAuthorizationPillowGovernance,
} from "../../orchestration/identity-authorization-platform/index.js";
import { IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS } from "../../registry/types/registry-ids.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  pillowGovernance: true as const,
};

function seedIdentityPlatform() {
  resetIdentityAuthorizationPlatformHarnessForTests();
  return loadIdentityPlatform(TEST_ACTOR);
}

describe("G8-00 — Identity & Authorization Platform Foundation", () => {
  it("exposes identity platform framework version and learning kinds", () => {
    assert.equal(IDENTITY_AUTHORIZATION_PLATFORM_VERSION, "g8-00-v1");
    assert.equal(FOUNDATION_PROVIDER_IDS.length, 13);
    assert.equal(CONNECTION_STATES.length, 6);
    assert.equal(IDENTITY_LEARNING_RECORD_KINDS.length, 8);
  });

  it("registers identity-authorization Brain module contract", () => {
    const contract = createIdentityAuthorizationModuleContract();
    assert.equal(contract.moduleId, "identity-authorization");
    assert.equal(contract.missionId, "G8-10");
    assert.equal(contract.programmeStatus, "certified");
    assert.ok(contract.capabilities.includes("identity-authorization.programme_certification"));
    assert.ok(contract.integratesWith.includes("registry"));
    assert.ok(contract.integratesWith.includes("ekls"));
  });

  it("resolves all nine canonical IAP registries", () => {
    resetIdentityAuthorizationPlatformHarnessForTests();
    const registryIds = listIdentityPlatformRegistryIds();
    assert.equal(registryIds.length, 9);
    for (const id of IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS) {
      assert.ok(registryIds.includes(id), `Missing registry: ${id}`);
    }
  });

  it("seeds thirteen foundation providers as configurable", () => {
    resetIdentityAuthorizationPlatformHarnessForTests();
    const providers = resolveAuthorizationProviders({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(providers.length, 13);
    for (const provider of providers) {
      assert.equal(provider.configurable, true);
      assert.ok(FOUNDATION_PROVIDER_IDS.includes(provider.providerId as (typeof FOUNDATION_PROVIDER_IDS)[number]));
    }
  });

  it("resolves identity platform dependencies from registry", () => {
    resetIdentityAuthorizationPlatformHarnessForTests();
    const deps = resolveIdentityPlatformDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(deps.authorizationProviders.length, 13);
    assert.equal(deps.credentialTypes, 15);
    assert.equal(deps.connectionTypes, 15);
    assert.equal(deps.connectionPolicies, 13);
    assert.ok(deps.identityProviders.length >= 1);
    assert.ok(deps.readinessPolicies.length >= 1);
    assert.ok(deps.identityMonitors.length >= 1);
    assert.equal(deps.identityReports, 2);
    assert.equal(deps.identityNotifications, 1);
  });

  it("bootstraps identity platform with overview and health registration", () => {
    const result = seedIdentityPlatform();
    assert.equal(result.bootstrap.initialized, true);
    assert.equal(result.bootstrap.registryCount, 9);
    assert.equal(result.bootstrap.providerCount, 13);
    assert.equal(result.overview.initialized, true);
    assert.equal(result.overview.providerCount, 13);
    assert.ok(listIdentityPlatformHealthProbes().length >= 1);
  });

  it("computes executive summary with readiness percentage", () => {
    seedIdentityPlatform();
    const summary = getIdentityPlatformSummary({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(summary.providerCount, 13);
    assert.equal(summary.connectionCount, 13);
    assert.ok(summary.authorizedCount >= 0);
    assert.ok(summary.disconnectedCount >= 0);
    assert.ok(summary.readinessPercentage >= 0 && summary.readinessPercentage <= 100);
    assert.ok(summary.executiveSummary.includes("Identity platform foundation"));
    assert.equal(computeReadinessPercentage({ workspaceId: CANONICAL_WORKSPACE_ID }), summary.readinessPercentage);
  });

  it("derives connection states from registry without OAuth", () => {
    seedIdentityPlatform();
    const connections = getConnectionStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(connections.length, 13);
    for (const connection of connections) {
      assert.equal(connection.configurable, true);
      assert.ok(connection.ruleReference.startsWith("connection:"));
      assert.ok(CONNECTION_STATES.includes(connection.connectionState));
    }
  });

  it("returns provider detail from registry", () => {
    seedIdentityPlatform();
    const detail = getIdentityProviderDetail("stripe", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(detail);
    assert.equal(detail!.providerName, "Stripe");
    assert.equal(detail!.configurable, true);
  });

  it("registers all required identity authorization Brain tools", () => {
    const names = new Set(identityAuthorizationTools.map((tool) => tool.name));
    for (const toolName of [
      "load_identity_platform",
      "identity_summary",
      "identity_health",
      "identity_provider_list",
      "identity_provider_detail",
      "connection_status",
      "overall_readiness",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for identity platform operations", () => {
    const result = validateIdentityAuthorizationPillowGovernance({
      ...TEST_ACTOR,
      operation: "load",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.workspaceValidated, true);
    assert.equal(result.ownershipValidated, true);
    assert.equal(result.registryCompliance, true);
    assert.equal(result.constitutionalCompliance, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("blocks ineligible providers through Pillow governance", () => {
    const result = validateIdentityAuthorizationPillowGovernance({
      ...TEST_ACTOR,
      providerId: "unknown-provider",
      operation: "authorize",
    });
    assert.equal(result.allowed, false);
    assert.equal(result.providerEligibility, false);
  });

  it("records identity EKLS learning records through Pillow", () => {
    seedIdentityPlatform();
    assert.deepEqual(listIdentityAuthorizationEklsKinds(), [...IDENTITY_LEARNING_RECORD_KINDS]);
    const observations = searchIdentityAuthorizationEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.length >= 2);
    assert.ok(observations.some((o) => o.kind === "authorization"));
    assert.ok(observations.some((o) => o.kind === "connection"));
  });

  it("registers Cockpit route under Operations without UI redesign", () => {
    const route = createCockpitIdentityAuthorizationRouteRegistration();
    assert.equal(route.section, "Operations");
    assert.equal(route.label, "Identity & Authorization");
    assert.equal(route.presentationDeferred, true);
    assert.equal(route.backendContractOnly, true);
    assert.equal(route.futureMission, "G8-01+");
  });

  it("builds Cockpit identity authorization view from summary", () => {
    seedIdentityPlatform();
    const overview = getIdentityPlatformOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getIdentityPlatformSummary({ workspaceId: CANONICAL_WORKSPACE_ID });
    const view = buildCockpitIdentityAuthorizationView({ overview, summary });
    assert.equal(view.dataMode, "identity-authorization");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.equal(view.summary.providerCount, 13);
  });

  it("supports identity authorization plugins without core modification", () => {
    seedIdentityPlatform();
    const registered = registerIdentityAuthorizationPlugin({
      manifest: {
        pluginId: "test-oauth-plugin",
        pluginName: "Test OAuth Plugin",
        pluginKind: "oauth_provider",
        pillowGovernance: true,
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    assert.equal(listIdentityAuthorizationPlugins().length, 1);
  });

  it("redacts identity authorization secrets", () => {
    const redacted = redactIdentityAuthorizationSecrets({
      api_key: "sk_live_secret",
      provider: "stripe",
      token: "oauth_token_value",
    }) as Record<string, unknown>;
    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.token, "[REDACTED]");
    assert.equal(redacted.provider, "stripe");
  });

  it("reports overall readiness after platform load", () => {
    seedIdentityPlatform();
    const readiness = getOverallReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(readiness.readinessPercentage >= 0);
    assert.equal(readiness.connectionCount, 13);
    assert.equal(readiness.programmeStatus, "identity-authorization-platform-foundation-established");
    const health = getIdentityHealth({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(typeof health.score === "number");
    assert.equal(health.providerCount, 13);
  });

  it("lists identity providers after bootstrap", () => {
    seedIdentityPlatform();
    const providers = listIdentityProviders({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(providers.length, 13);
    assert.ok(providers.some((p) => p.providerId === "amazon"));
    assert.ok(providers.some((p) => p.providerId === "cjdropshipping"));
  });
});
