import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  REGISTRY_RULES,
  REGISTRY_VERSION,
  WORKER_STATES,
  WRG_CAPABILITIES,
  buildWorkerRegistryConfiguration,
  createWorkerRegistry,
  resetWorkerRegistryForTesting,
} from "../../worker-registry/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerRegistry>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerRegistry(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerRegistry();
  return engine;
}

describe("Q1-07 Worker Registry", () => {
  beforeEach(resetWorkerRegistryForTesting);

  test("1 locks mandatory worker-registry boundaries", () => {
    const c = buildWorkerRegistryConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkforceCapabilityRegistry: false as never,
      neverReplaceOrganizationCharter: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkforceCapabilityRegistry, true);
    assert.equal(c.neverReplaceOrganizationCharter, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WRG-001 for Q1-07", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-07");
    assert.equal(state.engineVersion, "PILLOW-WRG-001");
    assert.equal(state.health.registryVersion, REGISTRY_VERSION);
    for (const rule of REGISTRY_RULES) {
      assert.ok(state.configuration.registryRules.includes(rule));
    }
    for (const status of WORKER_STATES) {
      assert.ok(state.configuration.workerStates.includes(status));
    }
  });

  test("3 registers a new AI Worker with unique ID", async () => {
    const report = (await build()).registerWorker({
      workerId: "wkr-media-01",
      workerName: "Media Specialist One",
      workerType: "specialist",
      department: "media",
      factory: "commerce-factory",
      role: "role-specialist-domain",
      reportingLine: ["wkr-media-01", "role-manager-department", "pillow"],
      skillProfile: ["skill-media-content"],
      approvedTools: ["media_studio"],
      authorityLevel: "manager_approval",
      certificationStatus: "certified",
      operationalStatus: "registered",
      validated: true,
    });
    assert.equal(report.action, "register_worker");
    assert.equal(report.matchedWorkers.length, 1);
    assert.equal(report.matchedWorkers[0]!.workerId, "wkr-media-01");
    assert.equal(report.matchedWorkers[0]!.governingAuthority, "pillow");
    assert.ok(report.workers.some((w) => w.workerId === "wkr-media-01"));
  });

  test("4 retrieves a worker by Worker ID", async () => {
    const report = (await build()).getWorker({
      workerId: "wkr-strategy-01",
      validated: true,
    });
    assert.equal(report.action, "get_worker");
    assert.equal(report.matchedWorkers.length, 1);
    assert.equal(report.matchedWorkers[0]!.workerName, "Strategy Analyst One");
    assert.equal(report.matchedWorkers[0]!.role, "role-analyst-strategy");
  });

  test("5 queries workers by department", async () => {
    const report = (await build()).queryByDepartment({
      department: "operations",
      validated: true,
    });
    assert.equal(report.action, "query_by_department");
    assert.ok(report.matchedWorkers.length >= 1);
    assert.ok(report.matchedWorkers.every((w) => w.department === "operations"));
  });

  test("6 queries workers by role and factory", async () => {
    const engine = await build();
    const byRole = engine.queryByRole({
      role: "role-specialist-domain",
      validated: true,
    });
    assert.equal(byRole.action, "query_by_role");
    assert.ok(byRole.matchedWorkers.length >= 2);
    assert.ok(byRole.matchedWorkers.every((w) => w.role === "role-specialist-domain"));

    const byFactory = engine.queryByFactory({
      factory: "commerce-factory",
      validated: true,
    });
    assert.equal(byFactory.action, "query_by_factory");
    assert.ok(byFactory.matchedWorkers.length >= 1);
    assert.ok(byFactory.matchedWorkers.every((w) => w.factory === "commerce-factory"));
  });

  test("7 validates reporting line reaches Pillow", async () => {
    const report = (await build()).validateReportingLine({
      workerId: "wkr-commerce-01",
      validated: true,
    });
    assert.equal(report.action, "validate_reporting_line");
    assert.equal(report.registryDecision, "valid");
    const worker = report.matchedWorkers[0]!;
    assert.ok(worker.reportingLine.includes("pillow"));
    assert.equal(worker.governingAuthority, "pillow");
  });

  test("8 rejects execute / WCR / charter / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.registerWorker({
        workerId: "wkr-x",
        executeWorkerTasks: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.getWorker({
        workerId: "wkr-ops-01",
        replaceWorkforceCapabilityRegistry: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.queryByDepartment({
        department: "operations",
        replaceOrganizationCharter: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateReportingLine({ validated: true, overridePillow: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.produceRegistry({ validated: true, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(WRG_CAPABILITIES.includes("assign_globally_unique_worker_id"));
    assert.ok(WRG_CAPABILITIES.includes("extensible_worker_states"));
  });

  test("9 produces machine-readable worker records", async () => {
    const report = (await build()).produceRegistry({ validated: true });
    const catalog = report.catalog!;
    assert.ok(catalog.registryVersion);
    assert.equal(catalog.governingAuthority, "pillow");
    assert.ok(Array.isArray(catalog.workers));
    assert.ok(catalog.workers.length >= 5);
    const worker = catalog.workers[0]!;
    assert.ok(worker.workerId);
    assert.ok(worker.workerName);
    assert.ok(worker.workerType);
    assert.ok(worker.department);
    assert.ok(worker.factory);
    assert.ok(worker.role);
    assert.ok(Array.isArray(worker.reportingLine));
    assert.equal(worker.governingAuthority, "pillow");
    assert.ok(Array.isArray(worker.skillProfile));
    assert.ok(Array.isArray(worker.approvedTools));
    assert.ok(worker.authorityLevel);
    assert.ok(worker.certificationStatus);
    assert.ok(worker.operationalStatus);
    assert.ok(worker.createdDate);
    assert.ok(worker.lastUpdated);
    assert.ok(Array.isArray(worker.versionHistory));
    assert.equal(worker.metadataVersion, "WRG-001-v1");
    assert.equal(catalog.metadataVersion, "WRG-001-v1");
  });

  test("10 validates registry remains non-executing and Pillow-governed", async () => {
    const engine = await build();
    engine.updateStatus({
      workerId: "wkr-ops-01",
      operationalStatus: "busy",
      validated: true,
    });
    const validation = engine.validateWorkerRegistry({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const worker = engine.getWorkers().find((w) => w.workerId === "wkr-ops-01")!;
    assert.equal(worker.operationalStatus, "busy");
    assert.equal(worker.neverExecuteWorkerTasks, true);
    assert.equal(worker.neverReplaceWorkforceCapabilityRegistry, true);
    assert.equal(worker.neverOverridePillow, true);
    assert.equal(engine.getCatalog()!.neverOverrideGrandKing, true);
    assert.ok(worker.versionHistory.length >= 2);
  });
});
