import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUTHORITY_LEVELS,
  CHARTER_VERSION,
  ORGANIZATIONAL_RULES,
  OCH_CAPABILITIES,
  buildOrganizationCharterConfiguration,
  createOrganizationCharter,
  resetOrganizationCharterForTesting,
} from "../../organization-charter/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createOrganizationCharter>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createOrganizationCharter(bootstrap, config);
  await engine.initialize();
  engine.connectOrganizationCharter();
  return engine;
}

describe("Q1-02 Organization Charter", () => {
  beforeEach(resetOrganizationCharterForTesting);

  test("1 locks mandatory organization-charter boundaries", () => {
    const c = buildOrganizationCharterConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkforceOperatingSystem: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkforceOperatingSystem, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.executiveAuthority, "pillow");
  });

  test("2 initializes PILLOW-OCH-001 for Q1-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-02");
    assert.equal(state.engineVersion, "PILLOW-OCH-001");
    assert.equal(state.health.charterVersion, CHARTER_VERSION);
    for (const rule of ORGANIZATIONAL_RULES) {
      assert.ok(state.configuration.organizationalRules.includes(rule));
    }
    for (const level of AUTHORITY_LEVELS) {
      assert.ok(state.configuration.authorityLevels.includes(level));
    }
  });

  test("3 creates Organization Charter with seeded factories and departments", async () => {
    const report = (await build()).defineCharter({ validated: true });
    assert.equal(report.action, "define_charter");
    assert.ok(report.charter);
    assert.equal(report.charter!.charterVersion, CHARTER_VERSION);
    assert.equal(report.charter!.executiveAuthority, "pillow");
    assert.ok(report.charter!.factories.length >= 2);
    assert.ok(report.charter!.departments.length >= 6);
    assert.ok(report.charter!.factories.every((f) => f.reportsTo === "pillow"));
  });

  test("4 registers factories", async () => {
    const report = (await build()).registerFactory({
      factoryId: "commerce-factory",
      factoryName: "Commerce Factory",
      factoryResponsibilities: ["marketplace_ops", "fulfillment"],
      validated: true,
    });
    assert.equal(report.action, "register_factory");
    assert.ok(report.charter!.factories.some((f) => f.factoryId === "commerce-factory"));
    assert.ok(report.structureRecords[0]!.factoriesRegistered.includes("commerce-factory"));
  });

  test("5 registers departments under factories", async () => {
    const engine = await build();
    engine.registerFactory({
      factoryId: "commerce-factory",
      factoryName: "Commerce Factory",
      validated: true,
    });
    const report = engine.registerDepartment({
      departmentId: "sourcing",
      departmentName: "Sourcing",
      departmentFactoryId: "commerce-factory",
      departmentResponsibilities: ["supplier_selection"],
      validated: true,
    });
    assert.equal(report.action, "register_department");
    const dept = report.charter!.departments.find((d) => d.departmentId === "sourcing");
    assert.ok(dept);
    assert.equal(dept!.factoryId, "commerce-factory");
  });

  test("6 validates reporting hierarchy", async () => {
    const engine = await build();
    engine.registerWorker({
      workerId: "wcr-wkr-strategy-01",
      workerName: "Strategy Analyst",
      workerDepartmentId: "strategy",
      validated: true,
    });
    const report = engine.validateReporting({ validated: true });
    assert.equal(report.action, "validate_reporting");
    assert.equal(report.structureRecords[0]!.reportingValidated, true);
    assert.equal(report.structureDecision, "valid");
  });

  test("7 validates escalation hierarchy reaches Pillow", async () => {
    const report = (await build()).validateEscalation({ validated: true });
    assert.equal(report.action, "validate_escalation");
    assert.equal(report.structureRecords[0]!.escalationValidated, true);
    assert.ok(
      report.charter!.escalationHierarchy.some(
        (s) => s.actorId === "pillow" || s.actorType === "pillow",
      ),
    );
  });

  test("8 rejects execute / WFOS / orchestrator / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.defineCharter({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerFactory({
        factoryId: "x",
        replaceWorkforceOperatingSystem: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerDepartment({
        departmentId: "y",
        replaceWorkforceOrchestrator: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateReporting({ validated: true, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateEscalation({ validated: true, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(OCH_CAPABILITIES.includes("extensible_departments_and_factories"));
  });

  test("9 produces machine-readable organizational structure", async () => {
    const engine = await build();
    engine.registerWorker({
      workerId: "wcr-wkr-ops-02",
      workerName: "Ops Coordinator",
      workerDepartmentId: "operations",
      validated: true,
    });
    const report = engine.produceStructure({ validated: true });
    const charter = report.charter!;
    assert.ok(charter.charterVersion);
    assert.equal(charter.executiveAuthority, "pillow");
    assert.ok(Array.isArray(charter.organizationalHierarchy));
    assert.ok(Array.isArray(charter.departments));
    assert.ok(Array.isArray(charter.factories));
    assert.ok(Array.isArray(charter.reportingRelationships));
    assert.ok(Array.isArray(charter.authorityLevels));
    assert.ok(Array.isArray(charter.responsibilityMatrix));
    assert.ok(Array.isArray(charter.escalationHierarchy));
    assert.ok(Array.isArray(charter.governanceRules));
    assert.equal(charter.metadataVersion, "OCH-001-v1");
    assert.ok(report.structureRecords[0]!.structureRecordId.startsWith("och-sr-"));
  });

  test("10 validates structure records remain non-executing and Pillow-governed", async () => {
    const engine = await build();
    engine.produceStructure({ validated: true });
    const validation = engine.validateOrganizationCharter({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.workforceOperatingSystemReplaced, false);
    assert.equal(record.workforceOrchestratorReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "OCH-001-v1");
    assert.equal(engine.getCharter()!.neverOverridePillow, true);
  });
});
