import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  COMPONENT_STATUSES,
  CERTIFICATION_DECISIONS,
  INTEGRATION_TARGETS,
  AFCRT_CAPABILITIES,
  AFCRT_METADATA_VERSION,
  AFFILIATE_CERTIFICATION_REPORT_VERSION,
  Q8_MISSIONS,
  buildAffiliateCertificationConfiguration,
  createAffiliateCertification,
  resetAffiliateCertificationForTesting,
  type AfcrtInput,
  type AffiliateCertificationDependencies,
} from "../../affiliate-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<AfcrtInput> = {}): AfcrtInput {
  return {
    grandKingInstructions:
      "Audit and certify the Affiliate Factory (Q8-01..Q8-08) from observed evidence only; never fabricate, never implement missing functionality, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function reachableWorkerHandle() {
  return { getState: () => ({ status: "active" }) };
}

/** All 8 Q8-01..Q8-08 dependency keys injected with a reachable getState() handle. */
function allWorkersReachable(): AffiliateCertificationDependencies {
  const deps: Record<string, unknown> = {};
  for (const mission of Q8_MISSIONS) {
    deps[mission.dependencyKey] = reachableWorkerHandle();
  }
  deps.affiliateComplianceWorker = {
    getState: () => ({ status: "active" }),
    getQ809ConsumableContract: () => ({
      contractVersion: "ACW-Q809-v1",
      consumableByQ809: true,
      fields: ["disclosureValidation", "recommendedCorrections"],
    }),
  };
  return deps as AffiliateCertificationDependencies;
}

async function build(config?: Parameters<typeof createAffiliateCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAffiliateCertification(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allWorkersReachable() });
}

