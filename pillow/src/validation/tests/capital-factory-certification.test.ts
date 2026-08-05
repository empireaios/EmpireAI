import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  WORKER_CERTIFICATION_STATUSES,
  CERTIFICATION_DECISIONS,
  INTEGRATION_TARGETS,
  CAPCRT_CAPABILITIES,
  CAPCRT_METADATA_VERSION,
  CAPITAL_FACTORY_CERTIFICATION_REPORT_VERSION,
  Q9_MISSIONS,
  buildCapitalFactoryCertificationConfiguration,
  createCapitalFactoryCertification,
  resetCapitalFactoryCertificationForTesting,
  type CapcrtInput,
  type CapitalFactoryCertificationDependencies,
} from "../../capital-factory-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<CapcrtInput> = {}): CapcrtInput {
  return {
    grandKingInstructions:
      "Audit and certify the Capital Factory (Q9-01..Q9-10) from observed evidence only; never fabricate, never implement missing workers, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

function reachableWorkerHandle() {
  return { getState: () => ({ status: "active" }) };
}

function allWorkersReachable(): CapitalFactoryCertificationDependencies {
  const deps: Record<string, unknown> = {};
  for (const mission of Q9_MISSIONS) {
    deps[mission.dependencyKey] = reachableWorkerHandle();
  }
  deps.capitalRiskWorker = {
    getState: () => ({ status: "active" }),
    getQ911ConsumableContract: () => ({
      contractVersion: "CAPRW-001-v1",
      consumerMissionId: "Q9-11",
      exposedFields: ["detectedRisks", "prioritisedRisks"],
    }),
  };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-capcrt-test" }] }),
  };
  return deps as CapitalFactoryCertificationDependencies;
}

async function build(config?: Parameters<typeof createCapitalFactoryCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCapitalFactoryCertification(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allWorkersReachable() });
}

