import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildCapitalRiskWorkerConfiguration,
  createCapitalRiskWorker,
  resetCapitalRiskWorkerForTesting,
  type CaprwInput,
} from "../../capital-risk-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../");

async function build(config?: Parameters<typeof createCapitalRiskWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCapitalRiskWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "caprw-biz-alpha-01";
const PERIOD = "2026-Q2";

function baseInput(overrides: Partial<CaprwInput> = {}): CaprwInput {
  return {
    capitalBusinessId: BIZ,
    capitalProjectId: "cap-proj-caprw-01",
    reportingPeriod: PERIOD,
    currency: "SGD",
    validated: true,
    budgetSnapshot: {
      plannedMinor: 1_000_000,
      actualMinor: 1_200_000,
      currency: "SGD",
      sourceRefs: ["budget-snap-2026-q2"],
      fabricated: false,
    },
    cashflowSnapshot: {
      netCashflowMinor: -50_000,
      cashPositionMinor: 80_000,
      currency: "SGD",
      sourceRefs: ["cf-snap-2026-q2"],
      fabricated: false,
    },
    profitabilitySnapshot: {
      netProfitMinor: 400_000,
      marginBps: 800,
      priorMarginBps: 1200,
      currency: "SGD",
      sourceRefs: ["profit-snap-2026-q2"],
      fabricated: false,
    },
    revenueSnapshot: {
      totalMinor: 4_500_000,
      priorTotalMinor: 5_000_000,
      currency: "SGD",
      sourceRefs: ["rev-snap-2026-q2"],
      fabricated: false,
    },
    investmentSnapshot: {
      opportunities: [
        {
          opportunityId: "inv-opp-under-01",
          expectedRoiBps: 200,
          recommendation: "reject",
          capitalRequiredMinor: 500_000,
          evidenceRefs: ["ipw-evidence-01"],
        },
      ],
      currency: "SGD",
      sourceRefs: ["ipw-snap-2026-q2"],
      fabricated: false,
    },
    liquiditySnapshot: {
      runwayDays: 21,
      currency: "SGD",
      sourceRefs: ["liq-snap-2026-q2"],
      fabricated: false,
    },
    ...overrides,
  };
}

describe("Q9-10 Capital Risk Worker", () => {
  beforeEach(resetCapitalRiskWorkerForTesting);

  test("1 locks mandatory capital-risk-worker boundaries", () => {
    const c = buildCapitalRiskWorkerConfiguration(REPO_ROOT, {
      neverApproveFinancialDecisions: false as never,
      neverExecuteInvestments: false as never,
      neverMoveCapital: false as never,
      neverModifyAccountingRecords: false as never,
      neverFabricateRisksOrEvidence: false as never,
      neverAutomaticallyExecuteMitigation: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ911OrLater: false as never,
      preserveRiskHistory: false as never,
    });
    assert.equal(c.neverApproveFinancialDecisions, true);
    assert.equal(c.neverExecuteInvestments, true);
    assert.equal(c.neverMoveCapital, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverFabricateRisksOrEvidence, true);
    assert.equal(c.neverAutomaticallyExecuteMitigation, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ911OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveRiskHistory, true);
    assert.equal(c.observedRisksDistinctFromPredictions, true);
    assert.equal(c.structuralSignalOnly, true);
  });

  test("2 initializes PILLOW-CAPRW-001 for Q9-10 with risk catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-10");
    assert.equal(state.engineVersion, "PILLOW-CAPRW-001");
    assert.equal(state.configuration.workerId, "wkr-capital-risk-01");
    assert.ok(state.configuration.riskCategories.includes("overspending"));
    assert.ok(state.configuration.severityLevels.includes("critical"));
  });

  test("3 detects overspending from verified budget snapshot", async () => {
    const engine = await build();
    const result = engine.detectRisks(baseInput());
    assert.equal(result.action, "detect_risks");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.detectedRisks!.some((r) => r.category === "overspending"));
    const overspend = result.detectedRisks!.find((r) => r.category === "overspending")!;
    assert.equal(overspend.fabricated, false);
    assert.ok(overspend.evidenceRefs.length >= 1);
  });

  test("4 detects cash shortage from verified cashflow snapshot", async () => {
    const engine = await build();
    const result = engine.detectRisks(baseInput());
    assert.ok(result.detectedRisks!.some((r) => r.category === "cash_shortage"));
    const shortage = result.detectedRisks!.find((r) => r.category === "cash_shortage")!;
    assert.equal(shortage.fabricated, false);
    assert.ok(shortage.magnitudeMinor != null);
  });

  test("5 identifies liquidity risk from verified liquidity snapshot", async () => {
    const engine = await build();
    const result = engine.detectRisks(baseInput());
    assert.ok(result.detectedRisks!.some((r) => r.category === "liquidity"));
    const liquidity = result.detectedRisks!.find((r) => r.category === "liquidity")!;
    assert.equal(liquidity.severity, "medium");
    assert.equal(liquidity.fabricated, false);
  });

  test("6 identifies underperforming investment from verified snapshot", async () => {
    const engine = await build();
    const result = engine.detectRisks(baseInput());
    assert.ok(result.detectedRisks!.some((r) => r.category === "underperforming_investment"));
    const inv = result.detectedRisks!.find((r) => r.category === "underperforming_investment")!;
    assert.equal(inv.fabricated, false);
    assert.ok(inv.evidenceRefs.includes("ipw-evidence-01"));
  });

  test("7 calculates severity correctly and prioritises risks", async () => {
    const engine = await build();
    const result = engine.prioritiseRisks(baseInput());
    assert.equal(result.action, "prioritise_risks");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.prioritisedRisks!.length >= 1);
    const severities = result.prioritisedRisks!.map((r) => r.severity);
    const order = ["critical", "high", "medium", "low", "info"];
    for (let i = 1; i < severities.length; i++) {
      assert.ok(order.indexOf(severities[i - 1]!) <= order.indexOf(severities[i]!));
    }
    for (const risk of result.prioritisedRisks!) {
      assert.ok(risk.probabilityBps >= 0 && risk.probabilityBps <= 10000);
      assert.ok(risk.impactBps >= 0 && risk.impactBps <= 10000);
    }
  });

  test("8 generates executive risk dashboard", async () => {
    const engine = await build();
    const result = engine.generateExecutiveRiskDashboard(baseInput());
    assert.equal(result.action, "generate_executive_risk_dashboard");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.executiveRiskSummary);
    assert.ok(result.enterpriseRiskDashboard);
    assert.ok(result.enterpriseRiskDashboard!.widgets.length >= 1);
    assert.equal(result.executiveRiskSummary!.fabricated, false);
  });

  test("9 produces Capital Risk Report with all required fields and consumableByQ911", async () => {
    const engine = await build();
    const produced = engine.produceCapitalRiskReport(baseInput());
    assert.equal(produced.action, "produce_capital_risk_report");
    assert.equal(produced.validation.decision, "pass");
    const report = produced.capitalRiskReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.capitalProjectId, "cap-proj-caprw-01");
    assert.equal(report.reportingPeriod, PERIOD);
    assert.ok(report.executiveRiskSummary);
    assert.ok(report.enterpriseRiskDashboard);
    assert.ok(report.detectedRisks.length >= 1);
    assert.ok(report.prioritisedRisks.length >= 1);
    assert.ok(Array.isArray(report.recommendedMitigations));
    assert.ok(report.overspendSummary);
    assert.ok(report.cashShortageSummary);
    assert.ok(report.liquiditySummary);
    assert.ok(report.investmentRiskSummary);
    assert.ok(report.budgetOverrunSummary);
    assert.ok(report.trendRiskSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.equal(typeof report.confidenceScore, "number");
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.equal(report.metadataVersion, "CAPRW-001-v1");
    assert.equal(report.consumableByQ911, true);
    assert.equal(report.neverApproveFinancialDecisions, true);
    assert.equal(report.neverExecuteInvestments, true);
    assert.equal(report.neverFabricateRisksOrEvidence, true);
    assert.equal(report.neverAutomaticallyExecuteMitigation, true);
    assert.equal(report.observedRisksDistinctFromPredictions, true);
  });

  test("10 rejects fabricated snapshots and unvalidated input", async () => {
    const engine = await build();
    const unvalidated = engine.produceCapitalRiskReport(baseInput({ validated: false }));
    assert.equal(unvalidated.validation.decision, "fail");

    const noRefs = engine.produceCapitalRiskReport(
      baseInput({
        budgetSnapshot: {
          plannedMinor: 100,
          actualMinor: 200,
          currency: "SGD",
          sourceRefs: [],
          fabricated: false,
        },
      }),
    );
    assert.equal(noRefs.validation.decision, "fail");
  });

  test("11 rejects Q9-11+ mission requests", async () => {
    const engine = await build();
    const future = engine.produceCapitalRiskReport({
      ...baseInput(),
      missionId: "Q9-11",
    } as CaprwInput & { missionId: string });
    assert.equal(future.validation.decision, "fail");
    assert.ok(future.validation.errors.some((e) => /Q9-11/i.test(e)));
  });

  test("12 never executes mitigation — Q911 contract and cockpit enforced", async () => {
    const engine = await build();
    engine.produceCapitalRiskReport(baseInput());
    const contract = engine.getQ911ConsumableContract();
    assert.equal(contract.missionId, "Q9-10");
    assert.equal(contract.consumerMissionId, "Q9-11");
    assert.equal(contract.producedBy, "capital-risk-worker");
    assert.equal(contract.neverImplementQ911OrLater, true);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.neverApproveFinancialDecisions, true);
    assert.equal(cockpit.neverExecuteInvestments, true);
    assert.equal(cockpit.neverAutomaticallyExecuteMitigation, true);
    assert.equal(cockpit.consumableByQ911, true);
    const report = engine.getLatestReport()!;
    assert.equal(report.neverApproveFinancialDecisions, true);
    assert.equal(report.neverMoveCapital, true);
    assert.equal(report.neverAutomaticallyExecuteMitigation, true);
    for (const mit of report.recommendedMitigations) {
      assert.equal(mit.isAutomaticExecution, false);
    }
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
  });
});
