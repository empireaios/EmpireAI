import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { FACTORY_KEYS } from "../../shared-runtime-core/paths.js";
import {
  QSCPT_CAPABILITIES,
  QSCPT_METADATA_VERSION,
  Q_SERIES_COMPLETION_REPORT_VERSION,
  buildQSeriesCompletionConfiguration,
  createQSeriesCompletion,
  isForbiddenMissionId,
  resetQSeriesCompletionForTesting,
  type QscptInput,
  type QSeriesCompletionDependencies,
} from "../../q-series-completion/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<QscptInput> = {}): QscptInput {
  return {
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function blockedPlmrtStub() {
  return {
    getState: () => ({ productionActiveMonitoring: false }),
    getLatestReport: () => ({ productionActiveMonitoring: false }),
  };
}

function activePlmrtStub() {
  return {
    getState: () => ({ productionActiveMonitoring: true }),
    getLatestReport: () => ({ productionActiveMonitoring: true }),
  };
}

function blockedGkagtStub() {
  return {
    getGrandKingDecision: () => "pending",
    getDeploymentAuthorisationStatus: () => "blocked",
    getLatestReport: () => ({ grandKingDecision: "pending", deploymentAuthorisationStatus: "blocked" }),
    getState: () => ({ grandKingDecision: "pending", deploymentAuthorisationStatus: "blocked" }),
  };
}

function authorisedGkagtStub() {
  return {
    getGrandKingDecision: () => "approve",
    getDeploymentAuthorisationStatus: () => "authorised",
    getLatestReport: () => ({ grandKingDecision: "approve", deploymentAuthorisationStatus: "authorised" }),
    getState: () => ({ grandKingDecision: "approve", deploymentAuthorisationStatus: "authorised" }),
  };
}

function withholdEaprtStub() {
  return {
    getLatestReport: () => ({ reportId: "eaprt-rpt-01", decision: "withhold" }),
    getState: () => ({ latestReport: { reportId: "eaprt-rpt-01", decision: "withhold" } }),
  };
}

function certifyEaprtStub() {
  return {
    getLatestReport: () => ({ reportId: "eaprt-rpt-green", decision: "certify" }),
    getState: () => ({ latestReport: { reportId: "eaprt-rpt-green", decision: "certify" } }),
  };
}

function auditStub(decision = "certify") {
  return {
    getLatestReport: () => ({ reportId: `audit-${decision}`, decision }),
    getState: () => ({ latestReport: { reportId: `audit-${decision}`, decision } }),
  };
}

function withholdQscrtStub() {
  return {
    getLatestReport: () => ({ reportId: "qscrt-rpt-01", certificationDecision: "withhold" }),
    getState: () => ({
      latestReport: { certificationDecision: "withhold" },
      health: { lastCertificationDecision: "withhold" },
    }),
    getQ1113ConsumableContract: () => ({
      contractVersion: "QSCRT-001-v1",
      consumerMissionId: "Q11-13",
      exposedFields: ["certificationDecision", "outstandingIssues"],
      neverImplementQ1113OrLater: true,
    }),
  };
}

function certifyQscrtStub() {
  return {
    getLatestReport: () => ({ reportId: "qscrt-rpt-green", certificationDecision: "certify" }),
    getState: () => ({
      latestReport: { certificationDecision: "certify" },
      health: { lastCertificationDecision: "certify" },
    }),
    getQ1113ConsumableContract: () => ({
      contractVersion: "QSCRT-001-v1",
      consumerMissionId: "Q11-13",
      exposedFields: ["certificationDecision", "outstandingIssues"],
      neverImplementQ1113OrLater: true,
    }),
  };
}

function completionDeps(overrides: Partial<QSeriesCompletionDependencies> = {}): QSeriesCompletionDependencies {
  return {
    qSeriesCertification: withholdQscrtStub(),
    productionCertificationCore: auditStub("certify"),
    sharedRuntimeCertification: auditStub("certify"),
    workerReadinessAudit: auditStub("certify"),
    pillowCommandAudit: auditStub("certify"),
    businessFactoryAudit: auditStub("certify"),
    securityAudit: auditStub("certify"),
    performanceAudit: auditStub("certify"),
    recoveryAudit: auditStub("certify"),
    executiveAcceptancePack: withholdEaprtStub(),
    grandKingAcceptanceGate: blockedGkagtStub(),
    postLaunchMonitoring: blockedPlmrtStub(),
    sharedRuntimeCore: {
      listFactories: () =>
        FACTORY_KEYS.slice(0, 2).map((factoryKey) => ({ factoryKey, status: "active" })),
      getState: () => ({ status: "active" }),
    },
    workerRegistry: {
      listWorkers: () => [{ workerId: "wkr-test-01", status: "active" }],
    },
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    monitoringRuntime: { getState: () => ({ status: "active" }) },
    recoveryRuntime: { getState: () => ({ status: "active" }) },
    auditRuntime: { getState: () => ({ status: "active" }) },
    apiRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-qscpt-test" }] }),
    },
    ...overrides,
  };
}

