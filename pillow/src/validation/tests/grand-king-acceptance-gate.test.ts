import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import type { ExecutiveAcceptancePackReport } from "../../executive-acceptance-pack/types.js";
import {
  AUDIT_STATUSES,
  DEPLOYMENT_AUTHORISATION_STATUSES,
  GKAGT_CAPABILITIES,
  GKAGT_METADATA_VERSION,
  GRAND_KING_ACCEPTANCE_GATE_REPORT_VERSION,
  GRAND_KING_DECISIONS,
  buildGrandKingAcceptanceGateConfiguration,
  createGrandKingAcceptanceGate,
  isForbiddenMissionId,
  resetGrandKingAcceptanceGateForTesting,
  type GkagtInput,
  type GrandKingAcceptanceGateDependencies,
} from "../../grand-king-acceptance-gate/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<GkagtInput> = {}): GkagtInput {
  return {
    grandKingInstructions:
      "Review Executive Acceptance Pack evidence; never fabricate approval; never bypass Grand King approval; deployment blocked until explicit approve with prerequisites satisfied.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function certifiedPackReport(overrides: Partial<ExecutiveAcceptancePackReport> = {}): ExecutiveAcceptancePackReport {
  const now = new Date().toISOString();
  const baseCert = {
    computedAt: now,
    totalSources: 2,
    boundCount: 2,
    certifiedCount: 2,
    partiallyCertifiedCount: 0,
    failedCount: 0,
    missingCount: 0,
    blockedCount: 0,
    deferredCount: 0,
    reports: [],
    evidence: ["pccrt certified", "srcrt certified"],
  };
  return {
    reportId: "eaprt-rpt-cert-001",
    timestamp: now,
    packVersion: "Q11-EAPRT-v1",
    engineId: "PILLOW-EAPRT-001",
    missionId: "Q11-09",
    executiveSummary: "Executive Acceptance Pack certified for Grand King review.",
    certificationSummary: baseCert,
    auditSummary: { ...baseCert, reports: [] },
    productionReadinessSummary: {
      computedAt: now,
      totalSources: 3,
      boundCount: 3,
      evidencePresentCount: 3,
      overallClassification: "certified",
      sources: [],
      evidence: ["monitoring", "audit", "reporting"],
    },
    riskSummary: { computedAt: now, totalRisks: 0, criticalRisks: [], moderateRisks: [], lowRisks: [], evidence: [] },
    outstandingIssues: [],
    deploymentRecommendation: {
      computedAt: now,
      recommendation: "deploy",
      rationale: ["All Q11 gates satisfied"],
      grandKingDecisionRequired: true,
      evidence: [],
    },
    executiveChecklist: [],
    supportingEvidence: ["pack-certified"],
    confidenceScore: 0.95,
    metadataVersion: "EAPRT-001-v1",
    reportVersion: "EAPRT-RPT-v1",
    workerId: "wkr-executive-acceptance-pack-01",
    acceptancePack: {
      acceptancePackId: "eaprt-pack-001",
      repositoryVersion: "EAPRT-001-v1",
      certificationSummary: baseCert,
      auditSummary: { ...baseCert, reports: [] },
      readinessSummary: {
        computedAt: now,
        totalSources: 3,
        boundCount: 3,
        evidencePresentCount: 3,
        overallClassification: "certified",
        sources: [],
        evidence: [],
      },
      riskSummary: { computedAt: now, totalRisks: 0, criticalRisks: [], moderateRisks: [], lowRisks: [], evidence: [] },
      outstandingIssues: [],
      deploymentRecommendation: {
        computedAt: now,
        recommendation: "deploy",
        rationale: [],
        grandKingDecisionRequired: true,
        evidence: [],
      },
      executiveChecklist: [],
      supportingEvidence: [],
      auditReference: "eaprt:001",
      generationTimestamp: now,
    },
    decision: "certify",
    auditStatus: "certified",
    validation: {
      validationReportId: "eaprt-val-001",
      validationTimestamp: now,
      decision: "pass",
      errors: [],
      warnings: [],
      durationMs: 1,
      metadataVersion: "EAPRT-001-v1",
    },
    integrationSummary: {
      verifiedAt: now,
      rows: [],
      totalTargets: 12,
      boundCount: 12,
      allBound: true,
      evidence: [],
    },
    governanceSummary: {
      compliant: true,
      grandKingApprovalRequired: true,
      executiveAcceptancePackRequired: true,
      selfDocPresent: true,
      selfDocPath: "docs/governance/EMPIREAI_EXECUTIVE_ACCEPTANCE_PACK_SYSTEM.md",
      boundaryLocksHonoured: true,
      evidence: [],
    },
    q1109ContractConsumed: { attempted: true, consumed: true, contractVersion: "FINART-001-v1", fields: ["decision"], evidence: "consumed" },
    consumableByQ1110: true,
    neverImplementQ1110OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    ninthQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutablePackHistory: true,
    preserveAuditHistory: true,
    deterministicPackBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAcceptanceEvidence: true,
    neverHideFailedAudits: true,
    neverApproveProductionDeployment: true,
    neverOverrideFailedCertifications: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    ...overrides,
  } as ExecutiveAcceptancePackReport;
}

