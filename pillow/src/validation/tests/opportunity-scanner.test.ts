import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildOpportunityScannerConfiguration,
  createOpportunityScanner,
  OSC_CAPABILITIES,
  resetOpportunityScannerForTesting,
} from "../../opportunity-scanner/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createOpportunityScanner(bootstrap);
  await engine.initialize();
  engine.connectOpportunityScanner();
  return engine;
}

describe("Q0-02 Opportunity Scanner", () => {
  beforeEach(resetOpportunityScannerForTesting);

  test("1 locks mandatory scanner boundaries", () => {
    const c = buildOpportunityScannerConfiguration(REPO_ROOT, {
      neverExecuteOpportunities: false as never,
      neverApproveOpportunities: false as never,
      neverAssignWorkers: false as never,
      neverCreateBusinesses: false as never,
    });
    assert.equal(c.neverExecuteOpportunities, true);
    assert.equal(c.neverApproveOpportunities, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverCreateBusinesses, true);
  });

  test("2 initializes PILLOW-OSC-001 for Q0-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-02");
    assert.equal(state.engineVersion, "PILLOW-OSC-001");
  });

  test("3 accepts configured domains", async () => {
    const report = (await build()).configureDomains({
      domains: ["market_expansion", "cost_efficiency"],
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    assert.deepEqual(report.engineRecord.configuredDomains, ["market_expansion", "cost_efficiency"]);
  });

  test("4 scans business and operational opportunities", async () => {
    const engine = await build();
    const business = engine.scanBusinessOpportunities({
      domains: ["market_expansion", "revenue_growth", "cost_efficiency"],
      validated: true,
    });
    const operational = engine.scanOperationalOpportunities({
      domains: ["market_expansion", "revenue_growth", "cost_efficiency"],
      validated: true,
    });
    assert.ok(business.opportunities.every((o) => o.opportunityCategory === "business"));
    assert.ok(operational.opportunities.every((o) => o.opportunityCategory === "operational"));
    assert.ok(business.opportunities.length >= 1);
    assert.ok(operational.opportunities.length >= 1);
  });

  test("5 returns scored machine-readable opportunity records", async () => {
    const opp = (await build()).scanAllOpportunities({
      domains: ["product_innovation", "process_automation"],
      validated: true,
      signalHints: ["automation"],
    }).opportunities[0]!;
    assert.ok(opp.opportunityId.startsWith("osc-opp-"));
    assert.ok(opp.sourceSignal.startsWith("structural://"));
    assert.ok(opp.summary.length > 0);
    assert.ok(opp.businessValueHypothesis.length > 0);
    assert.ok(opp.feasibilityScore >= 0 && opp.feasibilityScore <= 100);
    assert.ok(opp.profitPotentialScore >= 0 && opp.profitPotentialScore <= 100);
    assert.ok(opp.riskScore >= 0 && opp.riskScore <= 100);
    assert.ok(opp.confidenceScore >= 0 && opp.confidenceScore <= 100);
    assert.ok(opp.relevanceScore >= 0 && opp.relevanceScore <= 100);
    assert.ok(opp.recommendedNextStep.length > 0);
    assert.equal(opp.metadataVersion, "OSC-001-v1");
  });

  test("6 marks opportunities pending Pillow review", async () => {
    const engine = await build();
    engine.scanAllOpportunities({ domains: ["customer_retention"], validated: true });
    const marked = engine.markOpportunitiesForReview({ validated: true });
    assert.ok(marked.opportunities.every((o) => o.reviewStatus === "pending_pillow_review"));
    assert.ok(engine.getPendingReview().length >= 1);
  });

  test("7 rejects execute / approve / assign / create boundary violations", async () => {
    const engine = await build();
    assert.equal(engine.scanAllOpportunities({ validated: true, executeOpportunities: true }).validation.decision, "fail");
    assert.equal(engine.scanAllOpportunities({ validated: true, approveOpportunities: true }).validation.decision, "fail");
    assert.equal(engine.scanAllOpportunities({ validated: true, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.scanAllOpportunities({ validated: true, createBusinesses: true }).validation.decision, "fail");
  });

  test("8 rejects unvalidated scans and preserves boundary flags on records", async () => {
    const engine = await build();
    assert.equal(engine.scanAllOpportunities({ validated: false }).validation.decision, "fail");
    const opp = engine.scanAllOpportunities({ domains: ["capital_allocation"], validated: true }).opportunities[0]!;
    assert.equal(opp.neverExecuteOpportunities, true);
    assert.equal(opp.opportunityExecuted, false);
    assert.equal(opp.opportunityApproved, false);
    assert.equal(opp.workersAssigned, false);
    assert.equal(opp.businessCreated, false);
    assert.ok(opp.opportunityTraceId.startsWith("osc-trace-"));
  });

  test("9 validates stored opportunities", async () => {
    const engine = await build();
    engine.scanAllOpportunities({ domains: ["supply_chain", "talent_leverage"], validated: true });
    assert.equal(engine.validateOpportunities({ validated: true }).validation.decision, "pass");
  });

  test("10 reports health and diagnostics", async () => {
    const engine = await build();
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.equal(engine.getCockpitSnapshot().neverCreateBusinesses, true);
    assert.ok(OSC_CAPABILITIES.includes("scan_business_opportunities"));
  });
});
