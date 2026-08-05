import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_SOURCES,
  AUDIT_STATUSES,
  CERTIFICATION_SOURCES,
  EAPRT_CAPABILITIES,
  EAPRT_METADATA_VERSION,
  EXECUTIVE_ACCEPTANCE_PACK_REPORT_VERSION,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  READINESS_EVIDENCE_SOURCES,
  buildExecutiveAcceptancePackConfiguration,
  createExecutiveAcceptancePack,
  isForbiddenMissionId,
  resetExecutiveAcceptancePackForTesting,
  type EaprtInput,
  type ExecutiveAcceptancePackDependencies,
} from "../../executive-acceptance-pack/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<EaprtInput> = {}): EaprtInput {
  return {
    grandKingInstructions:
      "Aggregate Q11 certification and audit evidence from injected handles only; never fabricate FINART completion, never hide failed audits, never approve production deployment; Grand King retains final authority.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

function certifiedReport(reportId: string, missionId?: string) {
  return {
    reportId,
    decision: "certify" as const,
    auditStatus: "certified",
    missionId,
  };
}

function allDependenciesReachable(includeFinart = false): ExecutiveAcceptancePackDependencies {
  const deps: Record<string, unknown> = {};
  deps.productionCertificationCore = {
    getState: () => ({ latestReport: certifiedReport("pccrt-rpt-001") }),
    getLatestReport: () => certifiedReport("pccrt-rpt-001"),
    getReports: () => [certifiedReport("pccrt-rpt-001")],
  };
  deps.sharedRuntimeCertification = {
    getState: () => ({ latestReport: certifiedReport("srcrt-rpt-001") }),
    getLatestReport: () => certifiedReport("srcrt-rpt-001"),
    getReports: () => [certifiedReport("srcrt-rpt-001")],
  };
  deps.workerReadinessAudit = {
    getLatestReport: () => certifiedReport("wrart-rpt-001", "Q11-02"),
    getReports: () => [certifiedReport("wrart-rpt-001", "Q11-02")],
  };
  deps.pillowCommandAudit = {
    getLatestReport: () => certifiedReport("pcart-rpt-001", "Q11-03"),
  };
  deps.businessFactoryAudit = {
    getLatestReport: () => certifiedReport("bfart-rpt-001", "Q11-04"),
  };
  deps.securityAudit = {
    getLatestReport: () => certifiedReport("secart-rpt-001", "Q11-05"),
  };
  deps.performanceAudit = {
    getLatestReport: () => certifiedReport("perfart-rpt-001", "Q11-06"),
  };
  deps.recoveryAudit = {
    getLatestReport: () => certifiedReport("recart-rpt-001", "Q11-07"),
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    getDashboard: () => ({ panels: [] }),
  };
  deps.auditRuntime = {
    getState: () => ({ status: "active" }),
    query: () => [],
  };
  deps.executiveReportingRuntime = {
    getState: () => ({ status: "active" }),
    submitWorkerReport: () => ({ records: [{ reportId: "ert-eaprt-test" }] }),
    retrieveReport: () => ({ report: {} }),
  };
  if (includeFinart) {
    deps.financialReadinessAudit = {
      getLatestReport: () => certifiedReport("finart-rpt-001", "Q11-08"),
      getQ1109ConsumableContract: () => ({
        contractVersion: "FINART-001-v1",
        consumerMissionId: "Q11-09",
        exposedFields: ["financialReadinessSummary", "decision"],
      }),
    };
  }
  return deps as ExecutiveAcceptancePackDependencies;
}

async function build(config?: Parameters<typeof createExecutiveAcceptancePack>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Executive Acceptance Pack tests");
  }
  const engine = createExecutiveAcceptancePack(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable(includeFinart = false) {
  return build({ dependencies: allDependenciesReachable(includeFinart) });
}

describe("Q11-09 Executive Acceptance Pack", () => {
  beforeEach(resetExecutiveAcceptancePackForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildExecutiveAcceptancePackConfiguration(REPO_ROOT, {
      neverFabricateAcceptanceEvidence: false as never,
      neverHideFailedAudits: false as never,
      neverApproveProductionDeployment: false as never,
      neverOverrideFailedCertifications: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1110OrLater: false as never,
    });
    assert.equal(c.neverFabricateAcceptanceEvidence, true);
    assert.equal(c.neverHideFailedAudits, true);
    assert.equal(c.neverApproveProductionDeployment, true);
    assert.equal(c.neverOverrideFailedCertifications, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1110OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutablePackHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicPackBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-EAPRT-001 Q11-09", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-09");
    assert.equal(state.engineVersion, "PILLOW-EAPRT-001");
    assert.equal(state.configuration.workerId, "wkr-executive-acceptance-pack-01");
    assert.equal(state.configuration.factory, "executive-acceptance-pack");
    assert.ok(EAPRT_CAPABILITIES.includes("collect_certification_reports"));
    assert.ok(EAPRT_CAPABILITIES.includes("collect_audit_reports"));
    assert.ok(EAPRT_CAPABILITIES.includes("expose_q1110_consumable_contract"));
    assert.ok(EAPRT_CAPABILITIES.includes("consume_q1109_consumable_contract"));
    for (const classification of READINESS_CLASSIFICATIONS) {
      assert.ok(
        ["certified", "partially_certified", "failed", "missing", "blocked", "deferred"].includes(classification),
      );
    }
    for (const decision of READINESS_DECISIONS) {
      assert.ok(["certify", "withhold", "escalate", "defer"].includes(decision));
    }
  });

  test("3 collects certification reports from injected handles", async () => {
    const bare = await build();
    const bareCerts = bare.collectCertificationReports();
    assert.equal(bareCerts.boundCount, 0);
    assert.equal(bareCerts.totalSources, CERTIFICATION_SOURCES.length);

    const engine = await buildFullyReachable();
    const certs = engine.collectCertificationReports();
    assert.equal(certs.boundCount, CERTIFICATION_SOURCES.length);
    for (const ref of certs.reports) {
      assert.ok((CERTIFICATION_SOURCES as readonly string[]).includes(ref.source));
      assert.equal(ref.bound, true);
    }
  });

  test("4 collects audit reports from injected Q11 engines", async () => {
    const engine = await buildFullyReachable();
    const audits = engine.collectAuditReports();
    assert.equal(audits.totalSources, AUDIT_SOURCES.length);
    const finart = audits.reports.find((r) => r.source === "financial-readiness-audit");
    assert.ok(finart);
    assert.equal(finart!.bound, false);
    assert.equal(finart!.classification, "missing");
    assert.ok(finart!.evidence.some((e) => e.includes("not implemented")));

    const requiredBound = audits.reports.filter(
      (r) => r.source !== "financial-readiness-audit",
    );
    for (const ref of requiredBound) {
      assert.equal(ref.bound, true);
      assert.equal(ref.classification, "certified");
    }
  });

  test("5 collects production readiness evidence", async () => {
    const bare = await build();
    const bareReadiness = bare.collectProductionReadinessEvidence();
    assert.equal(bareReadiness.evidencePresentCount, 0);

    const engine = await buildFullyReachable();
    const readiness = engine.collectProductionReadinessEvidence();
    assert.equal(readiness.totalSources, READINESS_EVIDENCE_SOURCES.length);
    assert.equal(readiness.evidencePresentCount, READINESS_EVIDENCE_SOURCES.length);
    assert.equal(readiness.overallClassification, "certified");
  });

  test("6 generates executive summary and outstanding issues", async () => {
    const engine = await buildFullyReachable();
    const summary = engine.generateExecutiveSummary(sampleInput());
    assert.ok(summary.includes("Q11-09"));
    assert.ok(summary.includes("Financial Readiness Audit not implemented"));
    const issues = engine.generateOutstandingIssueSummary(sampleInput());
    assert.ok(issues.some((i) => i.includes("Financial Readiness") || i.includes("not implemented")));
    assert.ok(issues.some((i) => i.includes("financial-readiness-audit")));
  });

  test("7 generates deployment recommendation and executive checklist", async () => {
    const engine = await buildFullyReachable();
    const recommendation = engine.generateDeploymentRecommendation(sampleInput());
    assert.equal(recommendation.grandKingDecisionRequired, true);
    assert.ok(["withhold", "defer", "escalate"].includes(recommendation.recommendation));
    assert.ok(recommendation.rationale.some((r) => r.includes("Grand King decides")));

    const checklist = engine.produceExecutiveChecklist();
    assert.ok(checklist.length > 0);
    const priorGate = checklist.find((item) => item.category === "prior_gate");
    assert.ok(priorGate);
    assert.equal(priorGate!.status, "missing");
  });

  test("8 full Executive Acceptance Pack Report + consumableByQ1110 with withhold when FINART missing", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("eaprt-rpt-"));
    assert.equal(report.packVersion, "Q11-EAPRT-v1");
    assert.equal(report.engineId, "PILLOW-EAPRT-001");
    assert.equal(report.missionId, "Q11-09");
    assert.ok(report.executiveSummary.length > 0);
    assert.ok(report.certificationSummary);
    assert.ok(report.auditSummary);
    assert.ok(report.productionReadinessSummary);
    assert.ok(report.riskSummary);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(report.deploymentRecommendation);
    assert.ok(Array.isArray(report.executiveChecklist));
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, EAPRT_METADATA_VERSION);
    assert.equal(report.reportVersion, EXECUTIVE_ACCEPTANCE_PACK_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-executive-acceptance-pack-01");
    assert.ok(READINESS_DECISIONS.includes(report.decision));
    assert.equal(report.decision, "withhold");
    assert.equal(report.deploymentRecommendation.recommendation, "withhold");
    assert.equal(report.q1109ContractConsumed.attempted, false);
    assert.equal(report.q1109ContractConsumed.consumed, false);
    assert.ok(report.q1109ContractConsumed.evidence.includes("not implemented"));
    assert.equal(report.consumableByQ1110, true);
    assert.equal(report.neverImplementQ1110OrLater, true);
    assert.equal(report.neverApproveProductionDeployment, true);
    assert.ok(report.acceptancePack.acceptancePackId.startsWith("eaprt-pack-"));
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.equal(report.auditStatus, "blocked");
  });

  test("9 exposes Q1110 contract without implementing Grand King Acceptance Gate", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1110ConsumableContract();
    assert.equal(contract.producedBy, "executive-acceptance-pack");
    assert.equal(contract.missionId, "Q11-09");
    assert.equal(contract.consumerMissionId, "Q11-10");
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.neverImplementQ1110OrLater, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("grand king acceptance gate implemented"),
      "must never claim to implement Grand King Acceptance Gate",
    );
  });

  test("10 rejects fabricate / hide-failed / approve-production / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateAcceptanceEvidence: true },
      { hideFailedAudits: true },
      { approveProductionDeployment: true },
      { overrideFailedCertifications: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1110OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.decision, "escalate");
    }
  });

  test("11 rejects Q11-10+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-09"), false);
    for (const missionId of ["Q11-10", "Q11-11", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.decision, "escalate");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-09" });
    assert.notEqual(selfOk.decision, "escalate");
  });

  test("12 cockpit + missing Q11-08 handled honestly + consumes Q1109 when injected stub contract provided", async () => {
    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1109ContractConsumed.attempted, false);
    assert.equal(bareReport.q1109ContractConsumed.consumed, false);
    assert.equal(bareReport.decision, "withhold");

    const finartEngine = await buildFullyReachable(true);
    const finartReport = await finartEngine.produceReport(sampleInput());
    assert.equal(finartReport.q1109ContractConsumed.attempted, true);
    assert.equal(finartReport.q1109ContractConsumed.consumed, true);
    assert.equal(finartReport.decision, "certify");
    assert.equal(finartReport.deploymentRecommendation.recommendation, "deploy");
    assert.notEqual(finartReport.deploymentRecommendation.recommendation, "approve");

    await finartEngine.produceReport(sampleInput());
    const cockpit = finartEngine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-09");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastDecision, "certify");
    assert.equal(cockpit.workerId, "wkr-executive-acceptance-pack-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateAcceptanceEvidence, true);
    assert.equal(cockpit.neverApproveProductionDeployment, true);
    assert.equal(cockpit.neverImplementQ1110OrLater, true);
    assert.equal(cockpit.ninthQ11Gate, true);

    const diagnostics = finartEngine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-09");
    assert.ok(finartEngine.getAuditTrail().length >= 1);
    assert.ok(finartEngine.getCatalog());
    assert.ok(finartEngine.getReports().length >= 1);
    assert.ok(finartEngine.list().length >= 1);
    assert.ok(finartEngine.getPackHistory().length >= 1);

    const sync = finartEngine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
