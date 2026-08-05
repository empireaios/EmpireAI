import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RUNTIME_SERVICES,
  FACTORY_KEYS,
  SRTC_CAPABILITIES,
  SRTC_METADATA_VERSION,
  SHARED_RUNTIME_REPORT_VERSION,
  INTEGRATION_TARGETS,
  buildSharedRuntimeCoreConfiguration,
  createSharedRuntimeCore,
  resetSharedRuntimeCoreForTesting,
  type SrtcInput,
  type SharedRuntimeCoreDependencies,
} from "../../shared-runtime-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<SrtcInput> = {}): SrtcInput {
  return {
    grandKingInstructions:
      "Register factories and workers into unified runtime registry from observed evidence only; never fabricate runtime state, never replace factory or worker logic, never implement Q10-02+.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: SharedRuntimeCoreDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSharedRuntimeCore(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-01 Shared Runtime Core", () => {
  beforeEach(resetSharedRuntimeCoreForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildSharedRuntimeCoreConfiguration(REPO_ROOT, {
      neverReplaceFactoryLogic: false as never,
      neverReplaceWorkerLogic: false as never,
      neverExecuteBusinessSpecificDecisions: false as never,
      neverFabricateRuntimeState: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1002OrLater: false as never,
    });
    assert.equal(c.neverReplaceFactoryLogic, true);
    assert.equal(c.neverReplaceWorkerLogic, true);
    assert.equal(c.neverExecuteBusinessSpecificDecisions, true);
    assert.equal(c.neverFabricateRuntimeState, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ1002OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveRuntimeHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-SRTC-001 Q10-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-01");
    assert.equal(state.engineVersion, "PILLOW-SRTC-001");
    assert.equal(state.configuration.workerId, "wkr-shared-runtime-core-01");
    assert.equal(state.configuration.factory, "shared-runtime");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(SRTC_CAPABILITIES.includes("register_factories"));
    assert.ok(SRTC_CAPABILITIES.includes("q1002_consumable_contract"));
    assert.equal(RUNTIME_SERVICES.length, 12);
    assert.ok(FACTORY_KEYS.includes("capital-factory"));
  });

  test("3 registers default factory catalog", async () => {
    const engine = await build();
    const report = engine.registerDefaultFactories(sampleInput());
    assert.equal(report.decision, "pass");
    const catalog = engine.getCatalog();
    assert.ok(catalog);
    assert.ok(catalog.factories.length >= 9);
    const keys = catalog.factories.map((f) => f.factoryKey);
    assert.ok(keys.includes("capital-factory"));
    assert.ok(keys.includes("commerce-factory"));
    assert.ok(keys.includes("empire-builder-factory"));
    for (const factory of catalog.factories) {
      assert.equal(factory.fabricated, false);
    }
  });

  test("4 registers workers successfully", async () => {
    const engine = await build();
    engine.registerDefaultFactories(sampleInput());
    const report = engine.registerWorker(sampleInput());
    assert.equal(report.decision, "pass");
    const workers = engine.getCatalog()?.workers ?? [];
    assert.ok(workers.length >= 3);
    for (const worker of workers) {
      assert.equal(worker.fabricated, false);
      assert.notEqual(worker.healthStatus, "healthy");
    }
  });

  test("5 runtime registry and service discovery operational", async () => {
    const engine = await build();
    engine.registerDefaultFactories(sampleInput());
    const report = engine.resolveDependencies(sampleInput());
    assert.equal(report.decision, "pass");
    const services = engine.getCatalog()?.services ?? [];
    assert.equal(services.length, RUNTIME_SERVICES.length);
    for (const service of services) {
      assert.equal(service.fabricated, false);
      assert.ok(RUNTIME_SERVICES.includes(service.serviceName as (typeof RUNTIME_SERVICES)[number]));
    }
    assert.ok(report.topology);
    assert.ok(report.topology!.services.length >= RUNTIME_SERVICES.length);
  });

  test("6 shared execution context operational", async () => {
    const engine = await build();
    engine.registerDefaultFactories(sampleInput());
    engine.registerWorker(sampleInput());
    const report = engine.createExecutionContext(sampleInput());
    assert.equal(report.decision, "pass");
    assert.ok(report.executionContext);
    assert.ok(report.executionContext!.contextId.startsWith("srtc-ctx"));
    assert.equal(report.executionContext!.neverExecuteBusinessSpecificDecisions, true);
    assert.ok(report.executionContext!.factoryKeys.length >= 9);
    assert.ok(report.executionContext!.workerIds.length >= 3);
  });

  test("7 cross-factory routing operational (record only)", async () => {
    const engine = await build();
    engine.registerDefaultFactories(sampleInput());
    const report = engine.routeRequest(
      sampleInput({
        sourceFactory: "capital-factory",
        targetFactory: "commerce-factory",
        service: "runtime_coordination",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.routingRecord);
    assert.equal(report.routingRecord!.businessLogicInvoked, false);
    assert.equal(report.routingRecord!.routingStatus, "routed");
    assert.equal(report.routingRecord!.sourceFactory, "capital-factory");
    assert.equal(report.routingRecord!.targetFactory, "commerce-factory");
  });

  test("8 runtime diagnostics operational", async () => {
    const engine = await build();
    engine.registerDefaultFactories(sampleInput());
    const report = engine.collectDiagnostics(sampleInput());
    assert.equal(report.decision, "pass");
    assert.ok(report.topology);
    assert.ok(report.topology!.dependencies.length >= 4);
    const unavailable = report.topology!.dependencies.filter((d) => d.status === "unavailable");
    assert.ok(unavailable.length > 0, "missing deps must be unavailable not fabricated healthy");
  });

  test("9 Shared Runtime Report with required fields and consumableByQ1002", async () => {
    const engine = await build();
    engine.registerDefaultFactories(sampleInput());
    engine.registerWorker(sampleInput());
    engine.routeRequest(
      sampleInput({
        sourceFactory: "capital-factory",
        targetFactory: "affiliate-factory",
        service: "registry_sync",
      }),
    );
    const report = engine.produceSharedRuntimeReport(sampleInput());
    assert.equal(report.decision, "pass");
    const srt = report.sharedRuntimeReport;
    assert.ok(srt);
    assert.ok(srt!.reportId.startsWith("srtc-rpt"));
    assert.ok(srt!.timestamp);
    assert.equal(srt!.runtimeVersion, "Q10-SRTC-v1");
    assert.ok(srt!.registeredFactories.length >= 9);
    assert.ok(srt!.registeredWorkers.length >= 3);
    assert.equal(srt!.runtimeServices.length, RUNTIME_SERVICES.length);
    assert.ok(srt!.activeRuntimeState);
    assert.ok(srt!.dependencyStatus.length >= 1);
    assert.ok(srt!.routingStatus);
    assert.ok(srt!.healthStatus);
    assert.ok(srt!.runtimeDiagnostics);
    assert.ok(srt!.supportingEvidence.length >= 1);
    assert.ok(srt!.auditStatus);
    assert.ok(Array.isArray(srt!.outstandingIssues));
    assert.ok(typeof srt!.confidenceScore === "number");
    assert.equal(srt!.metadataVersion, SRTC_METADATA_VERSION);
    assert.equal(srt!.reportVersion, SHARED_RUNTIME_REPORT_VERSION);
    assert.equal(srt!.consumableByQ1002, true);
    assert.equal(srt!.neverImplementQ1002OrLater, true);
  });

  test("10 rejects fabrication and forceFail", async () => {
    const engine = await build();
    const failReport = engine.validate(sampleInput({ forceFail: true }));
    assert.equal(failReport.decision, "fail");
    const fabReport = engine.validate(sampleInput({ fabricated: true }));
    assert.equal(fabReport.decision, "fail");
    const regReport = engine.registerFactory(
      sampleInput({
        factoryDescriptors: [
          {
            factoryKey: "bad-factory",
            factoryName: "Bad",
            series: "Q99",
            missionId: "Q99-01",
            registeredAt: new Date().toISOString(),
            healthStatus: "healthy",
            fabricated: true as never,
            evidencePresent: false,
          },
        ],
      }),
    );
    assert.equal(regReport.decision, "fail");
  });

  test("11 rejects Q10-02+ mission scope", async () => {
    const engine = await build();
    const report = engine.validate(
      sampleInput({ implementQ1002OrLater: true, missionId: "Q10-02" }),
    );
    assert.equal(report.decision, "fail");
    assert.ok(report.errors.some((e) => e.includes("Q10-02") || e.includes("Q10-02 or later")));
  });

  test("12 cockpit and Q1002 contract; never replaces factory/worker logic", async () => {
    const engine = await build({
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-srtc-test" }] }),
      },
    });
    engine.registerDefaultFactories(sampleInput());
    engine.produceSharedRuntimeReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-01");
    assert.equal(cockpit.neverReplaceFactoryLogic, true);
    assert.equal(cockpit.neverReplaceWorkerLogic, true);
    assert.equal(cockpit.neverExecuteBusinessSpecificDecisions, true);
    assert.equal(cockpit.neverImplementQ1002OrLater, true);
    assert.ok(cockpit.totalFactories >= 9);
    const contract = engine.getQ1002ConsumableContract();
    assert.equal(contract.consumerMissionId, "Q10-02");
    assert.equal(contract.producedBy, "shared-runtime-core");
    assert.equal(contract.missionId, "Q10-01");
    assert.equal(contract.neverImplementQ1002OrLater, true);
    assert.ok(contract.exposedFields.includes("registeredFactories"));
    assert.ok(contract.runtimeServiceCatalog.length >= RUNTIME_SERVICES.length);
  });
});
