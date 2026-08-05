import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RUNTIME_CERTIFICATION_STATUSES,
  CERTIFICATION_DECISIONS,
  INTEGRATION_TARGETS,
  SRCRT_CAPABILITIES,
  SRCRT_METADATA_VERSION,
  SHARED_RUNTIME_CERTIFICATION_REPORT_VERSION,
  Q10_RUNTIMES,
  buildSharedRuntimeCertificationConfiguration,
  createSharedRuntimeCertification,
  resetSharedRuntimeCertificationForTesting,
  type SrcrtInput,
  type SharedRuntimeCertificationDependencies,
} from "../../shared-runtime-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<SrcrtInput> = {}): SrcrtInput {
  return {
    grandKingInstructions:
      "Audit and certify the Shared Runtime series (Q10-01..Q10-13) from observed evidence only; never fabricate, never implement missing runtimes, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

function reachableRuntimeHandle() {
  return { getState: () => ({ status: "active" }) };
}

/** Injects getState + the appropriate getQ10XXConsumableContract stub per runtime. */
function allRuntimesReachable(): SharedRuntimeCertificationDependencies {
  const deps: Record<string, unknown> = {};
  for (const runtime of Q10_RUNTIMES) {
    const contractMethodName = runtime.consumableContractMethod;
    deps[runtime.dependencyKey] = {
      getState: () => ({ status: "active" }),
      [contractMethodName]: () => ({
        contractVersion: `${runtime.runtimeName}-contract-v1`,
        consumerMissionId:
          runtime.missionId === "Q10-13" ? "Q10-14" : `Q10-${String(Number(runtime.missionId.slice(4)) + 1).padStart(2, "0")}`,
        exposedFields: ["exampleField"],
      }),
    };
  }
  deps.auditRuntime = {
    getState: () => ({ status: "active" }),
    getQ1014ConsumableContract: () => ({
      contractVersion: "AUDRT-001-v1",
      consumerMissionId: "Q10-14",
      exposedFields: ["auditRecords", "integrityDigests"],
    }),
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    getQ1011ConsumableContract: () => ({
      contractVersion: "MONRT-001-v1",
      consumerMissionId: "Q10-11",
      exposedFields: ["healthDashboard"],
    }),
    produceReport: () => ({ ok: true }),
  };
  deps.recoveryRuntime = {
    getState: () => ({ status: "active" }),
    getQ1012ConsumableContract: () => ({
      contractVersion: "RECRT-001-v1",
      consumerMissionId: "Q10-12",
      exposedFields: ["recoveryWorkflows"],
    }),
  };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-srcrt-test" }] }),
  };
  return deps as SharedRuntimeCertificationDependencies;
}

async function build(config?: Parameters<typeof createSharedRuntimeCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSharedRuntimeCertification(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allRuntimesReachable() });
}

