import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS,
} from "../../registry/types/registry-ids.js";
import {
  ConnectionRegistryValidationError,
  validateConnectionProviderRows,
} from "../../registry/validation/connection-registry-validator.js";
import { CONNECTION_PROVIDER_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-provider-seed.js";
import {
  CONNECTION_REGISTRY_EKLS_KINDS,
  CONNECTION_REGISTRY_FOUNDATION_VERSION,
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_STATUSES,
  READINESS_STATES,
  buildCockpitConnectionRegistryView,
  connectionRegistryTools,
  createCockpitAuthorizationCentreRouteRegistration,
  createConnectionRegistryModuleContract,
  getConnectionCapabilities,
  getConnectionDependencies,
  getConnectionProviderDetail,
  getConnectionRegistryList,
  getConnectionRequirements,
  getWorkspaceConnectionProfile,
  initializeConnectionRegistry,
  listConnectionRegistryEklsKinds,
  listConnectionRegistryIds,
  listConnectionRegistryPlugins,
  redactConnectionRegistrySecrets,
  registerConnectionRegistryPlugin,
  resetConnectionRegistryHarnessForTests,
  resolveAllConnectionProviders,
  resolveConnectionDependencies,
  resolveConnectionRequirements,
  resolveProviderCapabilities,
  resolveWorkspaceConnectionProfile,
  searchConnectionRegistryEklsObservations,
  validateConnectionRegistryPillowGovernance,
} from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  pillowGovernance: true as const,
};

function seedConnectionRegistry() {
  resetConnectionRegistryHarnessForTests();
  return initializeConnectionRegistry(TEST_ACTOR);
}

