import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DPR_APPROVED_RESEARCH_SOURCES,
  DPR_CAPABILITIES,
  DPR_DEMAND_LEVELS,
  DPR_DISCOVERY_SOURCES,
  DPR_EVIDENCE_KINDS,
  DPR_INTEGRATION_TARGETS,
  DPR_METADATA_VERSION,
  DPR_PRIORITY_LEVELS,
  DPR_PRODUCT_CATEGORIES,
  DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION,
  buildDigitalProductResearchWorkerConfiguration,
  createDigitalProductResearchWorker,
  resetDigitalProductResearchWorkerForTesting,
} from "../../digital-product-research-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createDigitalProductResearchWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDigitalProductResearchWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const sampleInput = {
  businessId: "dbiz-toolkit-01",
  factoryMissionId: "dpf-dpm-toolkit-01",
  productCategory: "toolkit" as const,
  productType: "toolkit" as const,
  targetAudience: "Solo founders building digital toolkits",
  researchTopic: "Notion-style productivity toolkits for freelancers",
  discoverySource: "approved_research_feed" as const,
  customerPainPoints: [
    "Fragmented freelancing workflows across too many apps",
    "No affordable starter toolkit for client onboarding",
  ],
  marketGap: "Affordable multi-template toolkit for freelance onboarding is underserved",
  demandAssessment: "Search and community demand rising for freelancer toolkit packs",
  demandLevel: "high" as const,
  demandScore: 78,
  competitorSummary: "Two large competitors price above SMB willingness; limited niche packs",
  competitorNotes: "Competitor A and B focus on enterprise suites",
  revenuePotential: "Strong mid-ticket digital toolkit revenue with recurring updates",
  revenuePotentialScore: 74,
  opportunityScore: 81,
  confidenceScore: 76,
  recommendedPriority: "high" as const,
  searchDemandNotes: "Search interest up week-over-week for freelance toolkit templates",
  emergingTrendNotes: "AI-assisted freelancing packs trending in creator communities",
  nicheNotes: "Underserved niche: client-onboarding kits for solo consultants",
  supportingEvidence: [
    {
      source: "approved_research_feed",
      claim: "Search interest for freelancer toolkit packs up 35% month-over-month",
      kind: "fact" as const,
      relatedTopic: "search_demand",
    },
    {
      source: "social_listening",
      claim: "Projected conversion lift from niche pack positioning",
      kind: "assumption" as const,
      relatedTopic: "commercial_opportunity",
    },
  ],
  validated: true,
};

