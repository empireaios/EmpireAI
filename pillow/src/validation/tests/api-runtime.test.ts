import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APIRT_CAPABILITIES,
  APIRT_METADATA_VERSION,
  APIRT_REPORT_VERSION,
  APIRT_RUNTIME_VERSION,
  AUTH_METHODS,
  INTEGRATION_TARGETS,
  SERVICE_TYPES,
  buildApiRuntimeConfiguration,
  createApiRuntime,
  resetApiRuntimeForTesting,
  type ApirtInput,
  type ApiRuntimeDependencies,
} from "../../api-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<ApirtInput> = {}): ApirtInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: ApiRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createApiRuntime(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-06 API Runtime", () => {
  beforeEach(resetApiRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildApiRuntimeConfiguration(REPO_ROOT, {
      neverExposeSecrets: false as never,
      neverExposeCredentials: false as never,
      neverFabricateApiResponses: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1007OrLater: false as never,
      structuralSignalOnly: false as never,
      credentialReferenceOnly: false as never,
    });
    assert.equal(c.neverExposeSecrets, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverFabricateApiResponses, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1007OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveRequestTraces, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.credentialReferenceOnly, true);
    assert.equal(c.maxRequestsPerWindow, 5);
    assert.equal(c.rateLimitWindowMs, 60000);
  });

  test("2 initializes PILLOW-APIRT-001 Q10-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-06");
    assert.equal(state.engineVersion, "PILLOW-APIRT-001");
    assert.equal(state.configuration.workerId, "wkr-api-runtime-01");
    assert.equal(state.configuration.factory, "pillow-api");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(APIRT_CAPABILITIES.includes("register_api_providers"));
    assert.ok(APIRT_CAPABILITIES.includes("q1007_consumable_contract"));
    assert.equal(SERVICE_TYPES.length, 7);
    assert.equal(AUTH_METHODS.length, 6);
  });

  test("3 seed providers registered with credential references only", async () => {
    const engine = await build();
    const history = engine.getHistory();
    const ids = history.providers.map((p) => p.apiId).sort();
    assert.deepEqual(ids, [
      "api-ai-01",
      "api-comms-01",
      "api-internal-01",
      "api-marketplace-01",
      "api-payment-01",
      "api-supplier-01",
    ]);
    for (const provider of history.providers) {
      assert.ok(provider.credentialReference.startsWith("cred://vault/"));
      assert.equal(provider.structuralSignalOnly, true);
      assert.equal(provider.fabricated, false);
    }
  });

  test("4 auth succeeds with credential reference", async () => {
    const engine = await build();
    const report = engine.authenticate(
      sampleInput({
        apiId: "api-supplier-01",
        authMethod: "api_key",
        credentialReference: "cred://vault/supplier/api-supplier-01",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.provider);
    assert.equal(report.provider!.credentialReference, "cred://vault/supplier/api-supplier-01");
  });

  test("5 request routed structurally without fabricated body", async () => {
    const engine = await build();
    const report = engine.routeRequest(
      sampleInput({
        apiId: "api-supplier-01",
        method: "GET",
        path: "/catalog",
        requestRef: "request://structural/catalog",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.trace);
    assert.equal(report.trace!.fabricated, false);
    assert.equal(report.trace!.structuralSignalOnly, true);
    assert.equal(report.trace!.secretsExposed, false);
    assert.equal(report.trace!.liveCallExecuted, false);
    assert.ok(report.trace!.responseRef?.startsWith("response://structural/"));
    assert.equal(report.trace!.apiId, "api-supplier-01");
  });

  test("6 retry works on simulateTransientFailure", async () => {
    const engine = await build();
    const report = engine.routeRequest(
      sampleInput({
        apiId: "api-ai-01",
        method: "POST",
        path: "/infer",
        simulateTransientFailure: true,
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.traces.length > 1);
    assert.ok(report.traces.some((t) => t.errorClass === "transient"));
    assert.equal(report.trace!.attempt, report.traces.length);
    assert.equal(report.trace!.errorClass, null);
  });

  test("7 rate limit enforced after maxRequestsPerWindow", async () => {
    const engine = await build();
    const input = sampleInput({
      apiId: "api-payment-01",
      method: "GET",
      path: "/balance",
    });
    for (let i = 0; i < 5; i += 1) {
      const ok = engine.routeRequest(input);
      assert.equal(ok.decision, "pass", `request ${i + 1} should pass`);
    }
    const limited = engine.routeRequest(input);
    assert.equal(limited.decision, "fail");
    assert.ok(limited.trace);
    assert.equal(limited.trace!.rateLimited, true);
    assert.equal(limited.trace!.statusCode, 429);
    assert.ok(limited.errors.some((e) => e.toLowerCase().includes("rate limit")));
  });

  test("8 health monitoring updates from traces", async () => {
    const engine = await build();
    engine.routeRequest(
      sampleInput({
        apiId: "api-comms-01",
        method: "POST",
        path: "/notify",
      }),
    );
    const health = engine.checkHealth(sampleInput({ apiId: "api-comms-01" }));
    assert.equal(health.decision, "pass");
    assert.ok(health.provider);
    assert.equal(health.provider!.healthStatus, "healthy");
  });

  test("9 tracing preserved across route attempts", async () => {
    const engine = await build();
    engine.routeRequest(
      sampleInput({
        apiId: "api-marketplace-01",
        method: "GET",
        path: "/listings",
      }),
    );
    engine.routeRequest(
      sampleInput({
        apiId: "api-marketplace-01",
        method: "GET",
        path: "/listings/2",
        simulateTransientFailure: true,
      }),
    );
    const history = engine.getHistory();
    assert.ok(history.traces.length >= 2);
    for (const trace of history.traces) {
      assert.equal(trace.secretsExposed, false);
      assert.equal(trace.fabricated, false);
      assert.equal(trace.structuralSignalOnly, true);
    }
    assert.ok(engine.getAuditTrail().some((e) => e.startsWith("trace_saved:")));
  });

  test("10 full API Runtime Report structure + consumableByQ1007", async () => {
    const engine = await build();
    engine.routeRequest(
      sampleInput({
        apiId: "api-internal-01",
        method: "GET",
        path: "/status",
      }),
    );
    const report = engine.produceReport(sampleInput());
    assert.equal(report.decision, "pass");
    const apirt = report.apiRuntimeReport;
    assert.ok(apirt);
    assert.ok(apirt!.reportId.startsWith("apirt-rpt"));
    assert.ok(apirt!.timestamp);
    assert.equal(apirt!.runtimeVersion, APIRT_RUNTIME_VERSION);
    assert.ok(Array.isArray(apirt!.registeredApis));
    assert.ok(Array.isArray(apirt!.activeConnections));
    assert.ok(Array.isArray(apirt!.providerHealth));
    assert.ok(apirt!.requestStatistics);
    assert.ok(apirt!.failureSummary);
    assert.ok(apirt!.retrySummary);
    assert.ok(apirt!.authenticationStatus);
    assert.ok(apirt!.rateLimitStatus);
    assert.ok(apirt!.apiDiagnostics);
    assert.ok(Array.isArray(apirt!.supportingEvidence));
    assert.ok(apirt!.auditStatus);
    assert.ok(Array.isArray(apirt!.outstandingIssues));
    assert.ok(typeof apirt!.confidenceScore === "number");
    assert.equal(apirt!.metadataVersion, APIRT_METADATA_VERSION);
    assert.equal(apirt!.reportVersion, APIRT_REPORT_VERSION);
    assert.equal(apirt!.consumableByQ1007, true);
    assert.equal(apirt!.neverImplementQ1007OrLater, true);
    assert.equal(apirt!.neverExposeSecrets, true);
    assert.equal(apirt!.neverFabricateApiResponses, true);
    assert.ok(engine.getHistory().reports.length >= 1);
  });

  test("11 Q1007 consumable contract exposed without implementing Tool Runtime", async () => {
    const engine = await build({
      memoryRuntime: {
        getQ1006ConsumableContract: () => ({
          contractId: "memrt-q1006-contract-v1",
          consumerMissionId: "Q10-06",
        }),
      },
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-apirt-test" }] }),
      },
    });
    engine.produceReport(sampleInput());
    engine.submitReport(sampleInput());
    const contract = engine.getQ1007ConsumableContract();
    assert.equal(contract.producedBy, "api-runtime");
    assert.equal(contract.missionId, "Q10-06");
    assert.equal(contract.consumerMissionId, "Q10-07");
    assert.equal(contract.neverImplementQ1007OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("registeredApis"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-06");
    assert.equal(cockpit.neverImplementQ1007OrLater, true);
    assert.equal(cockpit.neverExposeSecrets, true);
    assert.ok(cockpit.totalProviders >= 6);
  });

  test("12 rejects secrets / fabricate / Q10-07+ scope", async () => {
    const engine = await build();
    const secrets = engine.validate(sampleInput({ exposeSecrets: true }));
    assert.equal(secrets.decision, "fail");
    assert.ok(secrets.errors.some((e) => e.toLowerCase().includes("secret")));

    const fabricate = engine.validate(sampleInput({ fabricateResponse: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const scope = engine.validate(
      sampleInput({ implementQ1007OrLater: true, targetMissionId: "Q10-07" }),
    );
    assert.equal(scope.decision, "fail");
    assert.ok(
      scope.errors.some((e) => e.includes("Q10-07") || e.includes("Q10-07 or later")),
    );

    const badCred = engine.registerProvider(
      sampleInput({
        apiId: "api-bad-secret",
        provider: "bad",
        serviceType: "custom_extension",
        endpoint: "https://structural.local/bad",
        authMethod: "api_key",
        credentialReference: "sk-live-not-a-reference",
      }),
    );
    assert.equal(badCred.decision, "fail");
  });
});
