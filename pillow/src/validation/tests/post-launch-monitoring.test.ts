import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PLMRT_CAPABILITIES,
  PLMRT_METADATA_VERSION,
  POST_LAUNCH_MONITORING_REPORT_VERSION,
  buildPostLaunchMonitoringConfiguration,
  createPostLaunchMonitoring,
  isForbiddenMissionId,
  resetPostLaunchMonitoringForTesting,
  type PlmrtInput,
  type PostLaunchMonitoringDependencies,
} from "../../post-launch-monitoring/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<PlmrtInput> = {}): PlmrtInput {
  return {
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function blockedGkagtStub() {
  return {
    getState: () => ({
      grandKingDecision: "pending",
      deploymentAuthorisationStatus: "blocked",
    }),
    getGrandKingDecision: () => "pending",
    getDeploymentAuthorisationStatus: () => "blocked",
    getLatestReport: () => ({
      grandKingDecision: "pending",
      deploymentAuthorisationStatus: "blocked",
    }),
    getQ1111ConsumableContract: () => ({
      contractVersion: "GKAGT-001-v1",
      consumerMissionId: "Q11-11",
      exposedFields: ["grandKingDecision", "deploymentAuthorisationStatus", "deploymentAuthorisation"],
      neverImplementQ1111OrLater: true,
    }),
  };
}

function authorisedGkagtStub() {
  return {
    getState: () => ({
      grandKingDecision: "approve",
      deploymentAuthorisationStatus: "authorised",
    }),
    getGrandKingDecision: () => "approve",
    getDeploymentAuthorisationStatus: () => "authorised",
    getLatestReport: () => ({
      grandKingDecision: "approve",
      deploymentAuthorisationStatus: "authorised",
    }),
    getQ1111ConsumableContract: () => ({
      contractVersion: "GKAGT-001-v1",
      consumerMissionId: "Q11-11",
      exposedFields: ["grandKingDecision", "deploymentAuthorisationStatus", "deploymentAuthorisation"],
      neverImplementQ1111OrLater: true,
    }),
  };
}

function monitoringDeps(gkagt: ReturnType<typeof blockedGkagtStub>): PostLaunchMonitoringDependencies {
  return {
    grandKingAcceptanceGate: gkagt,
    sharedRuntimeCore: {
      listFactories: () => [{ factoryKey: "test-factory-01", status: "active" }],
      getState: () => ({ status: "active" }),
    },
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
    },
    monitoringRuntime: {
      getState: () => ({ status: "active" }),
      list: () => ({
        components: [{ componentId: "wkr-test-01", componentType: "worker", healthScore: 85, errorCount: 0, warningCount: 0 }],
        anomalies: [],
        alerts: [],
      }),
      detectAnomalies: () => ({ anomalies: [] }),
      generateAlerts: () => ({ alerts: [] }),
    },
    recoveryRuntime: { getState: () => ({ status: "active" }) },
    auditRuntime: { getState: () => ({ status: "active" }), query: () => [] },
    executiveReportingRuntime: {
      getState: () => ({ status: "active" }),
      submitWorkerReport: () => ({ records: [{ reportId: "ert-plmrt-test" }] }),
    },
    workerRegistry: {
      listWorkers: () => [{ workerId: "wkr-test-01", factory: "test-factory", status: "active" }],
    },
    apiRuntime: { getState: () => ({ status: "active" }), getCatalog: () => ({ endpoints: [] }) },
    queueRuntime: { getState: () => ({ status: "active" }) },
  };
}