function withholdPackReport(): ExecutiveAcceptancePackReport {
  return certifiedPackReport({
    reportId: "eaprt-rpt-withhold-001",
    decision: "withhold",
    auditStatus: "blocked",
    deploymentRecommendation: {
      computedAt: new Date().toISOString(),
      recommendation: "withhold",
      rationale: ["FINART missing"],
      grandKingDecisionRequired: true,
      evidence: ["Q11-08 not implemented"],
    },
    outstandingIssues: ["Financial Readiness Audit not implemented"],
    q1109ContractConsumed: {
      attempted: false,
      consumed: false,
      contractVersion: null,
      fields: [],
      evidence: "Q11-08 Financial Readiness Audit not implemented",
    },
  });
}

function allDependenciesReachable(certified = false): GrandKingAcceptanceGateDependencies {
  const packReport = certified ? certifiedPackReport() : withholdPackReport();
  return {
    executiveAcceptancePack: {
      getLatestReport: () => packReport,
      getReports: () => [packReport],
      getQ1110ConsumableContract: () => ({
        contractVersion: "EAPRT-001-v1",
        consumerMissionId: "Q11-10",
        exposedFields: ["decision", "acceptancePack"],
        neverImplementQ1110OrLater: true,
      }),
    },
    productionCertificationCore: {
      getLatestReport: () => ({ reportId: "pccrt-rpt-001", decision: "certify" }),
    },
    sharedRuntimeCertification: {
      getLatestReport: () => ({ reportId: "srcrt-rpt-001", decision: "certify" }),
    },
    executiveReportingRuntime: {
      getState: () => ({ status: "active" }),
      submitWorkerReport: () => ({ records: [{ reportId: "ert-gkagt-test" }] }),
    },
    approvalRuntime: { getState: () => ({ status: "active" }) },
    auditRuntime: { getState: () => ({ status: "active" }), query: () => [] },
    monitoringRuntime: { getState: () => ({ status: "active" }), getDashboard: () => ({ panels: [] }) },
  };
}

