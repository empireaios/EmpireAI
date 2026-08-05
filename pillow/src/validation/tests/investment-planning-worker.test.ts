import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildInvestmentPlanningWorkerConfiguration,
  createInvestmentPlanningWorker,
  rankOpportunities,
  resetInvestmentPlanningWorkerForTesting,
  type InvestmentOpportunityInput,
  type IpwInput,
} from "../../investment-planning-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../");

async function build(config?: Parameters<typeof createInvestmentPlanningWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createInvestmentPlanningWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "ipw-biz-alpha-01";
const PERIOD = "2026-Q2";

function opp(
  opportunityId: string,
  overrides: Partial<InvestmentOpportunityInput> = {},
): InvestmentOpportunityInput {
  return {
    opportunityId,
    opportunityType: "internal_project",
    businessOrProject: `project-${opportunityId}`,
    capitalRequiredMinor: 500_000,
    currency: "SGD",
    expectedRoiBps: 2500,
    expectedPaybackPeriods: 24,
    strategicAlignmentBps: 7000,
    riskScoreBps: 2000,
    operationalDependencies: [],
    evidenceRefs: [`evidence-${opportunityId}`],
    assumptions: ["Caller-supplied ROI and payback projections documented"],
    fabricated: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<IpwInput> = {}): IpwInput {
  return {
    capitalBusinessId: BIZ,
    capitalProjectId: "cap-proj-ipw-01",
    planningPeriod: PERIOD,
    currency: "SGD",
    availableCapitalMinor: 2_000_000,
    validated: true,
    opportunities: [
      opp("opp-alpha", { expectedRoiBps: 8000, strategicAlignmentBps: 9000, riskScoreBps: 1000, expectedPaybackPeriods: 12 }),
      opp("opp-beta", { expectedRoiBps: 7500, strategicAlignmentBps: 8500, riskScoreBps: 1500, expectedPaybackPeriods: 12 }),
    ],
    ...overrides,
  };
}

describe("Q9-08 Investment Planning Worker", () => {
  beforeEach(resetInvestmentPlanningWorkerForTesting);

  test("1 locks mandatory investment-planning-worker boundaries", () => {
    const c = buildInvestmentPlanningWorkerConfiguration(REPO_ROOT, {
      neverExecuteInvestments: false as never,
      neverApproveInvestments: false as never,
      neverMoveOrAllocateCapital: false as never,
      neverModifyAccountingRecords: false as never,
      neverFabricateRoiOrPaybackOrRecommendations: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ909OrLater: false as never,
      preserveInvestmentHistory: false as never,
    });
    assert.equal(c.neverExecuteInvestments, true);
    assert.equal(c.neverApproveInvestments, true);
    assert.equal(c.neverMoveOrAllocateCapital, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverFabricateRoiOrPaybackOrRecommendations, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ909OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveInvestmentHistory, true);
    assert.equal(c.measuredDataDistinctFromProjections, true);
    assert.equal(c.structuralSignalOnly, true);
  });

  test("2 initializes PILLOW-IPW-001 for Q9-08 with investment catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-08");
    assert.equal(state.engineVersion, "PILLOW-IPW-001");
    assert.equal(state.configuration.workerId, "wkr-investment-planning-01");
    assert.ok(state.configuration.opportunityTypes.includes("reinvestment"));
    assert.equal(state.configuration.scoringWeights.roiBps, 35);
  });

  test("3 evaluates opportunities with deterministic scores", async () => {
    const engine = await build();
    const evaluated = engine.evaluateOpportunities(baseInput());
    assert.equal(evaluated.action, "evaluate_opportunities");
    assert.equal(evaluated.validation.decision, "pass");
    assert.ok(evaluated.evaluatedOpportunities);
    assert.equal(evaluated.evaluatedOpportunities!.length, 2);
    assert.ok(evaluated.evaluatedOpportunities!.every((o) => o.opportunityScore >= 0 && o.opportunityScore <= 10000));
    assert.ok(evaluated.evaluatedOpportunities!.every((o) => o.fabricated === false));
  });

  test("4 generates capital allocation recommendations without execution", async () => {
    const engine = await build();
    const produced = engine.produceInvestmentPlanningReport(baseInput());
    assert.equal(produced.validation.decision, "pass");
    assert.ok(produced.capitalAllocationRecommendations);
    assert.ok(produced.capitalAllocationRecommendations!.length >= 1);
    assert.ok(
      produced.capitalAllocationRecommendations!.every(
        (r) => r.isExecution === false && r.isApproval === false && r.signalKind === "capital_allocation_recommendation",
      ),
    );
  });

  test("5 ranks opportunities deterministically by score then id", async () => {
    const engine = await build();
    const ranked = engine.rankOpportunities(
      baseInput({
        opportunities: [
          opp("opp-zulu", { expectedRoiBps: 3000 }),
          opp("opp-alpha", { expectedRoiBps: 8000, strategicAlignmentBps: 9000, riskScoreBps: 1000 }),
          opp("opp-mike", { expectedRoiBps: 8000, strategicAlignmentBps: 9000, riskScoreBps: 1000 }),
        ],
      }),
    );
    assert.equal(ranked.validation.decision, "pass");
    const ids = ranked.rankedOpportunities!.map((o) => o.opportunityId);
    assert.equal(ids[0], "opp-alpha");
    assert.equal(ids[1], "opp-mike");
    const resorted = rankOpportunities(ranked.rankedOpportunities!);
    assert.deepEqual(resorted.map((o) => o.opportunityId), ids);
  });

  test("6 applies risk-adjusted ranking", async () => {
    const engine = await build();
    const ranked = engine.rankOpportunities(
      baseInput({
        opportunities: [
          opp("low-risk", { riskScoreBps: 1000, expectedRoiBps: 4000 }),
          opp("high-risk", { riskScoreBps: 9000, expectedRoiBps: 4000 }),
        ],
      }),
    );
    assert.equal(ranked.rankedOpportunities![0]!.opportunityId, "low-risk");
    assert.ok(ranked.rankedOpportunities![0]!.opportunityScore > ranked.rankedOpportunities![1]!.opportunityScore);
  });

  test("7 assesses strategic alignment in scoring", async () => {
    const engine = await build();
    const ranked = engine.rankOpportunities(
      baseInput({
        opportunities: [
          opp("aligned", { strategicAlignmentBps: 9500, expectedRoiBps: 2000 }),
          opp("misaligned", { strategicAlignmentBps: 1000, expectedRoiBps: 2000 }),
        ],
      }),
    );
    assert.equal(ranked.rankedOpportunities![0]!.opportunityId, "aligned");
  });

  test("8 links supporting evidence to evaluated opportunities", async () => {
    const engine = await build();
    const evaluated = engine.evaluateOpportunities(baseInput());
    for (const item of evaluated.evaluatedOpportunities!) {
      assert.ok(item.supportingEvidence.includes(`evidence-${item.opportunityId}`));
      assert.ok(item.evidenceRefs.length >= 1);
    }
  });

  test("9 produces machine-readable Investment Planning Report with consumableByQ909", async () => {
    const engine = await build();
    const produced = engine.produceInvestmentPlanningReport(baseInput());
    assert.equal(produced.action, "produce_investment_planning_report");
    assert.equal(produced.validation.decision, "pass");
    const report = produced.investmentPlanningReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.capitalProjectId, "cap-proj-ipw-01");
    assert.equal(report.planningPeriod, PERIOD);
    assert.ok(report.evaluatedOpportunities.length >= 1);
    assert.ok(report.rankedOpportunities.length >= 1);
    assert.ok(Array.isArray(report.capitalAllocationRecommendations));
    assert.ok(report.riskAssessment);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.equal(report.evaluationPeriod, PERIOD);
    assert.equal(report.planningPeriod, PERIOD);
    assert.ok(Array.isArray(report.investmentOpportunities));
    assert.ok(Array.isArray(report.opportunityRankings));
    assert.ok(report.expectedRoiSummary);
    assert.equal(report.expectedRoiSummary.recordKind, "projected_caller_supplied");
    assert.ok(report.paybackSummary);
    assert.ok(report.strategicAlignmentSummary);
    assert.equal(typeof report.confidenceScore, "number");
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.equal(report.metadataVersion, "IPW-001-v1");
    assert.equal(report.consumableByQ909, true);
    assert.equal(report.neverExecuteInvestments, true);
    assert.equal(report.neverMoveOrAllocateCapital, true);
    assert.equal(report.measuredDataDistinctFromProjections, true);
  });

  test("10 rejects fabricated opportunities and missing evidence", async () => {
    const engine = await build();
    const missingEvidence = engine.evaluateOpportunities(
      baseInput({
        opportunities: [opp("bad-opp", { evidenceRefs: [] })],
      }),
    );
    assert.equal(missingEvidence.validation.decision, "fail");

    const missingAssumptions = engine.evaluateOpportunities(
      baseInput({
        opportunities: [opp("no-assume", { assumptions: [] })],
      }),
    );
    assert.equal(missingAssumptions.validation.decision, "fail");
  });

  test("11 rejects Q9-09+ mission requests", async () => {
    const engine = await build();
    const future = engine.evaluateOpportunities({
      ...baseInput(),
      missionId: "Q9-09",
    } as IpwInput & { missionId: string });
    assert.equal(future.validation.decision, "fail");
    assert.ok(future.validation.errors.some((e) => /Q9-09/i.test(e)));
  });

  test("12 never executes investments — report and cockpit flags enforced", async () => {
    const engine = await build();
    engine.produceInvestmentPlanningReport(baseInput());
    const contract = engine.getQ909ConsumableContract();
    assert.equal(contract.missionId, "Q9-08");
    assert.equal(contract.consumerMissionId, "Q9-09");
    assert.equal(contract.producedBy, "investment-planning-worker");
    assert.equal(contract.neverImplementQ909OrLater, true);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.neverExecuteInvestments, true);
    assert.equal(cockpit.neverApproveInvestments, true);
    assert.equal(cockpit.consumableByQ909, true);
    const report = engine.getLatestReport()!;
    assert.equal(report.neverExecuteInvestments, true);
    assert.equal(report.neverApproveInvestments, true);
    assert.equal(report.neverMoveOrAllocateCapital, true);
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
  });
});
