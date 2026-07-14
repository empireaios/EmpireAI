import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GRAND_KING_LIVE_OPERATIONS_VERSION,
  LIVE_OPERATION_STATES,
  LIVE_OPERATIONS_EKLS_KINDS,
  buildCockpitLiveOperationsView,
  createGrandKingLiveOperationsModuleContract,
  grandKingLiveOperationsTools,
  initializeLiveOperations,
  isValidLiveOperationTransition,
  listLiveOperationsEklsKinds,
  listLiveOperationsRegistryIds,
  getLiveOperationsOverview,
  pauseLiveOperation,
  resetGrandKingLiveOperationsHarnessForTests,
  resolveLiveOperationDomains,
  resolveGrandKingOperatingProfile,
  resumeLiveOperation,
  searchLiveOperationsEklsObservations,
  startLiveOperation,
  validateLiveOperationsPillowGovernance,
  validateProductionEligibilityGate,
} from "../../orchestration/grand-king-live-operations/index.js";
import {
  resetProductionCertificationHarnessForTests,
  runFinalProductionReadinessCertification,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  accountHolderId: "grand-king",
  pillowGovernance: true as const,
};

function configureLiveOpsTestEnvironment(): void {
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
}

async function seedProductionReadiness(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  configureLiveOpsTestEnvironment();
  await runFinalProductionReadinessCertification({
    context: { workspaceId: TEST_ACTOR.workspaceId },
    actorId: TEST_ACTOR.actorId,
    workspaceId: TEST_ACTOR.workspaceId,
    pillowGovernance: true,
  });
}

