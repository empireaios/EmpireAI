import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { FACTORY_KEYS } from "../../shared-runtime-core/paths.js";
import {
  QSCRT_CAPABILITIES,
  QSCRT_METADATA_VERSION,
  Q_SERIES_CERTIFICATION_REPORT_VERSION,
  buildQSeriesCertificationConfiguration,
  createQSeriesCertification,
  isForbiddenMissionId,
  resetQSeriesCertificationForTesting,
  type QscrtInput,
  type QSeriesCertificationDependencies,
} from "../../q-series-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<QscrtInput> = {}): QscrtInput {
  return {
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function blockedPlmrtStub() {
  return {
    getState: () => ({ productionActiveMonitoring: false, grandKingAcceptanceGranted: false }),
    getLatestReport: () => ({ productionActiveMonitoring: false }),
    getQ1112ConsumableContract: () => ({
      contractVersion: "PLMRT-001-v1",
      consumerMissionId: "Q11-12",
      exposedFields: ["productionActiveMonitoring", "grandKingAcceptanceGranted"],
      neverImplementQ1112OrLater: true,
    }),
  };
}

function activePlmrtStub() {
  return {
    getState: () => ({ productionActiveMonitoring: true, grandKingAcceptanceGranted: true }),
    getLatestReport: () => ({ productionActiveMonitoring: true }),
    getQ1112ConsumableContract: () => ({
      contractVersion: "PLMRT-001-v1",
      consumerMissionId: "Q11-12",
      exposedFields: ["productionActiveMonitoring", "grandKingAcceptanceGranted"],
      neverImplementQ1112OrLater: true,
    }),
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

function certificationDeps(overrides: Partial<QSeriesCertificationDependencies> = {}): QSeriesCertificationDependencies {
  return {
    postLaunchMonitoring: blockedPlmrtStub(),
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
    queueRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-qscrt-test" }] }),
    },
    ...overrides,
  };
}

function fullGreenDeps(): QSeriesCertificationDependencies {
  return certificationDeps({
    postLaunchMonitoring: activePlmrtStub(),
    executiveAcceptancePack: certifyEaprtStub(),
    grandKingAcceptanceGate: authorisedGkagtStub(),
    financialReadinessAudit: {
      getLatestReport: () => ({ reportId: "finart-rpt-01", decision: "certify", missionId: "Q11-08" }),
      getQ1109ConsumableContract: () => ({
        contractVersion: "FINART-001-v1",
        consumerMissionId: "Q11-09",
      }),
    },
  });
}

async function build(deps?: QSeriesCertificationDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Q Series Certification tests");
  }
  const engine = createQSeriesCertification(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q11-12 Q Series Certification", () => {
  beforeEach(resetQSeriesCertificationForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildQSeriesCertificationConfiguration(REPO_ROOT, {
      neverFabricateCertificationEvidence: false as never,
      neverCertifyMissingFunctionality: false as never,
      neverBypassGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1113OrLater: false as never,
    });
    assert.equal(c.neverFabricateCertificationEvidence, true);
    assert.equal(c.neverCertifyMissingFunctionality, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1113OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveCertificationHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
  });

  test("2 initializes PILLOW-QSCRT-001 Q11-12", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-12");
    assert.equal(state.engineVersion, "PILLOW-QSCRT-001");
    assert.equal(state.configuration.workerId, "wkr-q-series-certification-01");
    assert.equal(state.configuration.factory, "q-series-certification");
    assert.ok(QSCRT_CAPABILITIES.includes("discover_factories"));
    assert.ok(QSCRT_CAPABILITIES.includes("consume_q1112_consumable_contract"));
    assert.ok(QSCRT_CAPABILITIES.includes("expose_q1113_consumable_contract"));
    assert.ok(QSCRT_CAPABILITIES.includes("never_fabricate_certification_evidence"));
  });

  test("3 discovers factories from injected SRTC", async () => {
    const engine = await build(certificationDeps());
    const factories = engine.discoverFactories();
    assert.equal(factories.totalDiscovered, 2);
    assert.ok(factories.evidence.some((e) => e.includes("sharedRuntimeCore")));
    assert.ok(factories.factories.every((f) => (FACTORY_KEYS as readonly string[]).includes(f.factoryKey)));
  });

  test("4 verifies workers and runtimes", async () => {
    const engine = await build(certificationDeps());
    const workers = engine.verifyWorkers();
    assert.equal(workers.totalWorkers, 1);
    assert.equal(workers.verifiedCount, 1);
    assert.ok(workers.evidence.some((e) => e.includes("workerRegistry")));

    const runtimes = engine.verifyRuntimes();
    assert.ok(runtimes.boundCount >= 3);
    assert.ok(runtimes.evidence.some((e) => e.includes("monitoringRuntime")));
  });

  test("5 verifies orchestration and governance", async () => {
    const engine = await build(certificationDeps());
    const orchestration = engine.verifyCrossFactoryOrchestration();
    assert.equal(orchestration.orchestrationBound, true);
    assert.equal(orchestration.structuralSignalPresent, true);

    const governance = engine.verifyGovernanceCompliance();
    assert.equal(governance.gkAuthorised, false);
    assert.equal(governance.auditClassifications["financial-readiness-audit"], "missing");
    assert.ok(governance.evidence.some((e) => e.includes("FINART")));
  });

  test("6 verifies production readiness blocked when GK/PLMRT not green", async () => {
    const engine = await build(certificationDeps());
    const production = engine.verifyProductionReadiness();
    assert.equal(production.gkAuthorised, false);
    assert.equal(production.plmrtProductionActive, false);
    assert.equal(production.finartConsumable, false);
    assert.equal(production.classification, "blocked");
    assert.equal(production.eaprtDecision, "withhold");
  });

  test("7 aggregates evidence from Q11 audits", async () => {
    const engine = await build(certificationDeps());
    const aggregated = engine.aggregateCertificationEvidence();
    assert.equal(aggregated.finartMissing, true);
    assert.ok(aggregated.auditRefs.length >= 7);
    assert.ok(aggregated.certificationRefs.length >= 2);
    assert.ok(aggregated.missingCount >= 1);
  });

  test("8 full report and consumableByQ1113 with withhold when chain incomplete", async () => {
    const engine = await build(certificationDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.certificationDecision, "withhold");
    assert.equal(report.q1112ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1113, true);
    assert.equal(report.neverImplementQ1113OrLater, true);
    assert.ok(report.outstandingIssues.some((i) => i.includes("FINART")));
    assert.ok(report.outstandingIssues.some((i) => i.includes("productionActiveMonitoring")));
    assert.notEqual(report.validation.decision, "fail");
  });

  test("9 certify path when full green stubs injected", async () => {
    const engine = await build(fullGreenDeps());
    const production = engine.verifyProductionReadiness();
    assert.equal(production.finartConsumable, true);
    assert.equal(production.eaprtDecision, "certify");
    assert.equal(production.gkAuthorised, true);
    assert.equal(production.plmrtProductionActive, true);

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.certificationDecision, "certify");
    assert.ok(report.confidenceScore > 0);
  });

  test("10 Q1113 contract without implementing Q Series Complete", async () => {
    const engine = await build(certificationDeps());
    const contract = engine.getQ1113ConsumableContract();
    assert.equal(contract.producedBy, "q-series-certification");
    assert.equal(contract.missionId, "Q11-12");
    assert.equal(contract.consumerMissionId, "Q11-13");
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.neverImplementQ1113OrLater, true);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q11-13 implemented"));
  });

  test("11 rejects fabricate certify-missing bypass governance override GK", async () => {
    const engine = await build(fullGreenDeps());
    for (const forbidden of [
      { fabricateCertificationEvidence: true },
      { certifyMissing: true },
      { bypassGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1113OrLater: true },
      { forceCertify: true },
    ] as const) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.notEqual(report.certificationDecision, "certify");
    }
  });

  test("12 rejects Q11-13+; cockpit consume Q1112 and history", async () => {
    const engine = await build(certificationDeps());
    assert.equal(isForbiddenMissionId("Q11-12"), false);
    for (const missionId of ["Q11-13", "Q12-01", "Q13-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({ ...sampleInput(), missionId });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
    }

    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-12");
    assert.equal(cockpit.neverImplementQ1113OrLater, true);

    const history = engine.getCertificationHistory();
    assert.ok(history.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-12");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.equal((await engine.produceReport(sampleInput())).metadataVersion, QSCRT_METADATA_VERSION);
    assert.equal((await engine.produceReport(sampleInput())).reportVersion, Q_SERIES_CERTIFICATION_REPORT_VERSION);

    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 0);
  });
});