async function build(config?: Parameters<typeof createGrandKingAcceptanceGate>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Grand King Acceptance Gate tests");
  }
  const engine = createGrandKingAcceptanceGate(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable(certified = false) {
  return build({ dependencies: allDependenciesReachable(certified) });
}

describe("Q11-10 Grand King Acceptance Gate", () => {
  beforeEach(resetGrandKingAcceptanceGateForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildGrandKingAcceptanceGateConfiguration(REPO_ROOT, {
      neverFabricateApprovalEvidence: false as never,
      neverBypassGrandKingApproval: false as never,
      neverAuthoriseWithoutApproval: false as never,
      neverOverrideFailedCertifications: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1201OrLater: false as never,
    });
    assert.equal(c.neverFabricateApprovalEvidence, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverAuthoriseWithoutApproval, true);
    assert.equal(c.neverOverrideFailedCertifications, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1201OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableApprovalHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicGateBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-GKAGT-001 Q11-10", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-10");
    assert.equal(state.engineVersion, "PILLOW-GKAGT-001");
    assert.equal(state.configuration.workerId, "wkr-grand-king-acceptance-gate-01");
    assert.equal(state.configuration.factory, "grand-king-acceptance-gate");
    assert.ok(GKAGT_CAPABILITIES.includes("collect_executive_acceptance_pack"));
    assert.ok(GKAGT_CAPABILITIES.includes("consume_q1110_consumable_contract"));
    assert.ok(GKAGT_CAPABILITIES.includes("expose_q1201_consumable_contract"));
    assert.ok(GKAGT_CAPABILITIES.includes("final_q11_gate"));
    for (const decision of GRAND_KING_DECISIONS) {
      assert.ok(["approve", "reject", "defer", "pending"].includes(decision));
    }
    for (const auth of DEPLOYMENT_AUTHORISATION_STATUSES) {
      assert.ok(["authorised", "blocked", "revoked", "pending"].includes(auth));
    }
  });

  test("3 collects Executive Acceptance Pack", async () => {
    const bare = await build();
    const barePack = bare.collectExecutiveAcceptancePack();
    assert.equal(barePack.packReportId, null);
    assert.ok(barePack.evidence.some((e) => e.includes("not injected")));

    const engine = await buildFullyReachable();
    const pack = engine.collectExecutiveAcceptancePack();
    assert.equal(pack.packReportId, "eaprt-rpt-withhold-001");
    assert.equal(pack.packDecision, "withhold");
    assert.ok(pack.packReport);
  });

  test("4 verifies prerequisite certifications", async () => {
    const withholdEngine = await buildFullyReachable(false);
    const withholdPrereqs = withholdEngine.verifyPrerequisiteCertifications();
    assert.equal(withholdPrereqs.pccrtCertified, true);
    assert.equal(withholdPrereqs.q1110ContractConsumed, true);
    assert.equal(withholdPrereqs.allPrerequisitesMet, false);
    assert.ok(withholdPrereqs.outstandingIssues.some((i) => i.includes("withhold") || i.includes("decision=withhold")));

    const certEngine = await buildFullyReachable(true);
    const certPrereqs = certEngine.verifyPrerequisiteCertifications();
    assert.equal(certPrereqs.allPrerequisitesMet, true);
    assert.equal(certPrereqs.packDecisionCertify, true);
  });

  test("5 presents production readiness", async () => {
    const engine = await buildFullyReachable();
    const presentation = engine.presentProductionReadiness();
    assert.ok(presentation.executiveAcceptanceSummary.length > 0);
    assert.ok(presentation.presentationPayload);
    assert.equal(presentation.presentationPayload.grandKingDecisionRequired, true);
    assert.equal(presentation.presentationPayload.deploymentAuthorisationStatus, "blocked");
    assert.ok(Array.isArray(presentation.outstandingIssues));
  });

  test("6 deployment blocked before approval", async () => {
    const engine = await buildFullyReachable(true);
    const blocked = engine.preventDeploymentWithoutApproval();
    assert.equal(blocked.blocked, true);
    assert.equal(blocked.deploymentAuthorisationStatus, "blocked");
    assert.equal(engine.getDeploymentAuthorisationStatus(), "blocked");
    assert.equal(engine.getState().grandKingDecision, "pending");
  });

  test("7 record reject/defer workflows", async () => {
    const engine = await buildFullyReachable(true);

    const reject = engine.recordGrandKingDecision({
      ...sampleInput(),
      grandKingApproved: true,
      grandKingDecision: "reject",
      decisionComments: "Outstanding issues remain",
    });
    assert.equal(reject.grandKingDecision, "reject");
    assert.equal(reject.deploymentAuthorisationStatus, "blocked");
    assert.equal(reject.authorisationPermitted, false);

    const defer = engine.recordGrandKingDecision({
      ...sampleInput(),
      grandKingApproved: true,
      grandKingDecision: "defer",
      decisionComments: "Need more evidence",
    });
    assert.equal(defer.grandKingDecision, "defer");
    assert.equal(defer.deploymentAuthorisationStatus, "blocked");
  });

  test("8 approve + generate deployment authorisation only when prerequisites+approval satisfied", async () => {
    const withholdEngine = await buildFullyReachable(false);
    const withholdApprove = withholdEngine.recordGrandKingDecision({
      ...sampleInput(),
      grandKingApproved: true,
      grandKingDecision: "approve",
      decisionComments: "Attempt approve with withhold pack",
    });
    assert.equal(withholdApprove.grandKingDecision, "approve");
    assert.equal(withholdApprove.authorisationPermitted, false);
    assert.equal(withholdApprove.deploymentAuthorisationStatus, "blocked");

    const certEngine = await buildFullyReachable(true);
    const auth = certEngine.generateDeploymentAuthorisation({
      ...sampleInput(),
      grandKingApproved: true,
      grandKingDecision: "approve",
      decisionComments: "Grand King approves production deployment",
    });
    assert.equal(auth.issued, true);
    assert.ok(auth.deploymentAuthorisation);
    assert.equal(auth.deploymentAuthorisationStatus, "authorised");
    assert.equal(certEngine.getDeploymentAuthorisationStatus(), "authorised");
  });

  test("9 exposes Q1201 contract without implementing Q12", async () => {
    const engine = await buildFullyReachable(true);
    const contract = engine.getQ1201ConsumableContract();
    assert.equal(contract.producedBy, "grand-king-acceptance-gate");
    assert.equal(contract.missionId, "Q11-10");
    assert.equal(contract.consumerMissionId, "Q12-01");
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.neverImplementQ1201OrLater, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("q12-01 implemented"),
      "must never claim to implement Q12-01",
    );

    const q1111 = engine.getQ1111ConsumableContract();
    assert.equal(q1111.producedBy, "grand-king-acceptance-gate");
    assert.equal(q1111.consumerMissionId, "Q11-11");
    assert.equal(q1111.neverImplementQ1111OrLater, true);
    assert.ok(q1111.exposedFields.includes("grandKingDecision"));
    assert.ok(q1111.exposedFields.includes("deploymentAuthorisationStatus"));
  });

  test("10 rejects fabricate/bypass/authorise-without-approval/override-failed", async () => {
    const engine = await buildFullyReachable(true);
    for (const forbidden of [
      { fabricateApprovalEvidence: true },
      { bypassGrandKingApproval: true },
      { authoriseWithoutApproval: true },
      { overrideFailedCertifications: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1201OrLater: true },
      { forceApprove: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        grandKingApproved: true,
        grandKingDecision: "approve",
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.grandKingDecision, "reject");
      assert.equal(report.deploymentAuthorisationStatus, "blocked");
    }
  });

  test("11 rejects Q12-01+ missionId", async () => {
    const engine = await buildFullyReachable(true);
    assert.equal(isForbiddenMissionId("Q11-10"), false);
    for (const missionId of ["Q12-01", "Q12-02", "Q13-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.grandKingDecision, "reject");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-10" });
    assert.notEqual(selfOk.validation.decision, "fail");
  });

  test("12 cockpit + consume Q1110 + immutable history + re-review", async () => {
    const withholdEngine = await buildFullyReachable(false);
    const withholdReport = await withholdEngine.produceReport(sampleInput());
    assert.equal(withholdReport.q1110ContractConsumed.consumed, true);
    assert.equal(withholdReport.grandKingDecision, "pending");
    assert.equal(withholdReport.deploymentAuthorisationStatus, "blocked");

    const certEngine = await buildFullyReachable(true);
    await certEngine.recordGrandKingDecision({
      ...sampleInput(),
      grandKingApproved: true,
      grandKingDecision: "approve",
      decisionComments: "Approved for production",
    });
    await certEngine.produceReport({
      ...sampleInput(),
      grandKingApproved: true,
      grandKingDecision: "approve",
    });

    const cockpit = certEngine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-10");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.grandKingDecision, "approve");
    assert.equal(cockpit.workerId, "wkr-grand-king-acceptance-gate-01");
    assert.equal(cockpit.neverFabricateApprovalEvidence, true);
    assert.equal(cockpit.neverImplementQ1201OrLater, true);
    assert.equal(cockpit.finalQ11Gate, true);

    const reReview = certEngine.requestReReview({ decisionComments: "Post-deploy audit requested" });
    assert.equal(reReview.reReviewStatus, "requested");

    const history = certEngine.getApprovalHistory();
    assert.ok(history.length >= 1);

    const diagnostics = certEngine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-10");
    assert.ok(certEngine.getAuditTrail().length >= 1);
    assert.ok(certEngine.getCatalog());
    assert.ok(certEngine.getReports().length >= 1);
    assert.equal(withholdReport.metadataVersion, GKAGT_METADATA_VERSION);
    assert.equal(withholdReport.reportVersion, GRAND_KING_ACCEPTANCE_GATE_REPORT_VERSION);
    assert.ok(AUDIT_STATUSES.includes(withholdReport.auditStatus));

    const sync = certEngine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
