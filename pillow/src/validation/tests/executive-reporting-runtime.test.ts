import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ERT_CAPABILITIES,
  REPORT_TYPES,
  buildExecutiveReportingRuntimeConfiguration,
  createExecutiveReportingRuntime,
  resetExecutiveReportingRuntimeForTesting,
} from "../../executive-reporting-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createExecutiveReportingRuntime>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createExecutiveReportingRuntime(bootstrap, config);
  await engine.initialize();
  engine.connectExecutiveReportingRuntime();
  return engine;
}

describe("Q0-26 Executive Reporting Runtime", () => {
  beforeEach(resetExecutiveReportingRuntimeForTesting);

  test("1 locks mandatory executive-reporting-runtime boundaries", () => {
    const c = buildExecutiveReportingRuntimeConfiguration(REPO_ROOT, {
      neverExecuteWorkerLogic: false as never,
      neverReplaceMonitoringRuntime: false as never,
      neverReplaceMissionCoordination: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerLogic, true);
    assert.equal(c.neverReplaceMonitoringRuntime, true);
    assert.equal(c.neverReplaceMissionCoordination, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-ERT-001 for Q0-26", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-26");
    assert.equal(state.engineVersion, "PILLOW-ERT-001");
    for (const type of REPORT_TYPES) {
      assert.ok(state.configuration.reportTypes.includes(type));
    }
  });

  test("3 worker submits report", async () => {
    const report = (await build()).submitWorkerReport({
      reportingEntity: "wcr-wkr-strategy-01",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 40,
      currentStatus: "executing",
      evidence: ["task:expansion-checklist"],
      reportingFrequency: "real_time",
      validated: true,
    });
    assert.equal(report.records[0]!.entityType, "worker");
    assert.equal(report.records[0]!.reportingEntity, "wcr-wkr-strategy-01");
    assert.equal(report.records[0]!.progress, 40);
    assert.ok(report.records[0]!.reportId.startsWith("ert-rpt-"));
  });

  test("4 department submits report", async () => {
    const report = (await build()).submitDepartmentReport({
      reportingEntity: "dept-operations",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 55,
      currentStatus: "coordinating",
      evidence: ["dept:ops-standup"],
      validated: true,
    });
    assert.equal(report.records[0]!.entityType, "department");
    assert.equal(report.records[0]!.reportType, "department_summary");
  });

  test("5 factory submits report", async () => {
    const report = (await build()).submitFactoryReport({
      reportingEntity: "factory-executive-intelligence",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 70,
      currentStatus: "producing",
      evidence: ["factory:q0-pipeline"],
      validated: true,
    });
    assert.equal(report.records[0]!.entityType, "factory");
    assert.equal(report.records[0]!.reportType, "factory_summary");
  });

  test("6 executive summary is generated", async () => {
    const engine = await build();
    engine.submitWorkerReport({
      reportingEntity: "wcr-wkr-strategy-01",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 40,
      validated: true,
    });
    engine.submitDepartmentReport({
      reportingEntity: "dept-operations",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 60,
      validated: true,
    });
    const summary = engine.generateExecutiveSummary({
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      validated: true,
    });
    assert.ok(summary.summary);
    assert.equal(summary.summary!.totalReports, 2);
    assert.ok(summary.summary!.narrative.includes("Executive visibility"));
    assert.ok(summary.records.some((r) => r.reportType === "executive_summary"));
  });

  test("7 progress aggregation works", async () => {
    const engine = await build();
    engine.submitWorkerReport({
      reportingEntity: "wcr-wkr-strategy-01",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 40,
      validated: true,
    });
    engine.submitFactoryReport({
      reportingEntity: "factory-executive-intelligence",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 80,
      validated: true,
    });
    const aggregated = engine.aggregateProgress({
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      validated: true,
    });
    assert.equal(aggregated.averageProgress, 60);
  });

  test("8 blockers are visible", async () => {
    const engine = await build();
    engine.submitWorkerReport({
      reportingEntity: "wcr-wkr-ops-01",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 25,
      blockers: ["missing_supplier_quote"],
      reportType: "blocker_report",
      completionStatus: "blocked",
      validated: true,
    });
    const blockers = engine.listBlockers({
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      validated: true,
    });
    assert.ok(blockers.openBlockers.includes("missing_supplier_quote"));
    assert.ok(blockers.records.length >= 1);
  });

  test("9 rejects execute / monitoring / mission-coordination / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = {
      reportingEntity: "wcr-wkr-strategy-01",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      validated: true,
    };
    assert.equal(
      engine.submitWorkerReport({ ...base, executeWorkerLogic: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.submitDepartmentReport({
        ...base,
        replaceMonitoringRuntime: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.submitFactoryReport({
        ...base,
        replaceMissionCoordination: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.generateExecutiveSummary({ ...base, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.aggregateProgress({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(ERT_CAPABILITIES.includes("extensible_report_types"));
  });

  test("10 produces machine-readable reporting records and validates them", async () => {
    const engine = await build();
    engine.submitWorkerReport({
      reportingEntity: "wcr-wkr-strategy-01",
      businessId: "biz-marketplace",
      missionId: "Q0-26",
      progress: 66,
      currentStatus: "reviewing",
      blockers: [],
      risks: ["schedule_slip"],
      evidence: ["artifact:brief-01"],
      nextAction: "Submit for approval",
      completionStatus: "in_progress",
      reportingFrequency: "event_driven",
      validated: true,
    });
    const validation = engine.validateExecutiveReportingRuntime({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerLogicExecuted, false);
    assert.equal(record.monitoringRuntimeReplaced, false);
    assert.equal(record.missionCoordinationReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "ERT-001-v1");
    assert.ok(record.reportId);
    assert.ok(record.timestamp);
    assert.ok(record.reportingEntity);
    assert.ok(record.entityType);
    assert.ok(record.businessId);
    assert.ok(record.missionId);
    assert.ok(record.currentStatus);
    assert.ok(typeof record.progress === "number");
    assert.ok(Array.isArray(record.blockers));
    assert.ok(Array.isArray(record.risks));
    assert.ok(Array.isArray(record.evidence));
    assert.ok(record.nextAction);
    assert.ok(record.completionStatus);
  });
});
