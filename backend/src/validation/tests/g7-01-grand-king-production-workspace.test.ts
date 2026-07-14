import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GRAND_KING_PRODUCTION_WORKSPACE_VERSION,
  PRODUCTION_WORKSPACE_EKLS_KINDS,
  WORKSPACE_STATUSES,
  activateGrandKingProductionWorkspace,
  blockGrandKingProductionWorkspace,
  buildCockpitProductionWorkspaceView,
  createGrandKingProductionWorkspace,
  createGrandKingProductionWorkspaceModuleContract,
  getGrandKingProductionWorkspace,
  getProductionWorkspaceOverview,
  getWorkspaceConfiguration,
  getWorkspaceDependencies,
  getWorkspaceHealth,
  getWorkspaceReadiness,
  getWorkspaceSummary,
  grandKingProductionWorkspaceTools,
  isValidWorkspaceTransition,
  listProductionWorkspaceEklsKinds,
  listProductionWorkspacePlugins,
  listProductionWorkspaceRegistryIds,
  registerProductionWorkspacePlugin,
  resetGrandKingProductionWorkspaceHarnessForTests,
  searchProductionWorkspaceEklsObservations,
  validateProductionWorkspacePillowGovernance,
  validateWorkspaceOwnership,
} from "../../orchestration/grand-king-production-workspace/index.js";
import { resetGrandKingLiveOperationsHarnessForTests } from "../../orchestration/grand-king-live-operations/index.js";
import {
  resetProductionCertificationHarnessForTests,
  runFinalProductionReadinessCertification,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  ownerId: "grand-king",
  pillowGovernance: true as const,
};

async function seedProductionReadiness(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  resetGrandKingProductionWorkspaceHarnessForTests();
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
  await runFinalProductionReadinessCertification({
    context: { workspaceId: "ws-foundation" },
    actorId: TEST_ACTOR.actorId,
    workspaceId: "ws-foundation",
    pillowGovernance: true,
  });
}

