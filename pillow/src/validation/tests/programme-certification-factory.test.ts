import assert from "node:assert/strict";
import { join } from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PCFCT_CAPABILITIES,
  PCFCT_METADATA_VERSION,
  PROGRAMME_CERTIFICATION_FACTORY_REPORT_VERSION,
  CONSTITUTIONAL_PROGRAMME_CODES,
  buildProgrammeCertificationFactoryConfiguration,
  createProgrammeCertificationFactory,
  isForbiddenMissionId,
  resetProgrammeCertificationFactoryForTesting,
  type ProgrammeCertificationFactoryDependencies,
  type PcfctInput,
} from "../../programme-certification-factory/index.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<PcfctInput> = {}): PcfctInput {
  return {
    missionId: "Q13-06",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function irplnStub() {
  return {
    getQ1306ConsumableContract: () => ({
      contractVersion: "IRPLN-001-v1",
      consumerMissionId: "Q13-06",
      exposedFields: ["missionSummary", "recoveryAnalysis", "plans"],
      neverImplementQ1306OrLater: true,
      recoveryPrerequisite: true,
    }),
    getLatestReport: () => ({ reportId: "irpln-rpt-01", confidenceScore: 0.85 }),
    getLatestPlan: () => ({ recoveryId: "irpln-rec-01", missionId: "Q13-05" }),
  };
}

function csgenStub() {
  return { getLatestReport: () => ({ reportId: "csgen-rpt-01", confidenceScore: 0.85 }) };
}

function riengStub() {
  return {
    getLatestReport: () => ({
      reportId: "rieng-rpt-01",
      confidenceScore: 0.85,
      snapshot: { repositorySnapshotId: "snap-1", repositoryFingerprint: "fp1", repositoryVersion: "v1" },
    }),
  };
}

function mpengStub() {
  return { getLatestReport: () => ({ reportId: "mpeng-rpt-01", plans: [{ planId: "plan-1", missionId: "Q13-06" }] }) };
}

function isengStub() {
  return { getLatestReport: () => ({ reportId: "iseng-rpt-01", specifications: [{ specId: "spec-1", missionId: "Q13-01" }] }) };
}

function pcfctDeps(overrides: Partial<ProgrammeCertificationFactoryDependencies> = {}): ProgrammeCertificationFactoryDependencies {
  return {
    implementationRecoveryPlanner: irplnStub(),
    cursorSpecificationGenerator: csgenStub(),
    repositoryIntelligenceEngine: riengStub(),
    implementationSpecificationEngine: isengStub(),
    missionPlanningEngine: mpengStub(),
    pillowOrchestrationRuntime: { getTopology: () => ({ workflows: [{ id: "wf-01" }] }), getState: () => ({ status: "active" }) },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: { submitWorkerReport: () => ({ records: [{ reportId: "ert-pcfct-test" }] }) },
    ...overrides,
  };
}

async function build(deps?: ProgrammeCertificationFactoryDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Programme Certification Factory tests");
  }
  const engine = createProgrammeCertificationFactory(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

async function certifyAllProgrammes(engine: Awaited<ReturnType<typeof build>>) {
  engine.discoverApprovedProgrammes();
  engine.auditProgrammeRepository(sampleInput());
  for (const code of CONSTITUTIONAL_PROGRAMME_CODES) {
    engine.certifyProgramme(sampleInput({ programmeCode: code }));
  }
}

describe("Q13-06 Programme Certification Factory", () => {
  beforeEach(resetProgrammeCertificationFactoryForTesting);

  test("1 locks boundaries (neverFabricate, neverAutoModify, neverCertifyFromClaimsAlone, neverImplementFutureProgramme, neverBypassGovernance)", () => {
    const c = buildProgrammeCertificationFactoryConfiguration(REPO_ROOT, {
      neverFabricateFindings: false as never,
      neverAutoModifyProduction: false as never,
      neverImplementFutureProgramme: false as never,
    });
    assert.equal(c.neverFabricateFindings, true);
    assert.equal(c.neverAutoModifyProduction, true);
    assert.equal(c.neverCertifyFromClaimsAlone, true);
    assert.equal(c.neverImplementFutureProgramme, true);
    assert.equal(c.neverImplementQ1307OrLater, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.programmeCertificationOnly, true);
  });

  test("2 initializes PILLOW-PCFCT-001 Q13-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q13-06");
    assert.equal(state.engineVersion, "PILLOW-PCFCT-001");
    assert.equal(state.configuration.workerId, "wkr-programme-certification-factory-01");
    assert.equal(state.configuration.factory, "programme-certification-factory");
    assert.ok(PCFCT_CAPABILITIES.includes("discover_approved_programmes"));
    assert.ok(PCFCT_CAPABILITIES.includes("consume_q1306_contract"));
    assert.ok(PCFCT_CAPABILITIES.includes("expose_q_series_constitutional_completion_contract"));
    assert.ok(PCFCT_CAPABILITIES.includes("never_implement_future_programme"));
  });

  test("3 discover all programmes G,P,E,K,T,R,X,Q", async () => {
    const engine = await build(pcfctDeps());
    const programmes = engine.discoverApprovedProgrammes();
    assert.equal(programmes.length, 8);
    const codes = programmes.map((p) => p.programmeCode).sort();
    assert.deepEqual(codes, ["E", "G", "K", "P", "Q", "R", "T", "X"]);
    const kSeries = programmes.find((p) => p.programmeCode === "K");
    assert.ok(kSeries?.intentionallyDeferred);
    const gSeries = programmes.find((p) => p.programmeCode === "G");
    assert.ok(gSeries?.evidencePresent);
  });

  test("4 audit programmes from repository evidence (phase docs / pillow audits)", async () => {
    const engine = await build(pcfctDeps());
    engine.discoverApprovedProgrammes();
    const audits = engine.auditProgrammeRepository(sampleInput()) as import("../../programme-certification-factory/types.js").ProgrammeAuditResult[];
    assert.ok(Array.isArray(audits));
    assert.equal(audits.length, 8);
    const gAudit = audits.find((a) => a.programmeCode === "G");
    assert.ok(gAudit?.certificationDocPresent);
    assert.equal(gAudit?.readOnly, true);
    const qAudit = audits.find((a) => a.programmeCode === "Q");
    assert.ok(qAudit!.missionInventory.length >= 1);
  });

  test("5 classify missions; K Series Intentionally Deferred with evidence", async () => {
    const engine = await build(pcfctDeps());
    engine.discoverApprovedProgrammes();
    engine.auditProgrammeRepository(sampleInput());
    const kMissions = engine.classifyMissions(sampleInput({ programmeCode: "K" }));
    assert.ok(kMissions.some((m) => m.classification === "Intentionally Deferred"));
    assert.ok(kMissions.some((m) => m.evidenceReferences.some((e) => e.includes("intentionally"))));
    const qMissions = engine.classifyMissions(sampleInput({ programmeCode: "Q" }));
    assert.ok(qMissions.some((m) => m.classification === "Completed"));
  });

  test("6 gap analysis + completion recommendations (no auto-modify)", async () => {
    const engine = await build(pcfctDeps());
    engine.discoverApprovedProgrammes();
    engine.auditProgrammeRepository(sampleInput());
    const gap = engine.produceProgrammeGapAnalysis(sampleInput({ programmeCode: "Q" }));
    assert.ok(gap.gapSummary.length >= 1);
    const recs = engine.generateCompletionRecommendations(sampleInput({ programmeCode: "Q" }));
    for (const rec of recs) {
      assert.equal(rec.autoApplyForbidden, true);
    }
    const kRecs = engine.generateCompletionRecommendations(sampleInput({ programmeCode: "K" }));
    assert.ok(kRecs.some((r) => r.action === "defer"));
  });

  test("7 certify individual programmes (each gets certification record)", async () => {
    const engine = await build(pcfctDeps());
    await certifyAllProgrammes(engine);
    const certs = engine.getCertifications();
    assert.equal(certs.length, 8);
    for (const code of CONSTITUTIONAL_PROGRAMME_CODES) {
      assert.ok(certs.some((c) => c.programmeCode === code), `missing cert for ${code}`);
    }
    const kCert = certs.find((c) => c.programmeCode === "K");
    assert.equal(kCert?.certificationStatus, "intentionally_deferred");
  });

  test("8 Final Repository Constitutional Certification only after all individual certs; remaining exceptions recorded if any", async () => {
    const engine = await build(pcfctDeps());
    engine.discoverApprovedProgrammes();
    engine.auditProgrammeRepository(sampleInput());
    assert.throws(
      () => engine.produceFinalRepositoryConstitutionalCertification(sampleInput()),
      /requires individual records for all programmes/,
    );
    for (const code of CONSTITUTIONAL_PROGRAMME_CODES) {
      engine.certifyProgramme(sampleInput({ programmeCode: code }));
    }
    const final = engine.produceFinalRepositoryConstitutionalCertification(sampleInput());
    assert.equal(final.missionId, "Q13-06");
    assert.equal(final.neverImplementFutureProgramme, true);
    assert.equal(final.neverImplementQ1307OrLater, true);
    assert.ok(final.certifiedProgrammes.length >= 1);
    assert.ok(final.deferredProgrammes.includes("K Series"));
    assert.ok(Array.isArray(final.remainingConstitutionalExceptions));
  });

  test("9 consume Q1306; never claim future programme implemented", async () => {
    const engine = await build(pcfctDeps());
    engine.discoverApprovedProgrammes();
    engine.auditProgrammeRepository(sampleInput());
    const report = await engine.produceProgrammeCertificationReport(sampleInput({ programmeCode: "Q" }));
    assert.equal(report.q1306ContractConsumed.consumed, true);
    assert.ok(report.q1306ContractConsumed.fields.length > 0);
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("q13-07 implemented"));
    assert.ok(!serialized.includes("future programme implemented"));
  });

  test("10 Q Series constitutional completion contract; neverImplementFutureProgramme", async () => {
    const engine = await build(pcfctDeps());
    await certifyAllProgrammes(engine);
    engine.produceFinalRepositoryConstitutionalCertification(sampleInput());
    const contract = engine.getQSeriesConstitutionalCompletionContract();
    assert.equal(contract.producedBy, "programme-certification-factory");
    assert.equal(contract.missionId, "Q13-06");
    assert.equal(contract.neverImplementFutureProgramme, true);
    assert.equal(contract.neverImplementQ1307OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.certificationPrerequisite, true);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-07 implemented"));
  });

  test("11 reject invent missions / fabricate / auto-modify / bypass governance / certify-from-claims-only", async () => {
    const engine = await build(pcfctDeps());
    engine.discoverApprovedProgrammes();
    engine.auditProgrammeRepository(sampleInput());
    for (const forbidden of [
      { fabricateFindings: true },
      { autoModifyProduction: true },
      { certifyFromClaimsAlone: true },
      { bypassGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1307OrLater: true },
      { inventMissions: true },
      { missionId: "Q13-07" },
      { missionId: "Q14-01" },
    ] as Partial<PcfctInput>[]) {
      const report = await engine.produceProgrammeCertificationReport({
        ...sampleInput({ programmeCode: "Q" }),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "failed");
      assert.ok(report.validation.errors.length >= 1);
    }
  });

  test("12 reject Q13-07+; cockpit + certification history; Q Series final mission stop", async () => {
    const engine = await build(pcfctDeps());
    await certifyAllProgrammes(engine);
    await engine.produceProgrammeCertificationReport(sampleInput({ programmeCode: "Q" }));
    engine.produceFinalRepositoryConstitutionalCertification(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q13-06");
    assert.equal(cockpit.neverFabricateFindings, true);
    assert.equal(cockpit.neverAutoModifyProduction, true);
    assert.equal(cockpit.neverCertifyFromClaimsAlone, true);
    assert.equal(cockpit.neverImplementFutureProgramme, true);
    assert.equal(cockpit.neverImplementQ1307OrLater, true);
    assert.equal(cockpit.neverBypassGovernance, true);
    assert.equal(cockpit.finalQSeriesMission, true);
    assert.ok(cockpit.programmesCertified >= 8);
    const history = engine.getCertificationHistory();
    assert.ok(history.length >= 1);
    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q13-06");
    assert.equal(diagnostics.q1306PrerequisitePresent, true);
    assert.equal(diagnostics.finalQSeriesMission, true);
    assert.equal(isForbiddenMissionId("Q13-06"), false);
    assert.equal(isForbiddenMissionId("Q13-07"), true);
    assert.equal(isForbiddenMissionId("Q14-01"), true);
    const contract = engine.getQSeriesConstitutionalCompletionContract();
    assert.equal(contract.neverImplementFutureProgramme, true);
  });
});