describe("G8-01 — Connection Registry Foundation", () => {
  it("exposes connection registry foundation version and status models", () => {
    assert.equal(CONNECTION_REGISTRY_FOUNDATION_VERSION, "g8-01-v1");
    assert.equal(CONNECTION_REGISTRY_PROVIDER_IDS.length, 15);
    assert.equal(CONNECTION_STATUSES.length, 11);
    assert.equal(READINESS_STATES.length, 9);
    assert.equal(CONNECTION_REGISTRY_EKLS_KINDS.length, 5);
  });

  it("registers connection-registry Brain module contract", () => {
    const contract = createConnectionRegistryModuleContract();
    assert.equal(contract.moduleId, "connection-registry");
    assert.equal(contract.missionId, "G8-01");
    assert.equal(contract.programmeStatus, "connection-registry-foundation-established");
    assert.ok(contract.integratesWith.includes("identity-authorization"));
  });

  it("lists all eight canonical connection registries", () => {
    resetConnectionRegistryHarnessForTests();
    const ids = listConnectionRegistryIds();
    assert.equal(ids.length, 8);
    for (const id of CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS) {
      assert.ok(ids.includes(id), `Missing registry: ${id}`);
    }
  });

  it("validates connection provider schema and rejects duplicates", () => {
    resetConnectionRegistryHarnessForTests();
    validateConnectionProviderRows(CONNECTION_PROVIDER_SEED_ROWS);
    const duplicate = [
      ...CONNECTION_PROVIDER_SEED_ROWS,
      {
        ...CONNECTION_PROVIDER_SEED_ROWS[0]!,
        id: "duplicate-provider",
      },
    ];
    assert.throws(
      () => validateConnectionProviderRows(duplicate),
      ConnectionRegistryValidationError,
    );
  });

  it("seeds fifteen foundation connection providers as registry rows", () => {
    resetConnectionRegistryHarnessForTests();
    const providers = resolveAllConnectionProviders({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(providers.length, 15);
    for (const provider of providers) {
      assert.equal(provider.registrySource, "REG-CONNECTION-PROVIDER");
      assert.ok(provider.displayName);
      assert.ok(provider.providerCategory);
      assert.ok(provider.governancePolicy);
      assert.ok(provider.readinessPolicy);
      assert.ok(provider.supportedConnectionTypes.length >= 1);
    }
    assert.ok(providers.some((p) => p.providerId === "email-provider"));
    assert.ok(providers.some((p) => p.providerId === "domain-provider"));
  });

  it("resolves connection requirements from registry", () => {
    resetConnectionRegistryHarnessForTests();
    const requirements = resolveConnectionRequirements({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(requirements.length, 15);
    for (const req of requirements) {
      assert.ok(req.requirementId);
      assert.ok(req.connectionTypeRef.startsWith("connection:"));
      assert.ok(req.requiredScopes.length >= 1);
    }
  });

  it("resolves provider capabilities from registry", () => {
    resetConnectionRegistryHarnessForTests();
    const capabilities = resolveProviderCapabilities({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(capabilities.length, 15);
    for (const cap of capabilities) {
      assert.ok(cap.capabilityId);
      assert.ok(cap.capabilityKey);
      assert.ok(cap.supportedEnvironments.length >= 1);
    }
  });

  it("resolves connection dependencies from registry", () => {
    resetConnectionRegistryHarnessForTests();
    const dependencies = resolveConnectionDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(dependencies.length, 15);
    for (const dep of dependencies) {
      assert.ok(dep.dependencyId);
      assert.ok(dep.dependsOnRegistryRef || dep.dependsOnProviderId);
    }
  });

  it("resolves workspace connection profile from registry", () => {
    resetConnectionRegistryHarnessForTests();
    const profile = resolveWorkspaceConnectionProfile(
      { workspaceId: CANONICAL_WORKSPACE_ID, accountHolderId: "grand-king" },
      { workspaceId: CANONICAL_WORKSPACE_ID },
    );
    assert.equal(profile.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.equal(profile.accountHolderId, "grand-king");
    assert.equal(profile.providerCount, 15);
    assert.equal(profile.connectionTypeCount, 15);
    assert.equal(profile.requirementCount, 15);
    assert.equal(profile.capabilityCount, 15);
    assert.equal(profile.dependencyCount, 15);
  });

  it("initializes connection registry and records EKLS learning events", () => {
    seedConnectionRegistry();
    assert.deepEqual(listConnectionRegistryEklsKinds(), [...CONNECTION_REGISTRY_EKLS_KINDS]);
    const observations = searchConnectionRegistryEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "connection_provider_registered"));
    assert.ok(observations.some((o) => o.kind === "connection_requirement_defined"));
    assert.ok(observations.some((o) => o.kind === "connection_capability_defined"));
  });

  it("passes Pillow governance for connection registry operations", () => {
    const result = validateConnectionRegistryPillowGovernance({
      ...TEST_ACTOR,
      operation: "resolve",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.workspaceOwnership, true);
    assert.equal(result.registryCompliance, true);
    assert.equal(result.permissionBoundary, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("blocks ineligible providers through Pillow governance", () => {
    const result = validateConnectionRegistryPillowGovernance({
      ...TEST_ACTOR,
      providerId: "unknown-provider",
      operation: "resolve",
    });
    assert.equal(result.allowed, false);
    assert.equal(result.providerEligibility, false);
  });

  it("registers all required connection registry Brain tools", () => {
    const names = new Set(connectionRegistryTools.map((tool) => tool.name));
    for (const toolName of [
      "connection_registry_list",
      "connection_provider_detail",
      "connection_requirements",
      "connection_capabilities",
      "connection_dependencies",
      "workspace_connection_profile",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("returns registry-derived provider detail without secrets", () => {
    seedConnectionRegistry();
    const provider = getConnectionProviderDetail("stripe", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(provider);
    assert.equal(provider!.displayName, "Stripe");
    assert.equal(provider!.providerCategory, "payment");
    assert.equal(provider!.supportsOAuth, true);
    const redacted = redactConnectionRegistrySecrets({ api_key: "sk_live_test", name: "stripe" }) as Record<
      string,
      unknown
    >;
    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.name, "stripe");
  });

  it("exposes Authorization Centre Cockpit backend contract only", () => {
    const route = createCockpitAuthorizationCentreRouteRegistration();
    assert.equal(route.label, "Authorization Centre");
    assert.equal(route.presentationDeferred, true);
    assert.equal(route.futureMission, "G8-05");
  });

  it("builds Cockpit connection registry view from workspace profile", () => {
    seedConnectionRegistry();
    const profile = getWorkspaceConnectionProfile(
      { ...TEST_ACTOR, accountHolderId: "grand-king" },
      { workspaceId: CANONICAL_WORKSPACE_ID },
    );
    const view = buildCockpitConnectionRegistryView({ profile });
    assert.equal(view.dataMode, "connection-registry");
    assert.equal(view.profile.providerCount, 15);
  });

  it("supports connection registry plugins without core modification", () => {
    seedConnectionRegistry();
    const registered = registerConnectionRegistryPlugin({
      manifest: {
        pluginId: "test-connection-provider",
        pluginName: "Test Connection Provider",
        pluginKind: "connection_provider",
        pillowGovernance: true,
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    assert.equal(listConnectionRegistryPlugins().length, 1);
  });

  it("lists connection providers through service layer", () => {
    seedConnectionRegistry();
    const list = getConnectionRegistryList({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(list.length, 15);
    const requirements = getConnectionRequirements({ workspaceId: CANONICAL_WORKSPACE_ID });
    const capabilities = getConnectionCapabilities({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dependencies = getConnectionDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(requirements.length, 15);
    assert.equal(capabilities.length, 15);
    assert.equal(dependencies.length, 15);
  });
});
