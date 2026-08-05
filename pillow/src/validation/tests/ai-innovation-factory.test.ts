import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { FACTORY_KEYS } from "../../shared-runtime-core/paths.js";
import {
  AIFRT_CAPABILITIES,
  AIFRT_METADATA_VERSION,
  AI_INNOVATION_FACTORY_REPORT_VERSION,
  buildAiInnovationFactoryConfiguration,
  createAiInnovationFactory,
  isForbiddenMissionId,
  resetAiInnovationFactoryForTesting,
  type AifrtInput,
  type AiInnovationFactoryDependencies,
} from "../../ai-innovation-factory/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<AifrtInput> = {}): AifrtInput {
  return {
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

function withholdQscptStub() {
  return {
    getLatestReport: () => ({ reportId: "qscpt-rpt-01", finalCompletionDecision: "withhold" }),
    getState: () => ({
      latestReport: { finalCompletionDecision: "withhold" },
      health: { lastCompletionDecision: "withhold" },
    }),
    getQ1201ConsumableContract: () => ({
      contractVersion: "QSCPT-001-v1",
      consumerMissionId: "Q12-01",
      exposedFields: ["finalCompletionDecision", "outstandingIssues"],
      seriesCompletePrerequisite: true,
      neverImplementQ1201OrLater: true,
    }),
  };
}

function completeQscptStub() {
  return {
    getLatestReport: () => ({ reportId: "qscpt-rpt-green", finalCompletionDecision: "complete" }),
    getState: () => ({
      latestReport: { finalCompletionDecision: "complete" },
      health: { lastCompletionDecision: "complete" },
    }),
    getQ1201ConsumableContract: () => ({
      contractVersion: "QSCPT-001-v1",
      consumerMissionId: "Q12-01",
      exposedFields: ["finalCompletionDecision", "outstandingIssues"],
      seriesCompletePrerequisite: true,
      neverImplementQ1201OrLater: true,
    }),
  };
}

function gkagtStub(decision = "pending") {
  return {
    getGrandKingDecision: () => decision,
    getDeploymentAuthorisationStatus: () => (decision === "approve" ? "authorised" : "blocked"),
    getLatestReport: () => ({
      grandKingDecision: decision,
      deploymentAuthorisationStatus: decision === "approve" ? "authorised" : "blocked",
    }),
    getState: () => ({
      grandKingDecision: decision,
      deploymentAuthorisationStatus: decision === "approve" ? "authorised" : "blocked",
    }),
    getQ1201ConsumableContract: () => ({
      contractVersion: "GKAGT-001-v1",
      consumerMissionId: "Q12-01",
      exposedFields: ["grandKingDecision", "deploymentAuthorisationStatus"],
    }),
  };
}

function innovationDeps(overrides: Partial<AiInnovationFactoryDependencies> = {}): AiInnovationFactoryDependencies {
  return {
    qSeriesCompletion: withholdQscptStub(),
    grandKingAcceptanceGate: gkagtStub("pending"),
    sharedRuntimeCore: {
      listFactories: () =>
        FACTORY_KEYS.slice(0, 2).map((factoryKey) => ({ factoryKey, status: "active" })),
      getState: () => ({ status: "active" }),
    },
    workerRegistry: {
      listWorkers: () => [{ workerId: "wkr-test-01", status: "active" }],
    },
    pillowOrchestrationRuntime: {
      getTopology: () => ({ workflows: [{ id: "wf-01" }] }),
      getState: () => ({ status: "active" }),
    },
    monitoringRuntime: { getState: () => ({ status: "active" }) },
    auditRuntime: { getState: () => ({ status: "active" }) },
    executiveReportingRuntime: {
      submitWorkerReport: () => ({ records: [{ reportId: "ert-aifrt-test" }] }),
    },
    ...overrides,
  };
}

async function build(deps?: AiInnovationFactoryDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for AI Innovation Factory tests");
  }
  const engine = createAiInnovationFactory(bootstrap, { dependencies: deps });
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q12-01 AI Innovation Factory", () => {
  beforeEach(resetAiInnovationFactoryForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildAiInnovationFactoryConfiguration(REPO_ROOT, {
      neverFabricateResearchEvidence: false as never,
      neverAutoDeployInnovations: false as never,
      neverBypassGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1301OrLater: false as never,
      neverClaimQSeriesCompleteWhenIncomplete: false as never,
    });
    assert.equal(c.neverFabricateResearchEvidence, true);
    assert.equal(c.neverAutoDeployInnovations, true);
    assert.equal(c.neverBypassGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1301OrLater, true);
    assert.equal(c.neverClaimQSeriesCompleteWhenIncomplete, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveInnovationHistory, true);
    assert.equal(c.evidenceBasedOnly, true);
  });

  test("2 initializes PILLOW-AIFRT-001 Q12-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q12-01");
    assert.equal(state.engineVersion, "PILLOW-AIFRT-001");
    assert.equal(state.configuration.workerId, "wkr-ai-innovation-factory-01");
    assert.equal(state.configuration.factory, "ai-innovation-factory");
    assert.ok(AIFRT_CAPABILITIES.includes("research_emerging_technologies"));
    assert.ok(AIFRT_CAPABILITIES.includes("consume_q1201_consumable_contract"));
    assert.ok(AIFRT_CAPABILITIES.includes("expose_q1301_consumable_contract"));
    assert.ok(AIFRT_CAPABILITIES.includes("never_auto_deploy_innovations"));
  });

  test("3 verify series-complete prerequisite false when QSCPT withhold", async () => {
    const engine = await build(innovationDeps());
    const prerequisite = engine.verifySeriesCompletePrerequisite();
    assert.equal(prerequisite.q1201Consumed, true);
    assert.equal(prerequisite.finalCompletionDecision, "withhold");
    assert.equal(prerequisite.seriesCompleteActivation, false);
    assert.ok(prerequisite.outstandingPrerequisiteIssues.some((i) => i.includes("not complete")));
  });

  test("4 research technologies and track models/APIs", async () => {
    const engine = await build(innovationDeps());
    const tech = engine.researchEmergingTechnologies();
    assert.ok(tech.catalogEntries >= 8);
    assert.ok(tech.injectedEvidenceCount >= 1);
    assert.ok(tech.evidence.some((e) => e.includes("catalog_based_only")));

    const models = engine.trackModelsAndApis();
    assert.ok(models.trackedModels.length >= 1);
    assert.ok(models.evidence.some((e) => e.includes("evidence refs")));
  });

  test("5 discover business opportunities architecture and operational improvements", async () => {
    const engine = await build(innovationDeps());
    const business = engine.discoverBusinessOpportunities();
    assert.ok(business.opportunities.length >= 1);
    assert.ok(business.evidence.some((e) => e.includes("factory_opportunities")));

    const architecture = engine.evaluateArchitecturalImprovements();
    assert.ok(architecture.recommendations.length >= 1);

    const operational = engine.analyseOperationalImprovements();
    assert.ok(operational.improvements.length >= 1);
  });

  test("6 prioritise proposals deterministically", async () => {
    const engine = await build(innovationDeps());
    const report = await engine.produceReport(sampleInput());
    const ranking = engine.prioritiseInnovationProposals(report.proposals);
    assert.ok(ranking.ranking.length >= 1);
    assert.ok(ranking.evidence.some((e) => e.includes("deterministic scoring")));
    const scores = ranking.ranking.map((r) => r.score);
    for (let i = 1; i < scores.length; i++) {
      assert.ok(scores[i - 1] >= scores[i], "ranking must be descending by score");
    }
  });

  test("7 generate recommendations without deploying", async () => {
    const engine = await build(innovationDeps());
    const report = await engine.produceReport(sampleInput());
    const recommendations = engine.generateImplementationRecommendations(report.proposals);
    assert.ok(recommendations.length >= 1);
    for (const rec of recommendations) {
      assert.ok(rec.recommendation.includes("never auto-deploy") || rec.recommendation.includes("await Pillow/GK"));
      assert.notEqual(rec.approvalStatus, "deployed" as never);
      assert.ok(rec.supportingEvidence.some((e) => e.includes("neverAutoDeployInnovations")));
    }
  });

  test("8 full report consumableByQ1301 with seriesCompleteActivation false when incomplete", async () => {
    const engine = await build(innovationDeps());
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.seriesCompleteActivation, false);
    assert.equal(report.q1201ContractConsumed.consumed, true);
    assert.equal(report.consumableByQ1301, true);
    assert.equal(report.neverImplementQ1301OrLater, true);
    assert.equal(report.neverAutoDeployInnovations, true);
    assert.ok(report.outstandingIssues.some((i) => i.includes("seriesCompleteActivation=false")));
    assert.ok(report.proposals.length >= 1);
    assert.notEqual(report.validation.decision, "fail");
  });

  test("9 series-complete activation path when QSCPT complete stub injected", async () => {
    const engine = await build(
      innovationDeps({
        qSeriesCompletion: completeQscptStub(),
        grandKingAcceptanceGate: gkagtStub("approve"),
      }),
    );
    const prerequisite = engine.verifySeriesCompletePrerequisite();
    assert.equal(prerequisite.seriesCompleteActivation, true);
    assert.equal(prerequisite.finalCompletionDecision, "complete");

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.seriesCompleteActivation, true);
    assert.ok(report.confidenceScore > 0.5);
  });

  test("10 Q1301 contract without implementing Q13-01", async () => {
    const engine = await build(innovationDeps());
    const contract = engine.getQ1301ConsumableContract();
    assert.equal(contract.producedBy, "ai-innovation-factory");
    assert.equal(contract.missionId, "Q12-01");
    assert.equal(contract.consumerMissionId, "Q13-01");
    assert.equal(contract.innovationPrerequisite, true);
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.neverImplementQ1301OrLater, true);
    assert.ok(!JSON.stringify(contract).toLowerCase().includes("q13-01 implemented"));
  });

  test("11 rejects fabricate auto-deploy bypass governance override GK", async () => {
    const engine = await build(innovationDeps({ qSeriesCompletion: completeQscptStub() }));
    for (const forbidden of [
      { fabricateResearchEvidence: true },
      { autoDeployInnovations: true },
      { bypassGovernance: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1301OrLater: true },
      { claimQSeriesComplete: true },
      { forceApprove: true },
    ] as const) {
      const report = await engine.produceReport({ ...sampleInput(), ...forbidden });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.seriesCompleteActivation, false);
    }
  });

  test("12 rejects Q13-01+; cockpit consume Q1201 and innovation history", async () => {
    const engine = await build(innovationDeps());
    assert.equal(isForbiddenMissionId("Q12-01"), false);
    for (const missionId of ["Q12-02", "Q13-01", "Q14-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({ ...sampleInput(), missionId });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
    }

    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q12-01");
    assert.equal(cockpit.neverAutoDeployInnovations, true);
    assert.equal(cockpit.neverImplementQ1301OrLater, true);

    const history = engine.getInnovationHistory();
    assert.ok(history.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q12-01");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.equal((await engine.produceReport(sampleInput())).metadataVersion, AIFRT_METADATA_VERSION);
    assert.equal((await engine.produceReport(sampleInput())).reportVersion, AI_INNOVATION_FACTORY_REPORT_VERSION);

    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 0);
  });
});
