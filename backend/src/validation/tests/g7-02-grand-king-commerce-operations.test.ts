import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMERCE_OPERATION_STATES,
  COMMERCE_OPERATIONS_EKLS_KINDS,
  GRAND_KING_COMMERCE_OPERATIONS_VERSION,
  buildCockpitCommerceOperationsView,
  createGrandKingCommerceOperationsModuleContract,
  getCommerceOperationDependencies,
  getCommerceOperationHealth,
  getCommerceOperationSummary,
  getCommerceOperationsOverview,
  getExecutiveCommerceDashboard,
  grandKingCommerceOperationsTools,
  initializeCommerceOperations,
  isValidCommerceOperationTransition,
  listCommerceOperationsEklsKinds,
  listCommerceOperationsPlugins,
  listCommerceOperationsRegistryIds,
  pauseCommerceOperation,
  registerCommerceOperationsPlugin,
  resetGrandKingCommerceOperationsHarnessForTests,
  resolveProviderOperations,
  resumeCommerceOperation,
  searchCommerceOperationsEklsObservations,
  startCommerceOperation,
  stopCommerceOperation,
  validateCommerceOperationsPillowGovernance,
  validateCommerceReadiness,
} from "../../orchestration/grand-king-commerce-operations/index.js";
import { resetGrandKingLiveOperationsHarnessForTests } from "../../orchestration/grand-king-live-operations/index.js";
import {
  activateGrandKingProductionWorkspace,
  createGrandKingProductionWorkspace,
  resetGrandKingProductionWorkspaceHarnessForTests,
} from "../../orchestration/grand-king-production-workspace/index.js";
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

const SUPPORTED_PROVIDERS = ["amazon", "shopify", "stripe", "cjdropshipping", "meta", "google", "tiktok"];