async function build(deps?: PostLaunchMonitoringDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Post-Launch Monitoring tests");
  }
  const engine = createPostLaunchMonitoring(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q11-11 Post-Launch Monitoring", () => {
  beforeEach(resetPostLaunchMonitoringForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildPostLaunchMonitoringConfiguration(REPO_ROOT, {
      neverFabricateProductionEvidence: false as never,
      neverSuppressCriticalIncidents: false as never,
      neverHideFailures: false as never,
      neverAutoModifyProduction: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1112OrLater: false as never,
    });
    assert.equal(c.neverFabricateProductionEvidence, true);
    assert.equal(c.neverSuppressCriticalIncidents, true);
    assert.equal(c.neverHideFailures, true);
    assert.equal(c.neverAutoModifyProduction, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1112OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveMonitoringHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
  });

  test("2 initializes PILLOW-PLMRT-001 Q11-11", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-11");
    assert.equal(state.engineVersion, "PILLOW-PLMRT-001");
    assert.equal(state.configuration.workerId, "wkr-post-launch-monitoring-01");
    assert.equal(state.configuration.factory, "post-launch-monitoring");
    assert.ok(PLMRT_CAPABILITIES.includes("monitor_workers"));
    assert.ok(PLMRT_CAPABILITIES.includes("consume_q1111_consumable_contract"));
    assert.ok(PLMRT_CAPABILITIES.includes("expose_q1112_consumable_contract"));
    assert.ok(PLMRT_CAPABILITIES.includes("never_fabricate_production_evidence"));
  });

  test("3 verify Grand King acceptance gate blocked when not authorised", async () => {
    const bare = await build();
    const bareVerify = bare.verifyGrandKingAcceptanceGranted();
    assert.equal(bareVerify.grandKingAcceptanceGranted, false);
    assert.equal(bareVerify.productionActiveMonitoring, false);

    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const verify = engine.verifyGrandKingAcceptanceGranted();
    assert.equal(verify.grandKingAcceptanceGranted, false);
    assert.equal(verify.productionActiveMonitoring, false);
    assert.equal(verify.grandKingDecision, "pending");
    assert.equal(verify.deploymentAuthorisationStatus, "blocked");
    assert.equal(verify.q1111ContractConsumed, true);
  });

  test("4 monitor workers and factories from injected handles", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const workers = engine.monitorWorkers();
    assert.ok(workers.totalWorkers >= 1);
    assert.ok(workers.monitoredCount >= 1);
    assert.ok(workers.evidence.some((e) => e.includes("workerRegistry")));

    const factories = engine.monitorFactories();
    assert.equal(factories.totalFactories, 1);
    assert.equal(factories.monitoredCount, 1);
    assert.ok(factories.evidence.some((e) => e.includes("sharedRuntimeCore")));
  });

  test("5 monitor runtimes APIs and workflows", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const workflows = engine.monitorWorkflows();
    assert.equal(workflows.structuralSignalPresent, true);
    assert.ok(workflows.workflowCount >= 1);

    const runtimes = engine.monitorRuntimeServices();
    assert.ok(runtimes.runtimeServicesMonitored >= 2);

    const apis = engine.monitorApiIntegrations();
    assert.equal(apis.bound, true);
    assert.equal(apis.apiIntegrationsMonitored, 1);
  });

  test("6 detect incidents and abnormal behaviour from evidence only", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const incidents = engine.detectIncidents();
    assert.equal(incidents.incidentCount, 0);
    assert.ok(incidents.evidence.some((e) => e.includes("monitoring evidence only")));

    const abnormal = engine.detectAbnormalWorkerBehaviour();
    assert.ok(Array.isArray(abnormal));
  });

  test("7 generate alerts and health summary", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const alerts = engine.generateAlerts();
    assert.ok(Array.isArray(alerts.alerts));
    assert.ok(alerts.evidence.length > 0);

    const health = engine.produceProductionHealthSummary();
    assert.equal(health.productionActiveMonitoring, false);
    assert.equal(health.overallProductionStatus, "blocked");
    assert.equal(health.overallHealthScore, 0);
  });

  test("8 full report with consumableByQ1112 and productionActiveMonitoring false when not authorised", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.productionActiveMonitoring, false);
    assert.equal(report.grandKingAcceptanceGranted, false);
    assert.equal(report.q1111ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1112, true);
    assert.equal(report.neverImplementQ1112OrLater, true);
    assert.ok(report.outstandingRisks.some((r) => r.includes("not granted") || r.includes("blocked")));
    assert.notEqual(report.validation.decision, "fail");
  });

  test("9 production-active path when GK approve+authorised stub injected", async () => {
    const engine = await build(monitoringDeps(authorisedGkagtStub()));
    const verify = engine.verifyGrandKingAcceptanceGranted();
    assert.equal(verify.grandKingAcceptanceGranted, true);
    assert.equal(verify.productionActiveMonitoring, true);

    const session = engine.startMonitoringSession();
    assert.equal(session.productionActiveMonitoring, true);
    assert.equal(session.status, "active");

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.productionActiveMonitoring, true);
    assert.equal(report.grandKingAcceptanceGranted, true);
    assert.ok(report.productionHealthSummary.overallHealthScore > 0);
  });

  test("10 Q1112 contract without implementing Q Series Certified", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    const contract = engine.getQ1112ConsumableContract();
    assert.equal(contract.producedBy, "post-launch-monitoring");
    assert.equal(contract.missionId, "Q11-11");
    assert.equal(contract.consumerMissionId, "Q11-12");
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.neverImplementQ1112OrLater, true);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q11-12 implemented"));
  });

  test("11 reject fabricate suppress hide modify production governance bypass", async () => {
    const engine = await build(monitoringDeps(authorisedGkagtStub()));
    for (const forbidden of [
      { fabricateProductionEvidence: true },
      { suppressCriticalIncidents: true },
      { hideFailures: true },
      { autoModifyProduction: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1112OrLater: true },
      { forceHealthy: true },
    ] as const) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.productionActiveMonitoring, false);
    }
  });

  test("12 reject Q11-12+; cockpit consume Q1111 and history", async () => {
    const engine = await build(monitoringDeps(blockedGkagtStub()));
    assert.equal(isForbiddenMissionId("Q11-11"), false);
    for (const missionId of ["Q11-12", "Q12-01", "Q13-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({ ...sampleInput(), missionId });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
    }

    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-11");
    assert.equal(cockpit.productionActiveMonitoring, false);
    assert.equal(cockpit.neverImplementQ1112OrLater, true);

    const history = engine.getMonitoringHistory();
    assert.ok(history.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-11");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.equal((await engine.produceReport(sampleInput())).metadataVersion, PLMRT_METADATA_VERSION);
    assert.equal((await engine.produceReport(sampleInput())).reportVersion, POST_LAUNCH_MONITORING_REPORT_VERSION);

    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 0);
  });
});