describe("Q9-11 Capital Factory Certification", () => {
  beforeEach(resetCapitalFactoryCertificationForTesting);

  test("1 locks boundaries / neverImplementQ10OrLater", () => {
    const c = buildCapitalFactoryCertificationConfiguration(REPO_ROOT, {
      neverFabricateSuccessfulTests: false as never,
      neverAssumeImplementation: false as never,
      neverImplementMissingWorkers: false as never,
      neverModifyFinancialRecords: false as never,
      neverAutomaticallyFixFailures: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ10OrLater: false as never,
    });
    assert.equal(c.neverFabricateSuccessfulTests, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverImplementMissingWorkers, true);
    assert.equal(c.neverModifyFinancialRecords, true);
    assert.equal(c.neverAutomaticallyFixFailures, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ10OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveCertificationHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-CAPCRT-001 Q9-11", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q9-11");
    assert.equal(state.engineVersion, "PILLOW-CAPCRT-001");
    assert.equal(state.configuration.workerId, "wkr-capital-factory-certification-01");
    assert.equal(state.configuration.factory, "capital-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(CAPCRT_CAPABILITIES.includes("collect_repository_evidence"));
    assert.ok(CAPCRT_CAPABILITIES.includes("probe_runtime_workers"));
    assert.ok(CAPCRT_CAPABILITIES.includes("produce_certification_findings"));
    assert.equal(Q9_MISSIONS.length, 10);
    for (const decision of CERTIFICATION_DECISIONS) {
      assert.ok(
        ["Certified", "Conditionally_Certified", "Not_Certified", "Failed", "Deferred"].includes(
          decision,
        ),
      );
    }
    for (const status of WORKER_CERTIFICATION_STATUSES) {
      assert.ok(
        [
          "Certified",
          "Partially Certified",
          "Failed Certification",
          "Blocked",
          "Deferred",
        ].includes(status),
      );
    }
  });

  test("3 mission catalog lists Q9-01..Q9-10 only", () => {
    assert.equal(Q9_MISSIONS.length, 10);
    const ids = Q9_MISSIONS.map((m) => m.missionId);
    for (let i = 1; i <= 10; i += 1) {
      assert.ok(ids.includes(`Q9-${String(i).padStart(2, "0")}` as (typeof ids)[number]));
    }
    assert.ok(!ids.some((id) => id.startsWith("Q10")));
    assert.ok(!ids.some((id) => id === "Q9-11"));
  });

  test("4 repository evidence collection finds all 10", async () => {
    const engine = await build();
    const evidence = await engine.collectEvidence();
    assert.equal(evidence.size, 10);
    for (const mission of Q9_MISSIONS) {
      const row = evidence.get(mission.missionId)!;
      assert.ok(row.engineExists, `${mission.missionId} engine.ts missing`);
      assert.ok(row.configExists, `${mission.missionId} config missing`);
      assert.ok(row.governanceExists, `${mission.missionId} governance missing`);
      assert.ok(row.bridgeExists, `${mission.missionId} bridge missing`);
      assert.ok(row.testExists, `${mission.missionId} test missing`);
      assert.ok(row.sessionReferenced, `${mission.missionId} session reference missing`);
      assert.ok(row.registryReferenced, `${mission.missionId} registry reference missing`);
      if (mission.missionId === "Q9-10") {
        assert.ok(row.q911ContractPresent, "Q911ConsumableContract not found");
      }
    }
  });

  test("5 worker certification matrix classifies workers", async () => {
    const engine = await buildFullyReachable();
    const matrix = await engine.auditQ9Workers(sampleInput());
    assert.equal(matrix.length, 10);
    for (const row of matrix) {
      assert.ok(WORKER_CERTIFICATION_STATUSES.includes(row.status));
      assert.ok(row.engineEvidence.length > 0);
      assert.ok(row.configEvidence.length > 0);
      assert.ok(row.bridgeEvidence.length > 0);
      assert.ok(row.testEvidence.length > 0);
    }
    const certified = matrix.filter((row) => row.status === "Certified");
    assert.equal(certified.length, 10, `expected all Certified; got: ${matrix.map((r) => `${r.missionId}:${r.status}`).join(",")}`);
  });

  test("6 integration verification runs", async () => {
    const engine = await build();
    const integration = await engine.verifyIntegrations();
    assert.equal(integration.rows.length, 10);
    assert.equal(integration.allBound, true);
    for (const row of integration.rows) {
      assert.equal(row.registryReferenced, true, `${row.missionId} not in session`);
    }
  });

  test("7 end-to-end workflow results generated", async () => {
    const engine = await buildFullyReachable();
    const workflow = await engine.runEndToEndWorkflow(sampleInput());
    assert.ok(workflow.stages.length >= 13);
    assert.equal(workflow.complete, true);
    assert.equal(workflow.currencyPrecisionVerified, true);
    assert.equal(workflow.traceabilityVerified, true);
    const pipeline = workflow.stages.filter((s) => s.missionId.startsWith("Q9-"));
    assert.equal(pipeline.length, 10);
    for (const stage of pipeline) {
      assert.equal(stage.satisfied, true, `${stage.stageId} not satisfied`);
    }
  });

  test("8 governance + Grand King approval flags enforced on report", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.governanceResults.grandKingApprovalRequired, true);
    assert.equal(report.governanceResults.pillowCommandRequired, true);
    assert.equal(report.governanceResults.compliant, true);
    const gkStage = report.endToEndWorkflowResults.stages.find(
      (s) => s.missionId === "grand_king_approval",
    );
    assert.ok(gkStage);
    assert.equal(gkStage!.satisfied, true);
  });

  test("9 produces Capital Certification Report with all required fields", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.certificationId.startsWith("capcrt-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.capitalFactoryVersion, "Q9-CAPFC-v1");
    assert.ok(report.repositoryAudit);
    assert.ok(report.runtimeAudit);
    assert.ok(report.workerInventory);
    assert.equal(report.workerCertificationMatrix.length, 10);
    assert.ok(report.integrationResults);
    assert.ok(report.endToEndWorkflowResults);
    assert.ok(report.executiveReportingResults);
    assert.ok(report.governanceResults);
    assert.ok(report.financialTraceabilityResults);
    assert.ok(report.productionReadinessAssessment);
    assert.ok(Array.isArray(report.openIssues));
    assert.ok(Array.isArray(report.risks));
    assert.equal(report.certificationDecision, "Certified");
    assert.equal(report.auditStatus, "certified");
    assert.equal(report.confidenceScore, 1);
    assert.equal(report.metadataVersion, CAPCRT_METADATA_VERSION);
    assert.equal(report.reportVersion, CAPITAL_FACTORY_CERTIFICATION_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-capital-factory-certification-01");
    assert.ok(report.supportingEvidence.length >= 1);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.neverImplementQ10OrLater, true);
    assert.equal(report.finalQ9Gate, true);
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("q10-01"),
      "must never reference or imply Q10-01 implementation",
    );
  });

  test("10 rejects fabrication / forceFail", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateSuccessfulTests: true },
      { forceFail: true },
      { assumeImplementation: true },
      { implementMissingWorkers: true },
      { modifyFinancialRecords: true },
      { automaticallyFixFailures: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
      { implementQ10OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.certificationDecision, "Failed");
    }
  });

  test("11 rejects Q10+ missionId", async () => {
    const engine = await buildFullyReachable();
    for (const missionId of ["Q10-01", "Q11-01"]) {
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.certificationDecision, "Failed");
    }
  });

  test("12 cockpit + never implements Q10; certification decision evidence-based", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-11");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastCertificationDecision, "Certified");
    assert.equal(cockpit.workerId, "wkr-capital-factory-certification-01");
    assert.deepEqual(
      [...cockpit.workerCertificationStatusOptions].sort(),
      [...WORKER_CERTIFICATION_STATUSES].sort(),
    );
    assert.equal(cockpit.neverFabricateSuccessfulTests, true);
    assert.equal(cockpit.neverImplementQ10OrLater, true);
    assert.equal(cockpit.finalQ9Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q9-11");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.equal(engine.getWorkerCertificationMatrix().length, 10);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
