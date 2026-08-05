import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUTH_METHODS,
  AVAILABILITY_STATUSES,
  INTEGRATION_TARGETS,
  TOOL_CATEGORIES,
  TOOLRT_CAPABILITIES,
  TOOLRT_METADATA_VERSION,
  TOOLRT_REPORT_VERSION,
  TOOLRT_RUNTIME_VERSION,
  buildToolRuntimeConfiguration,
  createToolRuntime,
  resetToolRuntimeForTesting,
  type ToolrtInput,
  type ToolRuntimeDependencies,
} from "../../tool-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<ToolrtInput> = {}): ToolrtInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: ToolRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createToolRuntime(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-07 Tool Runtime", () => {
  beforeEach(resetToolRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildToolRuntimeConfiguration(REPO_ROOT, {
      neverExposeSecrets: false as never,
      neverExposeCredentials: false as never,
      neverFabricateExecutionResults: false as never,
      neverInvokeUnauthorizedTools: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1008OrLater: false as never,
      deterministicToolRoutingOnly: false as never,
      structuralSignalOnly: false as never,
      credentialReferenceOnly: false as never,
    });
    assert.equal(c.neverExposeSecrets, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverFabricateExecutionResults, true);
    assert.equal(c.neverInvokeUnauthorizedTools, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1008OrLater, true);
    assert.equal(c.deterministicToolRoutingOnly, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveInvocationTraces, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.credentialReferenceOnly, true);
  });

  test("2 initializes PILLOW-TOOLRT-001 Q10-07", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-07");
    assert.equal(state.engineVersion, "PILLOW-TOOLRT-001");
    assert.equal(state.configuration.workerId, "wkr-tool-runtime-01");
    assert.equal(state.configuration.factory, "pillow-tool");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(TOOLRT_CAPABILITIES.includes("register_tools"));
    assert.ok(TOOLRT_CAPABILITIES.includes("q1008_consumable_contract"));
    assert.equal(TOOL_CATEGORIES.length, 13);
    assert.equal(AUTH_METHODS.length, 6);
    assert.ok(AVAILABILITY_STATUSES.includes("available"));
  });

  test("3 seed tools registered with credential references only", async () => {
    const engine = await build();
    const history = engine.getHistory();
    const ids = history.tools.map((t) => t.toolId).sort();
    assert.deepEqual(ids, [
      "tool-ai-01",
      "tool-analytics-01",
      "tool-cloud-01",
      "tool-cursor-01",
      "tool-database-01",
      "tool-deploy-01",
      "tool-design-01",
      "tool-github-01",
      "tool-internal-01",
      "tool-marketplace-01",
      "tool-monitoring-01",
      "tool-supplier-01",
    ]);
    for (const tool of history.tools) {
      assert.ok(tool.credentialReference.startsWith("cred://vault/"));
      assert.equal(tool.structuralSignalOnly, true);
      assert.equal(tool.fabricated, false);
      assert.ok(tool.permissionPolicy.allowedActions.includes("invoke"));
    }
    const deploy = history.tools.find((t) => t.toolId === "tool-deploy-01")!;
    const database = history.tools.find((t) => t.toolId === "tool-database-01")!;
    assert.equal(deploy.permissionPolicy.highRisk, true);
    assert.equal(database.permissionPolicy.highRisk, true);
  });

  test("4 discovery lists tools by category", async () => {
    const engine = await build();
    const report = engine.discoverTools(sampleInput({ toolCategory: "github" }));
    assert.equal(report.decision, "pass");
    assert.ok(report.tools.length >= 1);
    assert.ok(report.tools.every((t) => t.toolCategory === "github"));
    assert.equal(report.tools[0]!.toolId, "tool-github-01");
  });

  test("5 permission enforced — deny unauthorized action", async () => {
    const engine = await build();
    const report = engine.invokeTool(
      sampleInput({
        toolId: "tool-cursor-01",
        action: "delete_everything",
      }),
    );
    assert.equal(report.decision, "fail");
    assert.ok(report.invocation);
    assert.equal(report.invocation!.status, "denied");
    assert.equal(report.invocation!.permissionGranted, false);
    assert.ok(report.errors.some((e) => e.toLowerCase().includes("allowedactions") || e.includes("delete_everything")));
  });

  test("6 invoke succeeds structurally without fabricated payload", async () => {
    const engine = await build();
    const report = engine.invokeTool(
      sampleInput({
        toolId: "tool-supplier-01",
        action: "invoke",
        requestRef: "request://structural/supplier/invoke",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.invocation);
    assert.equal(report.invocation!.fabricated, false);
    assert.equal(report.invocation!.structuralSignalOnly, true);
    assert.equal(report.invocation!.secretsExposed, false);
    assert.equal(report.invocation!.liveExecution, false);
    assert.ok(report.invocation!.resultRef?.startsWith("result://structural/"));
    assert.equal(report.invocation!.toolId, "tool-supplier-01");
    assert.equal(report.invocation!.status, "success");
  });

  test("7 auth succeeds with credential reference", async () => {
    const engine = await build();
    const report = engine.authenticate(
      sampleInput({
        toolId: "tool-cursor-01",
        authMethod: "api_key",
        credentialReference: "cred://vault/cursor/tool-cursor-01",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.tool);
    assert.equal(report.tool!.credentialReference, "cred://vault/cursor/tool-cursor-01");
  });

  test("8 availability monitoring updates from invocations", async () => {
    const engine = await build();
    engine.invokeTool(
      sampleInput({
        toolId: "tool-monitoring-01",
        action: "status",
      }),
    );
    const availability = engine.checkAvailability(sampleInput({ toolId: "tool-monitoring-01" }));
    assert.equal(availability.decision, "pass");
    assert.ok(availability.tool);
    assert.equal(availability.tool!.availabilityStatus, "available");
  });

  test("9 history preserved across invocations", async () => {
    const engine = await build();
    engine.invokeTool(
      sampleInput({
        toolId: "tool-marketplace-01",
        action: "list",
      }),
    );
    engine.invokeTool(
      sampleInput({
        toolId: "tool-marketplace-01",
        action: "invoke",
        simulateTransientFailure: true,
      }),
    );
    const history = engine.getHistory();
    assert.ok(history.invocations.length >= 2);
    for (const inv of history.invocations) {
      assert.equal(inv.secretsExposed, false);
      assert.equal(inv.fabricated, false);
      assert.equal(inv.structuralSignalOnly, true);
    }
    assert.ok(engine.getAuditTrail().some((e) => e.startsWith("invocation_saved:")));
  });

  test("10 full Tool Runtime Report structure + consumableByQ1008", async () => {
    const engine = await build();
    engine.invokeTool(
      sampleInput({
        toolId: "tool-internal-01",
        action: "status",
      }),
    );
    const report = engine.produceReport(sampleInput());
    assert.equal(report.decision, "pass");
    const toolrt = report.toolRuntimeReport;
    assert.ok(toolrt);
    assert.ok(toolrt!.reportId.startsWith("toolrt-rpt"));
    assert.ok(toolrt!.timestamp);
    assert.equal(toolrt!.runtimeVersion, TOOLRT_RUNTIME_VERSION);
    assert.ok(Array.isArray(toolrt!.registeredTools));
    assert.ok(Array.isArray(toolrt!.toolCategories));
    assert.ok(Array.isArray(toolrt!.activeConnections));
    assert.ok(toolrt!.invocationStatistics);
    assert.ok(toolrt!.failureSummary);
    assert.ok(toolrt!.retrySummary);
    assert.ok(toolrt!.availabilityStatus);
    assert.ok(toolrt!.permissionStatus);
    assert.ok(toolrt!.diagnostics);
    assert.ok(Array.isArray(toolrt!.supportingEvidence));
    assert.ok(toolrt!.auditStatus);
    assert.ok(Array.isArray(toolrt!.outstandingIssues));
    assert.ok(typeof toolrt!.confidenceScore === "number");
    assert.equal(toolrt!.metadataVersion, TOOLRT_METADATA_VERSION);
    assert.equal(toolrt!.reportVersion, TOOLRT_REPORT_VERSION);
    assert.equal(toolrt!.consumableByQ1008, true);
    assert.equal(toolrt!.neverImplementQ1008OrLater, true);
    assert.equal(toolrt!.neverExposeSecrets, true);
    assert.equal(toolrt!.neverFabricateExecutionResults, true);
    assert.equal(toolrt!.neverInvokeUnauthorizedTools, true);
    assert.ok(engine.getHistory().reports.length >= 1);
  });

  test("11 Q1008 consumable contract exposed without implementing Communication Runtime", async () => {
    const engine = await build({
      apiRuntime: {
        getQ1007ConsumableContract: () => ({
          contractId: "apirt-q1007-contract-v1",
          consumerMissionId: "Q10-07",
        }),
      },
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-toolrt-test" }] }),
      },
    });
    engine.produceReport(sampleInput());
    engine.submitReport(sampleInput());
    const contract = engine.getQ1008ConsumableContract();
    assert.equal(contract.producedBy, "tool-runtime");
    assert.equal(contract.missionId, "Q10-07");
    assert.equal(contract.consumerMissionId, "Q10-08");
    assert.equal(contract.neverImplementQ1008OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("registeredTools"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-07");
    assert.equal(cockpit.neverImplementQ1008OrLater, true);
    assert.equal(cockpit.neverExposeSecrets, true);
    assert.ok(cockpit.totalTools >= 12);
  });

  test("12 rejects secrets / fabricate / Q10-08+ scope", async () => {
    const engine = await build();
    const secrets = engine.validate(sampleInput({ exposeSecrets: true }));
    assert.equal(secrets.decision, "fail");
    assert.ok(secrets.errors.some((e) => e.toLowerCase().includes("secret")));

    const fabricate = engine.validate(sampleInput({ fabricateResult: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const scope = engine.validate(
      sampleInput({ implementQ1008OrLater: true, targetMissionId: "Q10-08" }),
    );
    assert.equal(scope.decision, "fail");
    assert.ok(
      scope.errors.some((e) => e.includes("Q10-08") || e.includes("Q10-08 or later")),
    );

    const badCred = engine.registerTool(
      sampleInput({
        toolId: "tool-bad-secret",
        toolName: "Bad Secret Tool",
        toolCategory: "custom_extension",
        authMethod: "api_key",
        credentialReference: "sk-live-not-a-reference",
      }),
    );
    assert.equal(badCred.decision, "fail");
  });
});
