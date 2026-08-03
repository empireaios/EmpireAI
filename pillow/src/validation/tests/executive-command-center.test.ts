import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EXECUTIVE_COMMAND_TYPES,
  PECC_CAPABILITIES,
  ROUTED_SERVICES,
  buildExecutiveCommandCenterConfiguration,
  createExecutiveCommandCenter,
  resetExecutiveCommandCenterForTesting,
} from "../../executive-command-center/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createExecutiveCommandCenter(bootstrap);
  await engine.initialize();
  engine.connectExecutiveCommandCenter();
  return engine;
}

describe("Q0-18 Pillow Executive Command Center", () => {
  beforeEach(resetExecutiveCommandCenterForTesting);

  test("1 locks mandatory executive-command-center boundaries", () => {
    const c = buildExecutiveCommandCenterConfiguration(REPO_ROOT, {
      neverExecuteWorkerLogic: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverReplaceWorkers: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerLogic, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverReplaceWorkers, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-PECC-001 for Q0-18", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-18");
    assert.equal(state.engineVersion, "PILLOW-PECC-001");
    for (const type of EXECUTIVE_COMMAND_TYPES) {
      assert.ok(state.configuration.commandTypes.includes(type));
    }
    for (const service of ROUTED_SERVICES) {
      assert.ok(state.configuration.routedServices.includes(service));
    }
  });

  test("3 submits executive commands and produces machine-readable records", async () => {
    const report = (await build()).submitExecutiveCommand({
      executiveRequest: "Inspect marketplace business health",
      requestedCapability: "executive_query",
      relatedBusiness: "biz-marketplace-alpha",
      relatedMission: "Q0-18",
      validated: true,
    });
    const record = report.records[0]!;
    assert.ok(record.commandId.startsWith("pecc-cmd-"));
    assert.equal(record.routedService, "business_state");
    assert.equal(record.workerLogicExecuted, false);
    assert.equal(record.metadataVersion, "PECC-001-v1");
    assert.ok(report.businessStates.some((b) => b.businessId === "biz-marketplace-alpha"));
  });

  test("4 routes requests to the correct service", async () => {
    const engine = await build();
    const monitoring = engine.submitExecutiveCommand({
      executiveRequest: "Monitor workforce availability",
      requestedCapability: "executive_monitoring",
      validated: true,
    });
    assert.equal(monitoring.routedService, "workers");
    assert.ok(monitoring.workers.length >= 1);

    const reporting = engine.submitExecutiveCommand({
      executiveRequest: "Retrieve executive reports",
      requestedCapability: "executive_reporting",
      validated: true,
    });
    assert.equal(reporting.routedService, "executive_reports");
    assert.ok(reporting.executiveReports.length >= 1);
  });

  test("5 queries business state through the command layer", async () => {
    const report = (await build()).queryBusinessState({
      relatedBusiness: "biz-finance-beta",
      validated: true,
    });
    assert.equal(report.routedService, "business_state");
    assert.ok(report.businessStates.every((b) => b.businessId === "biz-finance-beta"));
    assert.equal(report.records[0]!.currentStatus, "completed");
  });

  test("6 reaches workers through the command layer", async () => {
    const report = (await build()).accessWorkers({
      workerId: "wcr-wkr-strategy-01",
      validated: true,
    });
    assert.equal(report.routedService, "workers");
    assert.ok(report.workers.some((w) => w.workerId === "wcr-wkr-strategy-01"));
    assert.ok(report.records[0]!.relatedWorkers.includes("wcr-wkr-strategy-01"));
  });

  test("7 retrieves executive reports through the command layer", async () => {
    const report = (await build()).accessExecutiveReports({
      reportId: "rpt-workforce-01",
      validated: true,
    });
    assert.equal(report.routedService, "executive_reports");
    assert.ok(report.executiveReports.some((r) => r.reportId === "rpt-workforce-01"));
  });

  test("8 rejects execute / replace orchestrator / replace workers / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = {
      executiveRequest: "Boundary probe",
      requestedCapability: "executive_query",
      validated: true,
    };
    assert.equal(
      engine.submitExecutiveCommand({ ...base, executeWorkerLogic: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.submitExecutiveCommand({ ...base, replaceWorkforceOrchestrator: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.accessWorkers({ ...base, replaceWorkers: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.queryBusinessState({ ...base, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.accessExecutiveReports({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible command types and routed services", async () => {
    const engine = createExecutiveCommandCenter(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      {
        configuration: {
          commandTypes: [...EXECUTIVE_COMMAND_TYPES, "executive_simulation"],
          routedServices: [...ROUTED_SERVICES, "playbooks"],
        },
      },
    );
    await engine.initialize();
    engine.connectExecutiveCommandCenter();
    assert.ok(engine.getState().configuration.commandTypes.includes("executive_simulation"));
    assert.ok(engine.getState().configuration.routedServices.includes("playbooks"));
    assert.ok(PECC_CAPABILITIES.includes("extensible_command_types"));
  });

  test("10 validates stored executive command records", async () => {
    const engine = await build();
    engine.submitExecutiveCommand({
      executiveRequest: "Review decision memory",
      requestedCapability: "executive_review",
      validated: true,
    });
    const validation = engine.validateExecutiveCommandCenter({ validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