async function seedWorkspace(): Promise<void> {
  await seedProductionReadiness();
  createGrandKingProductionWorkspace({
    context: { workspaceId: CANONICAL_WORKSPACE_ID },
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
}

describe("G7-01 — Grand King Production Workspace", () => {
  it("exposes production workspace framework version and states", () => {
    assert.equal(GRAND_KING_PRODUCTION_WORKSPACE_VERSION, "g7-01-v1");
    assert.ok(WORKSPACE_STATUSES.includes("active"));
    assert.ok(WORKSPACE_STATUSES.includes("ready"));
    assert.equal(WORKSPACE_STATUSES.length, 9);
  });

  it("registers grand-king-production-workspace Brain module contract", () => {
    const contract = createGrandKingProductionWorkspaceModuleContract();
    assert.equal(contract.moduleId, "grand-king-production-workspace");
    assert.equal(contract.missionId, "G7-01");
    assert.equal(contract.programmeStatus, "production-workspace-established");
    assert.ok(contract.capabilities.includes("grand-king-production-workspace.overview"));
  });

  it("creates canonical Grand King production workspace from registry", async () => {
    await seedWorkspace();
    const workspace = getGrandKingProductionWorkspace();
    assert.equal(workspace.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.equal(workspace.workspaceName, "Grand King");
    assert.equal(workspace.workspaceType, "executive");
    assert.equal(workspace.ownerId, "grand-king");
    assert.equal(workspace.environment, "production");
    assert.deepEqual(workspace.brandIds, ["brand-luminousyou"]);
    assert.ok(workspace.readinessReference);
    assert.ok(workspace.commerceReference);
    assert.ok(workspace.automationReference);
    assert.ok(workspace.identityReference);
    assert.ok(Array.isArray(workspace.providerReferences));
    assert.ok(workspace.createdAt);
    assert.ok(workspace.updatedAt);
    assert.ok(workspace.correlationId);
    assert.ok(workspace.governanceState);
  });

  it("enforces single Grand King workspace ownership", () => {
    const valid = validateWorkspaceOwnership({
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.singleWorkspaceEnforced, true);

    const invalid = validateWorkspaceOwnership({
      workspaceId: "ws-customer-1",
      ownerId: "grand-king",
    });
    assert.equal(invalid.valid, false);
    assert.match(invalid.reason, /customer workspaces excluded/i);
  });

  it("validates workspace lifecycle state transitions", () => {
    assert.equal(isValidWorkspaceTransition("ready", "active"), true);
    assert.equal(isValidWorkspaceTransition("active", "paused"), true);
    assert.equal(isValidWorkspaceTransition("active", "maintenance"), true);
    assert.equal(isValidWorkspaceTransition("archived", "active"), false);
  });

  it("activates workspace when readiness passes", async () => {
    await seedWorkspace();
    const readiness = getWorkspaceReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.ready, true);

    const activated = activateGrandKingProductionWorkspace({
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      pillowGovernance: true,
    });
    assert.equal(activated.status, "active");
  });

  it("evaluates workspace readiness from G6 and G7-00 integration", async () => {
    await seedWorkspace();
    const readiness = getWorkspaceReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.productionEligible, true);
    assert.equal(readiness.ready, true);
    assert.notEqual(readiness.certificationReference, "none");
  });

  it("blocks workspace readiness when governance signal active", async () => {
    await seedProductionReadiness();
    process.env.WORKSPACE_READINESS_BLOCKED = "true";
    const readiness = getWorkspaceReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.ready, false);
    assert.ok(readiness.conditions.some((c) => c.includes("governance signal")));
  });

  it("evaluates workspace health including degraded signal", async () => {
    await seedWorkspace();
    activateGrandKingProductionWorkspace({
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      pillowGovernance: true,
    });

    const healthy = getWorkspaceHealth({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(healthy.healthy, true);
    assert.ok(healthy.score >= 70);

    process.env.WORKSPACE_HEALTH_DEGRADED = "true";
    const degraded = getWorkspaceHealth({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(degraded.status, "degraded");
    assert.equal(degraded.healthy, false);
  });

  it("registers all required production workspace Brain tools", () => {
    const names = new Set(grandKingProductionWorkspaceTools.map((tool) => tool.name));
    for (const toolName of [
      "workspace_overview",
      "workspace_status",
      "workspace_health",
      "workspace_readiness",
      "workspace_configuration",
      "workspace_dependencies",
      "workspace_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for production workspace operations", async () => {
    await seedWorkspace();
    const result = validateProductionWorkspacePillowGovernance({
      ...TEST_ACTOR,
      operation: "activate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.workspaceOwnership, true);
    assert.equal(result.productionAuthority, true);
    assert.equal(result.environmentIntegrity, true);
    assert.equal(result.workspaceIsolation, true);
    assert.equal(result.constitutionalCompliance, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("rejects Pillow governance for non-Grand-King owner", () => {
    const result = validateProductionWorkspacePillowGovernance({
      actorId: "other-actor",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "other-owner",
      operation: "configure",
      pillowGovernance: true,
    });
    assert.equal(result.allowed, false);
  });

  it("records production workspace EKLS observations through Pillow", async () => {
    await seedWorkspace();
    assert.deepEqual(listProductionWorkspaceEklsKinds(), [...PRODUCTION_WORKSPACE_EKLS_KINDS]);

    activateGrandKingProductionWorkspace({
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      pillowGovernance: true,
    });

    const created = searchProductionWorkspaceEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "workspace_created",
      pillowGovernance: true,
    });
    assert.ok(created.length >= 1);

    const activated = searchProductionWorkspaceEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "workspace_activated",
      pillowGovernance: true,
    });
    assert.ok(activated.length >= 1);
  });

  it("records workspace blocked and health-changed EKLS observations", async () => {
    await seedWorkspace();
    blockGrandKingProductionWorkspace({
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      reason: "Governance hold",
      pillowGovernance: true,
    });

    const blocked = searchProductionWorkspaceEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "workspace_blocked",
      pillowGovernance: true,
    });
    assert.ok(blocked.length >= 1);

    const healthChanged = searchProductionWorkspaceEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "workspace_health_changed",
      pillowGovernance: true,
    });
    assert.ok(healthChanged.length >= 1);
  });

  it("exposes Cockpit production workspace backend contract", async () => {
    await seedWorkspace();
    const workspace = getGrandKingProductionWorkspace();
    const overview = getProductionWorkspaceOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const health = getWorkspaceHealth({ workspaceId: CANONICAL_WORKSPACE_ID });
    const readiness = getWorkspaceReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dependencies = getWorkspaceDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getWorkspaceSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitProductionWorkspaceView({
      overview,
      workspace,
      health,
      readiness,
      dependencies,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-production-workspace");
    assert.equal(view.dataMode, "production");
    assert.equal(view.workspaceConfiguration.workspaceName, "Grand King");
    assert.ok(view.workspaceDependencies.connectionProviders.length >= 2);
  });

  it("lists production workspace registry ids", () => {
    const ids = listProductionWorkspaceRegistryIds();
    assert.equal(ids.length, 4);
    assert.ok(ids.includes("REG-WORKSPACE"));
    assert.ok(ids.includes("REG-READINESS-POLICY"));
    assert.ok(ids.includes("REG-CONNECTION-PROVIDER"));
    assert.ok(ids.includes("REG-IDENTITY-PROVIDER"));
  });

  it("supports production workspace plugins without modifying core", async () => {
    await seedWorkspace();
    for (const pluginKind of ["validator", "health", "configuration", "monitoring"] as const) {
      const result = registerProductionWorkspacePlugin({
        manifest: {
          pluginId: `test-${pluginKind}`,
          pluginName: `Test ${pluginKind}`,
          pluginKind,
          pillowGovernance: true,
        },
        actorId: TEST_ACTOR.actorId,
        workspaceId: CANONICAL_WORKSPACE_ID,
        ownerId: TEST_ACTOR.ownerId,
        pillowGovernance: true,
      });
      assert.equal(result.accepted, true);
    }
    assert.equal(listProductionWorkspacePlugins().length, 4);
  });

  it("resolves workspace configuration from registry dependencies", async () => {
    await seedWorkspace();
    const configuration = getWorkspaceConfiguration({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(configuration.config.workspaceName, "Grand King");
    assert.equal(configuration.config.primaryBrand, "LuminousYou");
    assert.equal(configuration.dependencies.commercePolicy, "REG-COMMERCE-POLICY");
    assert.equal(configuration.dependencies.automationWorkflow, "REG-AUTOMATION-WORKFLOW");
  });

  it("does not expose credentials or secrets in workspace output", async () => {
    await seedWorkspace();
    const workspace = getGrandKingProductionWorkspace();
    const configuration = getWorkspaceConfiguration({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify({ workspace, configuration });
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("secret"), false);
  });
});