describe("Q8-09 Affiliate Certification", () => {
  beforeEach(resetAffiliateCertificationForTesting);

  test("1 locks mandatory affiliate-certification boundaries", () => {
    const c = buildAffiliateCertificationConfiguration(REPO_ROOT, {
      neverFabricateVerificationResults: false as never,
      neverCertifyUnsupportedFunctionality: false as never,
      neverImplementMissingFunctionality: false as never,
      neverAutoCorrectFailedImplementations: false as never,
      neverOverrideGovernance: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ901OrLater: false as never,
    });
    assert.equal(c.neverFabricateVerificationResults, true);
    assert.equal(c.neverCertifyUnsupportedFunctionality, true);
    assert.equal(c.neverImplementMissingFunctionality, true);
    assert.equal(c.neverAutoCorrectFailedImplementations, true);
    assert.equal(c.neverOverrideGovernance, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ901OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveCertificationAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-AFCRT-001 for Q8-09", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-09");
    assert.equal(state.engineVersion, "PILLOW-AFCRT-001");
    assert.equal(state.configuration.workerId, "wkr-affiliate-certification-01");
    assert.equal(state.configuration.factory, "affiliate-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(AFCRT_CAPABILITIES.includes("collect_repository_evidence"));
    assert.ok(AFCRT_CAPABILITIES.includes("probe_runtime_workers"));
    assert.ok(AFCRT_CAPABILITIES.includes("produce_certification_findings"));
    assert.equal(Q8_MISSIONS.length, 8);
    for (const decision of CERTIFICATION_DECISIONS) {
      assert.ok(
        ["Certified", "Conditionally_Certified", "Not_Certified", "Failed", "Deferred"].includes(
          decision,
        ),
      );
    }
    for (const status of COMPONENT_STATUSES) {
      assert.ok(
        [
          "Completed",
          "Partially Implemented",
          "Missing",
          "Broken / Deviating",
          "Intentionally Deferred",
        ].includes(status),
      );
    }
  });

  test("3 audits every Q8-01..Q8-08 worker (matrix length 8)", async () => {
    const engine = await build();
    const matrix = await engine.auditQ8Workers(sampleInput());
    assert.equal(matrix.length, 8);
    const missionIds = matrix.map((row) => row.missionId);
    for (const mission of Q8_MISSIONS) {
      assert.ok(missionIds.includes(mission.missionId));
    }
    for (const row of matrix) {
      assert.ok(COMPONENT_STATUSES.includes(row.status));
      assert.ok(row.moduleEvidence.length > 0);
      assert.ok(row.finalPassEvidence.length > 0);
      assert.ok(row.sessionEvidence.length > 0);
      assert.ok(row.registryEvidence.length > 0);
    }
  });

  test("4 verifies required deliverables / FINAL PASS evidence for all when repo healthy", async () => {
    const engine = await buildFullyReachable();
    const verification = await engine.verifyDeliverables(sampleInput());
    assert.equal(verification.requiredCount, 8);
    assert.equal(verification.presentCount, 8);
    assert.equal(verification.allRequiredPresent, true);
    assert.equal(verification.missingItems.length, 0);
    for (const item of verification.items) {
      assert.ok(item.present, `${item.missionId} expected present from real repository FINAL PASS evidence`);
      assert.ok(item.evidenceRefs.length >= 1);
    }
  });

  test("5 validates integrations from repository evidence", async () => {
    const engine = await build();
    const integration = await engine.verifyIntegrations();
    assert.equal(integration.rows.length, 8);
    assert.equal(integration.allBound, true);
    for (const row of integration.rows) {
      assert.equal(row.missingBinds.length, 0, `${row.missionId} missing binds: ${row.missingBinds.join(",")}`);
      assert.equal(row.allBound, true);
    }
  });

  test("6 evaluates production readiness", async () => {
    const engine = await buildFullyReachable();
    const readiness = await engine.verifyProductionReadiness(sampleInput());
    assert.equal(readiness.modulesTotal, 8);
    assert.equal(readiness.modulesPresent, 8);
    assert.equal(readiness.finalPassTotal, 8);
    assert.equal(readiness.finalPassCount, 8);
    assert.equal(readiness.ready, true);
    assert.ok(readiness.evidence.length === 8);
  });

  test("7 verifies governance compliance", async () => {
    const engine = await build();
    const compliance = engine.verifyGovernanceCompliance();
    assert.equal(compliance.checks.length, 9);
    assert.equal(compliance.missingDocs.length, 0);
    assert.equal(compliance.compliant, true);
    const selfCheck = compliance.checks.find((c) => c.missionId === "self");
    assert.ok(selfCheck);
    assert.equal(selfCheck!.present, true);
    assert.equal(selfCheck!.containsExpectedLabel, true);
  });

  test("8 generates certification decision (Certified when all Completed in real repo)", async () => {
    const engine = await buildFullyReachable();
    const findings = await engine.produceCertificationFindings(sampleInput());
    assert.equal(findings.componentStatusMatrix.length, 8);
    for (const row of findings.componentStatusMatrix) {
      assert.equal(row.status, "Completed", `${row.missionId}: ${row.reason}`);
    }
    assert.equal(findings.certificationDecision, "Certified");
    assert.equal(findings.confidenceScore, 1);

    const engineNoRuntime = await build();
    const findingsNoRuntime = await engineNoRuntime.produceCertificationFindings(sampleInput());
    assert.notEqual(findingsNoRuntime.certificationDecision, "Failed");
    assert.notEqual(findingsNoRuntime.certificationDecision, "Not_Certified");
  });

  test("9 full Affiliate Certification Report required fields", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("afcrt-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.factoryName, "Affiliate Factory");
    assert.equal(report.certificationScope.length, 8);
    assert.equal(report.componentStatusMatrix.length, 8);
    assert.ok(report.deliverableVerification);
    assert.ok(report.integrationVerification);
    assert.ok(report.productionReadiness);
    assert.ok(report.governanceCompliance);
    assert.ok(report.operationalReadiness);
    assert.ok(report.workflowCompleteness);
    assert.ok(report.reportingCapability);
    assert.ok(report.launchPackContractConsumed);
    assert.equal(report.certificationDecision, "Certified");
    assert.equal(report.auditStatus, "certified");
    assert.equal(report.confidenceScore, 1);
    assert.equal(report.metadataVersion, AFCRT_METADATA_VERSION);
    assert.equal(report.reportVersion, AFFILIATE_CERTIFICATION_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-affiliate-certification-01");
    assert.equal(report.submittedToExecutiveReporting, false);
    assert.equal(report.executiveReportId, null);
    assert.ok(report.traceabilityRefs.length >= 1);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.maskSensitiveValues, true);
    assert.equal(report.preserveCompleteTraceability, true);
    assert.equal(report.preserveCertificationAuditHistory, true);
    assert.equal(report.neverFabricateVerificationResults, true);
    assert.equal(report.neverCertifyUnsupportedFunctionality, true);
    assert.equal(report.neverImplementMissingFunctionality, true);
    assert.equal(report.neverAutoCorrectFailedImplementations, true);
    assert.equal(report.neverOverrideGovernance, true);
    assert.equal(report.neverOverrideApprovedArchitecture, true);
    assert.equal(report.neverOverridePillow, true);
    assert.equal(report.neverOverrideGrandKing, true);
    assert.equal(report.neverBypassGrandKingApproval, true);
    assert.equal(report.neverImplementQ901OrLater, true);
    assert.equal(report.finalQ8Gate, true);
    assert.equal(report.consumableByFutureSeries, false);
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("q9-01"),
      "must never reference or imply Q9-01 implementation",
    );
  });

  test("10 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createAffiliateCertification(bootstrap, {
      dependencies: {
        ...allWorkersReachable(),
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-afcrt-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = await engine.produceReport(sampleInput());
    const submitted = await engine.submitReport({
      reportId: produced.reportId,
      validated: true,
    });
    assert.deepEqual(submittedIds, ["Q8-09"]);
    assert.equal(submitted.submittedToExecutiveReporting, true);
    assert.equal(submitted.executiveReportId, "ert-worker-afcrt-001");
  });

  test("11 rejects Q9-01 / fabricate verification / certify unsupported / auto-correct / override governance", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { missionId: "Q9-01" },
      { fabricateVerificationResults: true },
      { certifyUnsupportedFunctionality: true },
      { implementMissingFunctionality: true },
      { autoCorrectFailedImplementations: true },
      { overrideGovernance: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
      { implementQ901OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.certificationDecision, "Failed");
    }
  });

  test("12 cockpit + component status classifications supported", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-09");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastCertificationDecision, "Certified");
    assert.equal(cockpit.workerId, "wkr-affiliate-certification-01");
    assert.deepEqual(
      [...cockpit.componentStatusOptions].sort(),
      [...COMPONENT_STATUSES].sort(),
    );
    assert.equal(cockpit.neverFabricateVerificationResults, true);
    assert.equal(cockpit.neverImplementQ901OrLater, true);
    assert.equal(cockpit.finalQ8Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q8-09");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.equal(engine.getComponentStatusMatrix().length, 8);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