describe("Q5-02 Digital Product Research Worker", () => {
  beforeEach(resetDigitalProductResearchWorkerForTesting);

  test("1 locks mandatory digital-product-research-worker boundaries", () => {
    const c = buildDigitalProductResearchWorkerConfiguration(REPO_ROOT, {
      neverCreateDigitalProducts: false as never,
      neverCreateSalesPages: false as never,
      neverProcessPayments: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverInventUnsupportedMarketEvidence: false as never,
      neverImplementQ503OrLater: false as never,
      useApprovedResearchSourcesOnly: false as never,
    });
    assert.equal(c.neverCreateDigitalProducts, true);
    assert.equal(c.neverCreateSalesPages, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverInventUnsupportedMarketEvidence, true);
    assert.equal(c.neverImplementQ503OrLater, true);
    assert.equal(c.useApprovedResearchSourcesOnly, true);
  });

  test("2 initializes PILLOW-DPR-001 for Q5-02 with DPF integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-02");
    assert.equal(state.engineVersion, "PILLOW-DPR-001");
    assert.equal(state.configuration.workerId, "wkr-digital-product-research-01");
    for (const target of DPR_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const category of DPR_PRODUCT_CATEGORIES) {
      assert.ok(typeof category === "string");
    }
    for (const source of DPR_DISCOVERY_SOURCES) {
      assert.ok(DPR_APPROVED_RESEARCH_SOURCES.includes(source));
    }
    for (const priority of DPR_PRIORITY_LEVELS) {
      assert.ok(typeof priority === "string");
    }
    for (const kind of DPR_EVIDENCE_KINDS) {
      assert.ok(typeof kind === "string");
    }
    for (const level of DPR_DEMAND_LEVELS) {
      assert.ok(typeof level === "string");
    }
    assert.ok(DPR_CAPABILITIES.includes("analyse_customer_pain_points"));
    assert.ok(DPR_CAPABILITIES.includes("produce_machine_readable_digital_product_research_reports"));
  });

  test("3 analyses customer pain points", async () => {
    const report = (await build()).analyseCustomerPainPoints(sampleInput);
    assert.equal(report.action, "analyse_customer_pain_points");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.latestResearchReport!.customerPainPoints.length >= 1);
    assert.ok(report.latestResearchReport!.researchReportId.startsWith("dpr-rsh-"));
  });

  test("4 analyses market gaps and search demand", async () => {
    const engine = await build();
    const gaps = engine.analyseMarketGaps(sampleInput);
    assert.equal(gaps.action, "analyse_market_gaps");
    assert.ok(gaps.latestResearchReport!.marketGap.length > 0);

    const demand = engine.analyseSearchDemand(sampleInput);
    assert.equal(demand.action, "analyse_search_demand");
    assert.ok(demand.latestResearchReport!.demandScore > 0);
    assert.ok(demand.latestResearchReport!.demandAssessment.length > 0);
  });

  test("5 analyses competitor products", async () => {
    const report = (await build()).analyseCompetitorProducts(sampleInput);
    assert.equal(report.action, "analyse_competitor_products");
    assert.ok(report.latestResearchReport!.competitorSummary.length > 0);
  });

  test("6 discovers niches and estimates demand / commercial opportunity", async () => {
    const engine = await build();
    const niches = engine.discoverUnderservedNiches(sampleInput);
    assert.equal(niches.action, "discover_underserved_niches");
    assert.ok(niches.latestResearchReport!.marketGap.length > 0);

    const demand = engine.estimateDemand(sampleInput);
    assert.equal(demand.action, "estimate_demand");
    assert.ok(demand.latestResearchReport!.demandScore >= 70);

    const commercial = engine.estimateCommercialOpportunity(sampleInput);
    assert.equal(commercial.action, "estimate_commercial_opportunity");
    assert.ok(commercial.latestResearchReport!.revenuePotentialScore > 0);
    assert.ok(commercial.latestResearchReport!.opportunityScore > 0);
  });

  test("7 ranks opportunities by score", async () => {
    const engine = await build();
    const ranked = engine.rankOpportunities(sampleInput);
    assert.equal(ranked.action, "rank_opportunities");
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.latestResearchReport!.opportunityScore > 0);
    assert.ok(ranked.latestResearchReport!.recommendedPriority);
    assert.ok(ranked.latestResearchReport!.ranking === 1 || ranked.latestResearchReport!.ranking === null || ranked.latestResearchReport!.ranking >= 1);
  });

  test("8 produces Digital Product Research Report with all required fields", async () => {
    const report = (await build()).produceDigitalProductResearchReport(sampleInput);
    const latest = report.latestResearchReport!;
    assert.ok(latest.researchReportId.startsWith("dpr-rsh-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.opportunityId.startsWith("dpr-opp-"));
    assert.equal(latest.productCategory, "toolkit");
    assert.equal(latest.targetAudience, "Solo founders building digital toolkits");
    assert.ok(Array.isArray(latest.customerPainPoints));
    assert.ok(latest.customerPainPoints.length >= 1);
    assert.ok(latest.marketGap.length > 0);
    assert.ok(latest.demandAssessment.length > 0);
    assert.ok(latest.competitorSummary.length > 0);
    assert.ok(latest.revenuePotential.length > 0);
    assert.ok(latest.opportunityScore > 0);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.supportingEvidence.some((e) => e.kind === "fact"));
    assert.ok(latest.supportingEvidence.some((e) => e.kind === "assumption"));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, DPR_METADATA_VERSION);
    assert.equal(latest.reportVersion, DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION);
    assert.equal(latest.neverCreateDigitalProducts, true);
    assert.equal(latest.neverInventUnsupportedMarketEvidence, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects create-product/sales-page/payment/invent-evidence/override/Q5-03/unapproved source", async () => {
    const engine = await build();
    for (const forbidden of [
      { createDigitalProducts: true },
      { createSalesPages: true },
      { processPayments: true },
      { inventUnsupportedMarketEvidence: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ503OrLater: true },
      { useUnapprovedSource: true },
      { discoverySource: "unapproved_scraper" },
    ] as const) {
      const report = engine.produceDigitalProductResearchReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestResearchReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createDigitalProductResearchWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-dpr-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceDigitalProductResearchReport(sampleInput);
    const listed = engine.list();
    assert.ok(listed.researchReports.length >= 1);
    const submitted = engine.submitReport({
      researchReportId: produced.latestResearchReport!.researchReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-02"]);
    assert.equal(submitted.latestResearchReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestResearchReport!.executiveReportId, "ert-worker-dpr-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-02");
    assert.equal(cockpit.neverCreateDigitalProducts, true);
    assert.equal(cockpit.neverProcessPayments, true);
  });
});