describe("Q10-14 Shared Runtime Certification", () => {
  beforeEach(resetSharedRuntimeCertificationForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildSharedRuntimeCertificationConfiguration(REPO_ROOT, {
      neverFabricateCertificationEvidence: false as never,
      neverCertifyMissingFunctionality: false as never,
      neverAssumeImplementation: false as never,
      neverImplementMissingRuntimes: false as never,
      neverModifyRuntimeBehaviour: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1101OrLater: false as never,
    });
    assert.equal(c.neverFabricateCertificationEvidence, true);
    assert.equal(c.neverCertifyMissingFunctionality, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverImplementMissingRuntimes, true);
    assert.equal(c.neverModifyRuntimeBehaviour, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1101OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableCertificationHistory, true);
    assert.equal(c.preserveCertificationHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicCertification, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-SRCRT-001 Q10-14", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-14");
    assert.equal(state.engineVersion, "PILLOW-SRCRT-001");
    assert.equal(state.configuration.workerId, "wkr-shared-runtime-certification-01");
    assert.equal(state.configuration.factory, "pillow-shared-runtime-cert");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(SRCRT_CAPABILITIES.includes("collect_repository_evidence"));
    assert.ok(SRCRT_CAPABILITIES.includes("probe_runtime_workers"));
    assert.ok(SRCRT_CAPABILITIES.includes("produce_certification_findings"));
    assert.equal(Q10_RUNTIMES.length, 13);
    for (const decision of CERTIFICATION_DECISIONS) {
      assert.ok(
        ["Certified", "Conditionally_Certified", "Not_Certified", "Failed", "Deferred"].includes(
          decision,
        ),
      );
    }
    for (const status of RUNTIME_CERTIFICATION_STATUSES) {
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

  test("3 runtime catalog lists Q10-01..Q10-13 only", () => {
    assert.equal(Q10_RUNTIMES.length, 13);
    const ids = Q10_RUNTIMES.map((r) => r.missionId);
    for (let i = 1; i <= 13; i += 1) {
      assert.ok(ids.includes(`Q10-${String(i).padStart(2, "0")}` as (typeof ids)[number]));
    }
    assert.ok(!ids.some((id) => id === "Q10-14"));
    assert.ok(!ids.some((id) => id.startsWith("Q11")));
  });

  test("4 repository evidence finds all 13", async () => {
    const engine = await build();
    const evidence = await engine.collectEvidence();
    assert.equal(evidence.size, 13);
    for (const runtime of Q10_RUNTIMES) {
      const row = evidence.get(runtime.missionId)!;
      assert.ok(row.engineExists, `${runtime.missionId} engine.ts missing`);
      assert.ok(row.configExists, `${runtime.missionId} config missing`);
      assert.ok(row.governanceExists, `${runtime.missionId} governance missing`);
      assert.ok(row.bridgeExists, `${runtime.missionId} bridge missing`);
      assert.ok(row.testExists, `${runtime.missionId} test missing`);
      assert.ok(row.sessionReferenced, `${runtime.missionId} session reference missing`);
      assert.ok(row.registryReferenced, `${runtime.missionId} registry reference missing`);
      assert.ok(row.certified, `${runtime.missionId} certified evidence missing`);
      if (runtime.missionId === "Q10-13") {
        assert.ok(row.q1014ContractPresent, "Q1014ConsumableContract not found");
      }
    }
  });

  test("5 runtime certification matrix classifies all Certified when fully reachable", async () => {
    const engine = await buildFullyReachable();
    const matrix = await engine.auditQ10Runtimes(sampleInput());
    assert.equal(matrix.length, 13);
    for (const row of matrix) {
      assert.ok(RUNTIME_CERTIFICATION_STATUSES.includes(row.certificationStatus));
      assert.ok(row.certificationId.length > 0);
      assert.ok(row.runtimeComponent.length > 0);
      assert.ok(row.supportingEvidence.length > 0);
      assert.ok(row.testResults.length > 0);
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.certificationTimestamp.length > 0);
    }
    const certified = matrix.filter((row) => row.certificationStatus === "Certified");
    assert.equal(
      certified.length,
      13,
      `expected all Certified; got: ${matrix.map((r) => `${r.missionId}:${r.certificationStatus}`).join(",")}`,
    );
  });

  test("6 integration verification runs", async () => {
    const engine = await buildFullyReachable();
    const integration = await engine.verifyIntegrations();
    assert.equal(integration.rows.length, 13);
    assert.equal(integration.allBound, true);
    for (const row of integration.rows) {
      assert.equal(row.registryReferenced, true, `${row.missionId} not in session`);
    }
  });

  test("7 governance + monitoring + recovery + auditability verified", async () => {
    const engine = await buildFullyReachable();
    const governance = engine.verifyGovernanceCompliance();
    assert.equal(governance.compliant, true);
    assert.equal(governance.grandKingApprovalRequired, true);
    assert.equal(governance.pillowCommandRequired, true);

    const monitoring = await engine.verifyMonitoring();
    assert.equal(monitoring.verified, true);
    assert.equal(monitoring.monitoringRuntimeReachable, true);
    assert.equal(monitoring.contractExposed, true);

    const recovery = await engine.verifyRecovery();
    assert.equal(recovery.verified, true);
    assert.equal(recovery.recoveryRuntimeReachable, true);
    assert.equal(recovery.contractExposed, true);

    const auditability = await engine.verifyAuditability();
    assert.equal(auditability.verified, true);
    assert.equal(auditability.auditRuntimeReachable, true);
    assert.equal(auditability.contractExposed, true);
  });

  test("8 full Shared Runtime Certification Report + consumableByQ1101", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("srcrt-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.runtimeVersion, "Q10-SRCRT-v1");
    assert.ok(report.runtimeInventory);
    assert.ok(report.integrationSummary);
    assert.ok(report.certificationSummary);
    assert.equal(report.runtimeCertificationMatrix.length, 13);
    assert.ok(Array.isArray(report.passedComponents));
    assert.ok(Array.isArray(report.failedComponents));
    assert.ok(Array.isArray(report.missingComponents));
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.supportingEvidence.length >= 1);
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.equal(report.confidenceScore, 1);
    assert.equal(report.metadataVersion, SRCRT_METADATA_VERSION);
    assert.equal(report.reportVersion, SHARED_RUNTIME_CERTIFICATION_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-shared-runtime-certification-01");
    assert.equal(report.certificationDecision, "Certified");
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1101, true);
    assert.equal(report.neverImplementQ1101OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.ok(report.governanceResults);
    assert.ok(report.monitoringVerification);
    assert.ok(report.recoveryVerification);
    assert.ok(report.auditabilityVerification);
    assert.ok(report.reportingVerification);
    assert.ok(report.q1014ContractConsumed);
    assert.equal(report.finalQ10Gate, true);
    assert.equal(report.passedComponents.length, 13);
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("q11-01\":true"),
      "must never mark Q11-01 as implemented",
    );
  });

  test("9 exposes Q1101 contract without implementing Production Certification Core", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1101ConsumableContract();
    assert.equal(contract.producedBy, "shared-runtime-certification");
    assert.equal(contract.missionId, "Q10-14");
    assert.equal(contract.consumerMissionId, "Q11-01");
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.runtimeCertificationCatalog.length, 13);
    assert.equal(contract.neverImplementQ1101OrLater, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("production certification core"),
      "must never claim to implement Production Certification Core",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1014ContractConsumed.attempted, true);
    assert.equal(report.q1014ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-missing / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateCertificationEvidence: true },
      { forceFail: true },
      { certifyMissingFunctionality: true },
      { assumeImplementation: true },
      { implementMissingRuntimes: true },
      { modifyRuntimeBehaviour: true },
      { automaticallyFixFailures: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1101OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.certificationDecision, "Failed");
    }
  });

  test("11 rejects Q11-01+ missionId", async () => {
    const engine = await buildFullyReachable();
    for (const missionId of ["Q11-01", "Q12-01", "Q20-01"]) {
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.certificationDecision, "Failed");
    }
    // Q10-14 self and Q10-01..Q10-13 members must remain allowed.
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q10-14" });
    assert.notEqual(selfOk.certificationDecision, "Failed");
    const memberOk = await engine.produceReport({ ...sampleInput(), missionId: "Q10-01" });
    assert.notEqual(memberOk.certificationDecision, "Failed");
  });

  test("12 cockpit + finalQ10Gate + never implements Q11", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-14");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastCertificationDecision, "Certified");
    assert.equal(cockpit.workerId, "wkr-shared-runtime-certification-01");
    assert.deepEqual(
      [...cockpit.runtimeCertificationStatusOptions].sort(),
      [...RUNTIME_CERTIFICATION_STATUSES].sort(),
    );
    assert.equal(cockpit.neverFabricateCertificationEvidence, true);
    assert.equal(cockpit.neverImplementQ1101OrLater, true);
    assert.equal(cockpit.finalQ10Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q10-14");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.equal(engine.getRuntimeCertificationMatrix().length, 13);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