function fullGreenDeps(): QSeriesCompletionDependencies {
  return completionDeps({
    qSeriesCertification: certifyQscrtStub(),
    postLaunchMonitoring: activePlmrtStub(),
    executiveAcceptancePack: certifyEaprtStub(),
    grandKingAcceptanceGate: authorisedGkagtStub(),
    financialReadinessAudit: {
      getLatestReport: () => ({ reportId: "finart-rpt-01", decision: "certify", missionId: "Q11-08" }),
    },
  });
}

async function build(deps?: QSeriesCompletionDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Q Series Completion tests");
  }
  const engine = createQSeriesCompletion(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q11-13 Q Series Completion", () => {
  beforeEach(resetQSeriesCompletionForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildQSeriesCompletionConfiguration(REPO_ROOT, {
      neverFabricateCompletionEvidence: false as never,
      neverMarkCompleteWhenUnmet: false as never,
      neverBypassGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1201OrLater: false as never,
    });
    assert.equal(c.neverFabricateCompletionEvidence, true);
    assert.equal(c.neverMarkCompleteWhenUnmet, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1201OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveCompletionHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
  });

  test("2 initializes PILLOW-QSCPT-001 Q11-13", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-13");
    assert.equal(state.engineVersion, "PILLOW-QSCPT-001");
    assert.equal(state.configuration.workerId, "wkr-q-series-completion-01");
    assert.equal(state.configuration.factory, "q-series-completion");
    assert.ok(QSCPT_CAPABILITIES.includes("verify_mission_completion"));
    assert.ok(QSCPT_CAPABILITIES.includes("consume_q1113_consumable_contract"));
    assert.ok(QSCPT_CAPABILITIES.includes("expose_q1201_consumable_contract"));
    assert.ok(QSCPT_CAPABILITIES.includes("never_fabricate_completion_evidence"));
  });

  test("3 verifies mission inventory Q11-01..Q11-12 with FINART missing recorded", async () => {
    const engine = await build(completionDeps());
    const missions = engine.verifyMissionCompletion();
    assert.equal(missions.requiredMissions, 12);
    assert.equal(missions.finartMissing, true);
    assert.ok(missions.inventory.some((e) => e.missionId === "Q11-08" && e.classification === "missing"));
    assert.ok(missions.evidence.some((e) => e.includes("FINART")));
    assert.equal(missions.classification, "partially_complete");
  });

  test("4 verifies workforce and runtime", async () => {
    const engine = await build(completionDeps());
    const workforce = engine.verifyWorkforceCapabilities();
    assert.equal(workforce.workerSummary.totalWorkers, 1);
    assert.equal(workforce.workerSummary.operationalCount, 1);
    assert.equal(workforce.factorySummary.totalDiscovered, 2);
    assert.ok(workforce.workerSummary.evidence.some((e) => e.includes("workerRegistry")));

    const runtimes = engine.verifyRuntimeIntegration();
    assert.ok(runtimes.boundCount >= 3);
    assert.ok(runtimes.evidence.some((e) => e.includes("monitoringRuntime")));
  });

  test("5 verifies governance and certification with QSCRT required", async () => {
    const engine = await build(completionDeps());
    const governance = engine.verifyGovernanceCompliance();
    assert.equal(governance.gkAuthorised, false);
    assert.equal(governance.pillowSignalsPresent, true);

    const certification = engine.verifyCertificationCompletion();
    assert.equal(certification.qscrtBound, true);
    assert.equal(certification.qscrtCertificationDecision, "withhold");
    assert.equal(certification.q1113ContractConsumed, true);
    assert.notEqual(certification.classification, "complete");
  });

  test("6 verifies production readiness blocked when chain incomplete", async () => {
    const engine = await build(completionDeps());
    const production = engine.verifyProductionReadiness();
    assert.equal(production.gkAuthorised, false);
    assert.equal(production.plmrtProductionActive, false);
    assert.equal(production.finartPresent, false);
    assert.equal(production.classification, "blocked");
    assert.equal(production.eaprtDecision, "withhold");
  });

  test("7 aggregates final completion evidence", async () => {
    const engine = await build(completionDeps());
    const aggregated = engine.aggregateFinalCompletionEvidence();
    assert.equal(aggregated.finartMissing, true);
    assert.equal(aggregated.qscrtCertified, false);
    assert.equal(aggregated.productionChainGreen, false);
    assert.equal(aggregated.missionInventoryComplete, false);
  });

  test("8 full report and consumableByQ1201 with incomplete/withhold when chain incomplete", async () => {
    const engine = await build(completionDeps());
    const report = await engine.produceReport(sampleInput());
    assert.ok(["withhold", "incomplete"].includes(report.finalCompletionDecision));
    assert.equal(report.q1113ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1201, true);
    assert.equal(report.neverImplementQ1201OrLater, true);
    assert.ok(report.outstandingIssues.some((i) => i.includes("FINART")));
    assert.ok(report.outstandingIssues.some((i) => i.includes("Q Series Certification")));
    assert.notEqual(report.validation.decision, "fail");
  });

  test("9 complete path when full green stubs injected", async () => {
    const engine = await build(fullGreenDeps());
    const production = engine.verifyProductionReadiness();
    assert.equal(production.finartPresent, true);
    assert.equal(production.eaprtDecision, "certify");
    assert.equal(production.gkAuthorised, true);
    assert.equal(production.plmrtProductionActive, true);

    const certification = engine.verifyCertificationCompletion();
    assert.equal(certification.qscrtCertificationDecision, "certify");

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.finalCompletionDecision, "complete");
    assert.ok(report.confidenceScore > 0);
  });

  test("10 Q1201 contract without implementing Q12-01 / AI Innovation Factory", async () => {
    const engine = await build(completionDeps());
    const contract = engine.getQ1201ConsumableContract();
    assert.equal(contract.producedBy, "q-series-completion");
    assert.equal(contract.missionId, "Q11-13");
    assert.equal(contract.consumerMissionId, "Q12-01");
    assert.equal(contract.seriesCompletePrerequisite, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.neverImplementQ1201OrLater, true);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q12-01 implemented"));
  });

  test("11 rejects fabricate mark-complete-when-unmet bypass governance override GK", async () => {
    const engine = await build(fullGreenDeps());
    for (const forbidden of [
      { fabricateCompletionEvidence: true },
      { markCompleteWhenUnmet: true },
      { bypassGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1201OrLater: true },
      { forceComplete: true },
    ] as const) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.notEqual(report.finalCompletionDecision, "complete");
    }
  });

  test("12 rejects Q12-01+; cockpit consume Q1113 and history", async () => {
    const engine = await build(completionDeps());
    assert.equal(isForbiddenMissionId("Q11-13"), false);
    for (const missionId of ["Q12-01", "Q12-02", "Q13-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({ ...sampleInput(), missionId });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
    }

    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-13");
    assert.equal(cockpit.neverImplementQ1201OrLater, true);

    const history = engine.getCompletionHistory();
    assert.ok(history.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-13");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.equal((await engine.produceReport(sampleInput())).metadataVersion, QSCPT_METADATA_VERSION);
    assert.equal((await engine.produceReport(sampleInput())).reportVersion, Q_SERIES_COMPLETION_REPORT_VERSION);

    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 0);
  });
});
