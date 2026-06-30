import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildMasterCompletionLedger,
  buildBusinessCompletionLedger,
  buildRevenueMissionLedger,
  buildOperationalAccessReport,
  PROGRAM_CATALOG,
  SUCCESS_MISSION_TARGET_USD,
  masterCompletionLedgerTools,
} from "../../orchestration/master-completion-ledger/index.js";
import { seedRevenuePipeline, resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { resetEmpireAccessRegistry } from "../../operational-access/index.js";
import { resetConnectorRuntimeStates, resetCredentialVaultRepository, resetOperationalAccessRegistry } from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-mcl-001";
const COMPANY_ID = "co-grand-king";

describe("Master Completion Ledger (MCL-001)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
    resetCredentialVaultRepository();
    resetConnectorRuntimeStates();
    resetOperationalAccessRegistry();
    resetEmpireAccessRegistry();
    seedRevenuePipeline(WORKSPACE_ID, COMPANY_ID);
  });

  afterEach(() => {
    resetOperationalAccessRegistry();
    resetEmpireAccessRegistry();
    resetCredentialVaultRepository();
    resetConnectorRuntimeStates();
    resetGkrRepository();
    resetDatabaseInstance();
  });

  it("MCL-001 — tracks all 12 programs with required fields", () => {
    const ledger = buildMasterCompletionLedger(WORKSPACE_ID, COMPANY_ID);
    assert.equal(ledger.missionId, "MCL-001");
    assert.equal(ledger.programs.length, 12);
    assert.equal(PROGRAM_CATALOG.length, 12);

    for (const program of ledger.programs) {
      assert.ok(program.programId);
      assert.ok(program.name);
      assert.ok(program.completionPercent >= 0 && program.completionPercent <= 100);
      assert.ok(["COMPLETE", "IN_PROGRESS", "BLOCKED", "PLANNED"].includes(program.status));
      assert.ok(Array.isArray(program.blockers));
      assert.ok(program.remainingPackages.length > 0);
      assert.ok(program.nextCursorMission.length > 0);
      assert.ok(program.ownerModules.length > 0);
      assert.ok(program.dashboardSurface.length > 0);
    }
  });

  it("MCL-001 — SUCCESS-001 mission targets USD 100,000 net profit", () => {
    const ledger = buildMasterCompletionLedger(WORKSPACE_ID, COMPANY_ID);
    assert.equal(ledger.successMission.missionId, "SUCCESS-001");
    assert.equal(ledger.successMission.targetNetProfitUsd, SUCCESS_MISSION_TARGET_USD);
    assert.equal(ledger.successMission.name, "USD 100,000 Net Profit");
    assert.ok(ledger.successMission.description.includes("NOT first dollar"));
  });

  it("MCL-001 — summary identifies programs blocking USD 100K", () => {
    const ledger = buildMasterCompletionLedger(WORKSPACE_ID, COMPANY_ID);
    const blocking = ledger.programs.filter((p) => p.blocksUsd100k);
    assert.ok(blocking.length >= 5);
    assert.ok(ledger.summary.blockingUsd100k >= 5);
    assert.ok(ledger.summary.nextCursorMission);
  });

  it("MCL-001-BCL — business completion ledger", () => {
    const bcl = buildBusinessCompletionLedger(WORKSPACE_ID, COMPANY_ID);
    assert.equal(bcl.missionId, "MCL-001-BCL");
    assert.ok(bcl.entries.length >= 5);
    assert.ok(bcl.pipelineProducts >= 1);
  });

  it("MCL-001-RML — revenue mission ledger", () => {
    const rml = buildRevenueMissionLedger(WORKSPACE_ID, COMPANY_ID);
    assert.equal(rml.missionId, "MCL-001-RML");
    assert.equal(rml.successMission.targetNetProfitUsd, 100_000);
    assert.ok(rml.blockers.length > 0);
  });

  it("MCL-001-OAR — operational access report", () => {
    const report = buildOperationalAccessReport(WORKSPACE_ID);
    assert.equal(report.missionId, "MCL-001-OAR");
    assert.ok(report.marketplaceProviders >= 7);
    assert.ok(report.totalPlatforms > 0);
  });

  it("MCL-001 — registers brain tools", () => {
    assert.equal(masterCompletionLedgerTools.length, 4);
    assert.ok(masterCompletionLedgerTools.some((t) => t.name === "master_completion_ledger.dashboard"));
  });
});
