import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ORCHESTRATION_SERVICES,
  INVOCATION_KINDS,
  POR_CAPABILITIES,
  POR_METADATA_VERSION,
  POR_REPORT_VERSION,
  POR_RUNTIME_VERSION,
  INTEGRATION_TARGETS,
  buildPillowOrchestrationRuntimeConfiguration,
  createPillowOrchestrationRuntime,
  resetPillowOrchestrationRuntimeForTesting,
  type PorInput,
  type PillowOrchestrationRuntimeDependencies,
} from "../../pillow-orchestration-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<PorInput> = {}): PorInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: PillowOrchestrationRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createPillowOrchestrationRuntime(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-02 Pillow Orchestration Runtime", () => {
  beforeEach(resetPillowOrchestrationRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildPillowOrchestrationRuntimeConfiguration(REPO_ROOT, {
      neverReplaceWorkerImplementations: false as never,
      neverReplaceToolImplementations: false as never,
      neverExecuteUnauthorisedActions: false as never,
      neverFabricateExecutionResults: false as never,
      neverBypassApprovalRuntime: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1003OrLater: false as never,
    });
    assert.equal(c.neverReplaceWorkerImplementations, true);
    assert.equal(c.neverReplaceToolImplementations, true);
    assert.equal(c.neverExecuteUnauthorisedActions, true);
    assert.equal(c.neverFabricateExecutionResults, true);
    assert.equal(c.neverBypassApprovalRuntime, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1003OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveOrchestrationHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-POR-001 Q10-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-02");
    assert.equal(state.engineVersion, "PILLOW-POR-001");
    assert.equal(state.configuration.workerId, "wkr-pillow-orchestration-runtime-01");
    assert.equal(state.configuration.factory, "pillow-orchestration");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(POR_CAPABILITIES.includes("invoke_workers"));
    assert.ok(POR_CAPABILITIES.includes("q1003_consumable_contract"));
    assert.equal(ORCHESTRATION_SERVICES.length, 12);
    assert.equal(INVOCATION_KINDS.length, 5);
  });

  test("3 worker invocation succeeds (structural or DI)", async () => {
    const engine = await build({
      workerRegistry: {
        invokeWorker: () => ({ success: true, status: "succeeded" }),
      },
    });
    const report = engine.invokeWorker(
      sampleInput({
        workers: [{ workerId: "wkr-capital-factory-core-01", factoryKey: "capital-factory", action: "sync" }],
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.invocationResults.length >= 1);
    const workerResult = report.invocationResults.find((r) => r.kind === "worker");
    assert.ok(workerResult);
    assert.ok(["succeeded", "structural_recorded"].includes(workerResult!.status));
    assert.equal(workerResult!.fabricated, false);
    assert.equal(workerResult!.neverReplaceWorkerImplementations, true);
  });

  test("4 tool invocation succeeds", async () => {
    const engine = await build({
      toolRegistry: {
        invokeTool: () => ({ success: true, status: "succeeded" }),
      },
    });
    const report = engine.invokeTool(
      sampleInput({
        tools: [{ toolId: "factory_registry", action: "lookup" }],
      }),
    );
    assert.equal(report.decision, "pass");
    const toolResult = report.invocationResults.find((r) => r.kind === "tool");
    assert.ok(toolResult);
    assert.ok(["succeeded", "structural_recorded"].includes(toolResult!.status));
    assert.equal(toolResult!.neverReplaceToolImplementations, true);
  });

  test("5 workflow invocation succeeds", async () => {
    const engine = await build();
    const report = engine.invokeWorkflow(
      sampleInput({
        workflows: [
          {
            workflowId: "wf-capital-sync",
            steps: [
              { stepId: "s1", kind: "worker", targetId: "wkr-capital-factory-core-01", action: "sync" },
              { stepId: "s2", kind: "tool", targetId: "factory_registry", action: "lookup" },
            ],
          },
        ],
      }),
    );
    assert.equal(report.decision, "pass");
    const wfResult = report.invocationResults.find((r) => r.kind === "workflow");
    assert.ok(wfResult);
    assert.ok(["succeeded", "structural_recorded"].includes(wfResult!.status));
  });

  test("6 approval routing succeeds", async () => {
    const engine = await build({
      approvalRouter: {
        routeApproval: () => ({ routed: true }),
      },
    });
    const report = engine.routeApproval(
      sampleInput({
        approvalRequests: [{ approvalId: "apr-001", kind: "capital_allocation", requiresGrandKingApproval: false }],
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.approvalActions.length >= 1);
    assert.ok(["succeeded", "structural_recorded"].includes(report.approvalActions[0]!.status));
  });

  test("7 executive reports retrieved (ERR DI or structural)", async () => {
    const engine = await build({
      executiveReportingRuntime: {
        retrieveReport: () => ({ reportId: "ert-exec-001", reportType: "executive_summary" }),
      },
    });
    const report = engine.retrieveReport(
      sampleInput({
        reportRequests: [{ reportType: "executive_summary" }],
      }),
    );
    assert.equal(report.decision, "pass");
    const reportResult = report.invocationResults.find((r) => r.kind === "report");
    assert.ok(reportResult);
    assert.ok(["succeeded", "structural_recorded"].includes(reportResult!.status));
  });

  test("8 cross-factory orchestration succeeds (via SRTC route record or structural)", async () => {
    const engine = await build({
      sharedRuntimeCore: {
        routeRequest: () => ({
          decision: "pass",
          routingRecord: {
            routingStatus: "routed",
            sourceFactory: "capital-factory",
            targetFactory: "commerce-factory",
            businessLogicInvoked: false,
          },
        }),
      },
    });
    const report = engine.orchestrateCrossFactory(
      sampleInput({
        crossFactoryRoute: {
          sourceFactory: "capital-factory",
          targetFactory: "commerce-factory",
          service: "runtime_coordination",
        },
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.executionTimeline.some((e) => e.kind === "cross_factory"));
  });

  test("9 orchestration history recorded + full Orchestration Report + consumableByQ1003", async () => {
    const engine = await build();
    engine.invokeWorker(
      sampleInput({
        workers: [{ workerId: "wkr-capital-factory-core-01", factoryKey: "capital-factory", action: "sync" }],
      }),
    );
    engine.invokeTool(sampleInput({ tools: [{ toolId: "factory_registry", action: "lookup" }] }));
    const report = engine.produceOrchestrationReport(sampleInput());
    assert.equal(report.decision, "pass");
    const ort = report.orchestrationReport;
    assert.ok(ort);
    assert.ok(ort!.reportId.startsWith("por-rpt"));
    assert.ok(ort!.timestamp);
    assert.equal(ort!.runtimeVersion, POR_RUNTIME_VERSION);
    assert.ok(ort!.invokedWorkers.length >= 1);
    assert.ok(ort!.invokedTools.length >= 1);
    assert.ok(ort!.executionTimeline.length >= 1);
    assert.ok(ort!.runtimeState);
    assert.ok(ort!.supportingEvidence.length >= 1);
    assert.ok(ort!.auditStatus);
    assert.ok(Array.isArray(ort!.outstandingIssues));
    assert.ok(typeof ort!.confidenceScore === "number");
    assert.equal(ort!.metadataVersion, POR_METADATA_VERSION);
    assert.equal(ort!.reportVersion, POR_REPORT_VERSION);
    assert.equal(ort!.consumableByQ1003, true);
    assert.equal(ort!.neverImplementQ1003OrLater, true);
    const history = engine.getHistory();
    assert.ok(history.sessions.length >= 1);
    assert.ok(history.results.length >= 2);
    assert.ok(history.reports.length >= 1);
  });

  test("10 rejects fabrication / unauthorised high-risk", async () => {
    const engine = await build();
    const failReport = engine.validate(sampleInput({ forceFail: true }));
    assert.equal(failReport.decision, "fail");
    const fabReport = engine.validate(sampleInput({ fabricateSuccess: true }));
    assert.equal(fabReport.decision, "fail");
    const highRiskReport = engine.invokeWorker(
      sampleInput({
        highRisk: true,
        grandKingApproved: false,
        workers: [{ workerId: "wkr-capital-risk-01", factoryKey: "capital-factory", action: "execute" }],
      }),
    );
    assert.equal(highRiskReport.decision, "fail");
  });

  test("11 rejects Q10-03+ mission scope", async () => {
    const engine = await build();
    const report = engine.validate(
      sampleInput({ implementQ1003OrLater: true, missionId: "Q10-03" }),
    );
    assert.equal(report.decision, "fail");
    assert.ok(report.errors.some((e) => e.includes("Q10-03") || e.includes("Q10-03 or later")));
  });

  test("12 cockpit and Q1003 contract; never replaces worker/tool logic", async () => {
    const engine = await build({
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-por-test" }] }),
      },
    });
    engine.invokeWorker(
      sampleInput({
        workers: [{ workerId: "wkr-capital-factory-core-01", factoryKey: "capital-factory", action: "sync" }],
      }),
    );
    engine.produceOrchestrationReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-02");
    assert.equal(cockpit.neverReplaceWorkerImplementations, true);
    assert.equal(cockpit.neverReplaceToolImplementations, true);
    assert.equal(cockpit.neverFabricateExecutionResults, true);
    assert.equal(cockpit.neverImplementQ1003OrLater, true);
    assert.ok(cockpit.totalInvocations >= 1);
    const contract = engine.getQ1003ConsumableContract();
    assert.equal(contract.consumerMissionId, "Q10-03");
    assert.equal(contract.producedBy, "pillow-orchestration-runtime");
    assert.equal(contract.missionId, "Q10-02");
    assert.equal(contract.neverImplementQ1003OrLater, true);
    assert.ok(contract.exposedFields.includes("invokedWorkers"));
    assert.ok(contract.orchestrationServiceCatalog.length >= ORCHESTRATION_SERVICES.length);
  });
});