describe("G7-00 — Grand King Live Operations Framework", () => {
  it("exposes live operations framework version and states", () => {
    assert.equal(GRAND_KING_LIVE_OPERATIONS_VERSION, "g7-00-v1");
    assert.ok(LIVE_OPERATION_STATES.includes("active"));
    assert.ok(LIVE_OPERATION_STATES.includes("paused"));
    assert.equal(LIVE_OPERATION_STATES.length, 10);
  });

  it("registers grand-king-live-operations Brain module contract", () => {
    const contract = createGrandKingLiveOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-live-operations");
    assert.equal(contract.missionId, "G7-10");
    assert.equal(contract.programmeStatus, "live-operations-version-1-certified");
    assert.ok(contract.capabilities.includes("grand-king-live-operations.start"));
  });

  it("resolves live operation domains from REG-LIVE-OPERATIONS-DOMAIN", async () => {
    await seedProductionReadiness();
    const domains = resolveLiveOperationDomains({ workspaceId: TEST_ACTOR.workspaceId });
    assert.ok(domains.length >= 11);
    assert.ok(domains.some((d) => d.domainId === "grand_king_account"));
    assert.ok(domains.some((d) => d.domainId === "luminousyou_brand"));
    assert.ok(domains.some((d) => d.domainId === "amazon_operations"));
  });

  it("resolves Grand King operating profile from registry", async () => {
    await seedProductionReadiness();
    const profile = resolveGrandKingOperatingProfile({ workspaceId: TEST_ACTOR.workspaceId });
    assert.equal(profile.accountHolderId, "grand-king");
    assert.equal(profile.brandName, "LuminousYou");
    assert.equal(profile.isProductionOperator, true);
  });

  it("validates live operation contract fields on initialization", async () => {
    await seedProductionReadiness();
    const run = initializeLiveOperations({ workspaceId: TEST_ACTOR.workspaceId });
    assert.ok(run.operations.length >= 11);
    for (const op of run.operations) {
      assert.ok(op.operationId);
      assert.ok(op.workspaceId);
      assert.ok(op.accountHolderId);
      assert.ok(op.companyId);
      assert.ok(op.brandId);
      assert.ok(op.environment);
      assert.ok(op.operationType);
      assert.ok(op.status);
      assert.ok(op.readinessReference);
      assert.ok(op.certificationReference);
      assert.ok(Array.isArray(op.providerReferences));
      assert.ok(Array.isArray(op.automationReferences));
      assert.ok(Array.isArray(op.commerceReferences));
      assert.ok(Array.isArray(op.evidence));
      assert.ok(op.startedAt);
      assert.ok(op.updatedAt);
      assert.ok(op.correlationId);
      assert.ok(op.governanceState);
    }
  });

  it("enforces production eligibility gate from G6 certification", async () => {
    await seedProductionReadiness();
    const gate = validateProductionEligibilityGate({ workspaceId: TEST_ACTOR.workspaceId });
    assert.equal(gate.eligible, true);
    assert.notEqual(gate.certificationReference, "none");
  });

  it("blocks live operations when production eligibility signal active", async () => {
    resetGrandKingLiveOperationsHarnessForTests();
    process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "true";
    const gate = validateProductionEligibilityGate({ workspaceId: TEST_ACTOR.workspaceId });
    assert.equal(gate.eligible, false);
    process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
  });

  it("validates live operation state transitions", () => {
    assert.equal(isValidLiveOperationTransition("ready", "active"), true);
    assert.equal(isValidLiveOperationTransition("active", "paused"), true);
    assert.equal(isValidLiveOperationTransition("paused", "active"), true);
    assert.equal(isValidLiveOperationTransition("completed", "active"), false);
  });

  it("supports start, pause, and resume state transitions", async () => {
    await seedProductionReadiness();
    const run = initializeLiveOperations({ workspaceId: TEST_ACTOR.workspaceId });
    const target = run.operations.find((op) => op.status === "ready");
    assert.ok(target);

    const started = startLiveOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(started.status, "active");

    const paused = pauseLiveOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(paused.status, "paused");

    const resumed = resumeLiveOperation({
      ...TEST_ACTOR,
      operationId: target!.operationId,
    });
    assert.equal(resumed.status, "active");
  });

  it("registers all required live operations Brain tools", () => {
    const names = new Set(grandKingLiveOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "live_operations_overview",
      "live_operation_status",
      "start_live_operation",
      "pause_live_operation",
      "resume_live_operation",
      "block_live_operation",
      "live_operation_evidence",
      "live_operation_risks",
      "live_operation_next_action",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for live operations", async () => {
    await seedProductionReadiness();
    const result = validateLiveOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "start",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.liveOperationAuthority, true);
    assert.equal(result.grandKingAccountBoundary, true);
  });

  it("records live operation EKLS observations through Pillow", async () => {
    await seedProductionReadiness();
    assert.deepEqual(listLiveOperationsEklsKinds(), [...LIVE_OPERATIONS_EKLS_KINDS]);
    const run = initializeLiveOperations({ workspaceId: TEST_ACTOR.workspaceId });
    const target = run.operations.find((op) => op.status === "ready");
    assert.ok(target);
    startLiveOperation({ ...TEST_ACTOR, operationId: target!.operationId });

    const search = searchLiveOperationsEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "live_operation_started",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit live operations backend contract", async () => {
    await seedProductionReadiness();
    const run = initializeLiveOperations({ workspaceId: TEST_ACTOR.workspaceId });
    const overview = getLiveOperationsOverview({ workspaceId: TEST_ACTOR.workspaceId });
    const view = buildCockpitLiveOperationsView({ overview, run, nextActions: ["Monitor active operations"] });
    assert.equal(view.viewId, "cockpit-grand-king-live-operations");
    assert.equal(view.dataMode, "live");
    assert.ok(view.liveOperationStatus.length >= 11);
  });

  it("lists live operations registry ids", async () => {
    await seedProductionReadiness();
    const ids = listLiveOperationsRegistryIds();
    assert.equal(ids.length, 2);
    assert.ok(ids.includes("REG-LIVE-OPERATIONS-DOMAIN"));
    assert.ok(ids.includes("REG-LIVE-OPERATIONS-PROFILE"));
  });

  it("does not expose credentials or secrets in live operation output", async () => {
    await seedProductionReadiness();
    const run = initializeLiveOperations({ workspaceId: TEST_ACTOR.workspaceId });
    const serialized = JSON.stringify(run);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