async function seedProductionStack(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  resetGrandKingProductionWorkspaceHarnessForTests();
  resetGrandKingCommerceOperationsHarnessForTests();
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
  await runFinalProductionReadinessCertification({
    context: { workspaceId: "ws-foundation" },
    actorId: TEST_ACTOR.actorId,
    workspaceId: "ws-foundation",
    pillowGovernance: true,
  });
  createGrandKingProductionWorkspace({
    context: { workspaceId: CANONICAL_WORKSPACE_ID },
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
  activateGrandKingProductionWorkspace({
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
}

async function seedCommerceOperations() {
  await seedProductionStack();
  return initializeCommerceOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-02 — Grand King Commerce Operations", () => {
  it("exposes commerce operations framework version and states", () => {
    assert.equal(GRAND_KING_COMMERCE_OPERATIONS_VERSION, "g7-02-v1");
    assert.ok(COMMERCE_OPERATION_STATES.includes("running"));
    assert.ok(COMMERCE_OPERATION_STATES.includes("ready"));
    assert.equal(COMMERCE_OPERATION_STATES.length, 11);
  });

  it("registers grand-king-commerce-operations Brain module contract", () => {
    const contract = createGrandKingCommerceOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-commerce-operations");
    assert.equal(contract.missionId, "G7-02");
    assert.equal(contract.programmeStatus, "commerce-operations-established");
    assert.ok(contract.capabilities.includes("grand-king-commerce-operations.start"));
  });

  it("resolves provider operations from REG-CONNECTION-PROVIDER", async () => {
    await seedProductionStack();
    const providers = resolveProviderOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(providers.length, 7);
    for (const providerId of SUPPORTED_PROVIDERS) {
      assert.ok(providers.some((provider) => provider.providerId === providerId), `Missing provider: ${providerId}`);
    }
  });

  it("initializes commerce operations with full contract fields", async () => {
    const run = await seedCommerceOperations();
    assert.equal(run.operations.length, 7);
    for (const op of run.operations) {
      assert.ok(op.operationId);
      assert.equal(op.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.equal(op.brandId, "brand-luminousyou");
      assert.ok(op.providerId);
      assert.ok(op.channelType);
      assert.ok(op.operationType);
      assert.ok(op.status);
      assert.ok(op.readinessReference);
      assert.ok(op.authorizationReference);
      assert.ok(op.automationReference);
      assert.ok(op.healthReference);
      assert.ok(Array.isArray(op.evidence));
      assert.ok(Array.isArray(op.risks));
      assert.ok(Array.isArray(op.blockers));
      assert.ok(op.startedAt);
      assert.ok(op.updatedAt);
      assert.ok(op.correlationId);
      assert.ok(op.governanceState);
    }
  });

  it("validates commerce readiness from G6, G7-00, and G7-01", async () => {
    await seedProductionStack();
    const readiness = validateCommerceReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.ready, true);
    assert.equal(readiness.productionEligible, true);
    assert.equal(readiness.authorizationReference, "grand-king-identity");
  });

  it("blocks commerce readiness when governance signal active", async () => {
    await seedProductionStack();
    process.env.COMMERCE_READINESS_BLOCKED = "true";
    const readiness = validateCommerceReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.ready, false);
  });

  it("validates commerce operation lifecycle transitions", () => {
    assert.equal(isValidCommerceOperationTransition("ready", "starting"), true);
    assert.equal(isValidCommerceOperationTransition("running", "paused"), true);
    assert.equal(isValidCommerceOperationTransition("running", "stopping"), true);
    assert.equal(isValidCommerceOperationTransition("completed", "running"), false);
  });

  it("supports start, pause, resume, and stop lifecycle", async () => {
    const run = await seedCommerceOperations();
    const target = run.operations.find((op) => op.status === "ready");
    assert.ok(target);

    const started = startCommerceOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(started.status, "running");

    const paused = pauseCommerceOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(paused.status, "paused");

    const resumed = resumeCommerceOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(resumed.status, "running");

    const stopped = stopCommerceOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(stopped.status, "stopped");
  });

  it("registers all required commerce operations Brain tools", () => {
    const names = new Set(grandKingCommerceOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "commerce_operations_overview",
      "commerce_operation_status",
      "start_commerce_operation",
      "pause_commerce_operation",
      "resume_commerce_operation",
      "stop_commerce_operation",
      "commerce_operation_health",
      "commerce_operation_dependencies",
      "commerce_operation_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for commerce operations", async () => {
    await seedProductionStack();
    const result = validateCommerceOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "start",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.productionEligibility, true);
    assert.equal(result.workspaceAuthority, true);
    assert.equal(result.operationAuthority, true);
    assert.equal(result.riskPolicy, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records commerce operation EKLS observations through Pillow", async () => {
    const run = await seedCommerceOperations();
    assert.deepEqual(listCommerceOperationsEklsKinds(), [...COMMERCE_OPERATIONS_EKLS_KINDS]);
    const target = run.operations.find((op) => op.status === "ready");
    assert.ok(target);

    startCommerceOperation({ ...TEST_ACTOR, operationId: target!.operationId });

    const search = searchCommerceOperationsEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "commerce_operation_started",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit commerce operations backend contract", async () => {
    const run = await seedCommerceOperations();
    const overview = getCommerceOperationsOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dependencies = getCommerceOperationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = getExecutiveCommerceDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getCommerceOperationSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitCommerceOperationsView({
      overview,
      operations: run.operations,
      ...dashboard,
      dependencies,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-commerce-operations");
    assert.equal(view.dataMode, "live");
    assert.equal(view.marketplaceStatus.channelType, "marketplace");
    assert.equal(view.storefrontStatus.channelType, "storefront");
    assert.equal(view.paymentStatus.channelType, "payment");
    assert.equal(
      view.analyticsStatus.operationCount,
      run.operations.filter((op) => op.channelType === "analytics").length,
    );
  });

  it("lists commerce operations registry ids", () => {
    const ids = listCommerceOperationsRegistryIds();
    assert.equal(ids.length, 5);
    assert.ok(ids.includes("REG-CONNECTION-PROVIDER"));
    assert.ok(ids.includes("REG-IDENTITY-PROVIDER"));
    assert.ok(ids.includes("REG-COMMERCE-POLICY"));
  });

  it("supports commerce operations plugins without modifying core", async () => {
    await seedCommerceOperations();
    for (const pluginKind of ["marketplace", "supplier", "payment", "logistics", "analytics", "controller"] as const) {
      const result = registerCommerceOperationsPlugin({
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
    assert.equal(listCommerceOperationsPlugins().length, 6);
  });

  it("evaluates commerce operation health", async () => {
    const run = await seedCommerceOperations();
    const target = run.operations.find((op) => op.status === "ready");
    assert.ok(target);
    startCommerceOperation({ ...TEST_ACTOR, operationId: target!.operationId });
    const health = getCommerceOperationHealth(target!.operationId);
    assert.equal(health.healthy, true);
    assert.ok(health.score >= 70);
  });

  it("does not expose credentials or secrets in commerce operation output", async () => {
    const run = await seedCommerceOperations();
    const dependencies = getCommerceOperationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify({ run, dependencies });
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("secret"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
