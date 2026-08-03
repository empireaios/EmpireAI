import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVED_MARKETPLACES,
  PDW_CAPABILITIES,
  PDW_INTEGRATION_TARGETS,
  PDW_METADATA_VERSION,
  PRODUCT_DISCOVERY_REPORT_VERSION,
  buildProductDiscoveryWorkerConfiguration,
  createProductDiscoveryWorker,
  resetProductDiscoveryWorkerForTesting,
} from "../../product-discovery-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createProductDiscoveryWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createProductDiscoveryWorker(bootstrap, config);
  await engine.initialize();
  engine.connectProductDiscoveryWorker();
  return engine;
}

const sampleInput = {
  businessMissionId: "cmf-cbm-commerce-01",
  commerceBuildMissionId: "cmf-cbm-commerce-01",
  marketplaceCandidates: [
    {
      productName: "Bamboo Desk Organizer",
      productId: "mkt-bamboo-01",
      marketplace: "amazon",
      category: "home_goods",
      signals: ["rising search volume for bamboo organizers"],
      reason: "Marketplace bestseller signal",
    },
  ],
  supplierCandidates: [
    {
      productName: "Bamboo Desk Organizer",
      productId: "sup-bamboo-01",
      supplier: "alibaba",
      category: "home_goods",
      signals: ["stable wholesale availability"],
      reason: "Supplier catalog match",
    },
  ],
  searchTrendSignals: ['Rising queries for "USB-C travel charger"'],
  customerDemandSignals: ["Customers request compact kitchen lamp with USB ports"],
  seasonalSignals: ["Holiday demand spike for scented candles"],
  emergingTrendSignals: ["Emerging interest in portable yoga mats"],
  decliningProductSignals: ["Declining interest in DVD players"],
  evidenceSources: [
    {
      source: "marketplace_feed",
      claim: "Amazon listings show increased bamboo organizer impressions",
      kind: "fact",
      relatedTopic: "marketplace_discovery",
    },
    {
      source: "operator_note",
      claim: "Assumed seasonal lift will continue through December",
      kind: "assumption",
      relatedTopic: "seasonal",
    },
  ],
  validated: true,
};

describe("Q3-02 Product Discovery Worker", () => {
  beforeEach(resetProductDiscoveryWorkerForTesting);

  test("1 locks mandatory product-discovery-worker boundaries", () => {
    const c = buildProductDiscoveryWorkerConfiguration(REPO_ROOT, {
      neverEvaluateProducts: false as never,
      neverRankProducts: false as never,
      neverSelectSuppliers: false as never,
      neverBuildListings: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ303OrLater: false as never,
    });
    assert.equal(c.neverEvaluateProducts, true);
    assert.equal(c.neverRankProducts, true);
    assert.equal(c.neverSelectSuppliers, true);
    assert.equal(c.neverBuildListings, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ303OrLater, true);
  });

  test("2 initializes PILLOW-PDW-001 for Q3-02 with workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-02");
    assert.equal(state.engineVersion, "PILLOW-PDW-001");
    assert.equal(state.configuration.workerId, "wkr-product-discovery-01");
    for (const target of PDW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const marketplace of APPROVED_MARKETPLACES) {
      assert.ok(state.configuration.approvedMarketplaces.includes(marketplace));
    }
    assert.ok(PDW_CAPABILITIES.includes("discover_products_from_approved_marketplaces"));
  });

  test("3 discovers products from approved marketplaces", async () => {
    const report = (await build()).discoverFromMarketplaces(sampleInput);
    assert.equal(report.action, "discover_marketplaces");
    assert.ok(report.discoveries.length >= 1);
    assert.equal(report.discoveries[0]!.discoverySource, "marketplace");
    assert.equal(report.discoveries[0]!.marketplace, "amazon");
    assert.equal(report.discoveries[0]!.productName, "Bamboo Desk Organizer");
    assert.equal(report.validation.decision, "pass");
  });

  test("4 discovers products from approved supplier platforms", async () => {
    const report = (await build()).discoverFromSuppliers(sampleInput);
    assert.equal(report.action, "discover_suppliers");
    assert.ok(report.discoveries.length >= 1);
    assert.equal(report.discoveries[0]!.discoverySource, "supplier");
    assert.equal(report.discoveries[0]!.supplier, "alibaba");
  });

  test("5 discovers from search trends and customer demand", async () => {
    const engine = await build();
    const trends = engine.discoverFromSearchTrends(sampleInput);
    const demand = engine.discoverFromCustomerDemand(sampleInput);
    assert.equal(trends.action, "discover_search_trends");
    assert.ok(trends.discoveries.some((d) => d.discoverySource === "search_trend"));
    assert.ok(trends.discoveries.some((d) => d.searchTrendSignals.length >= 1));
    assert.equal(demand.action, "discover_customer_demand");
    assert.ok(demand.discoveries.some((d) => d.discoverySource === "customer_demand"));
    assert.ok(demand.discoveries.some((d) => d.customerDemandSignals.length >= 1));
  });

  test("6 categorizes discovered products and detects seasonal / emerging / declining", async () => {
    const engine = await build();
    const seasonal = engine.discoverSeasonalOpportunities(sampleInput);
    const emerging = engine.detectEmergingTrends(sampleInput);
    const declining = engine.detectDecliningProducts(sampleInput);
    const categorized = engine.categorizeDiscoveredProducts(sampleInput);
    assert.ok(seasonal.discoveries.some((d) => d.discoverySource === "seasonal"));
    assert.ok(emerging.discoveries.some((d) => d.trendDirection === "emerging"));
    assert.ok(declining.discoveries.some((d) => d.trendDirection === "declining"));
    assert.ok(categorized.discoveries.some((d) => d.category === "home_goods"));
    assert.ok(categorized.discoveries.some((d) => d.category === "electronics"));
  });

  test("7 produces machine-readable Product Discovery Report with required fields", async () => {
    const report = (await build()).produceProductDiscoveryReport(sampleInput);
    const latest = report.latestDiscovery!;
    assert.ok(latest.discoveryId.startsWith("pdw-discovery-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessMissionId, "cmf-cbm-commerce-01");
    assert.ok(latest.productId);
    assert.ok(latest.productName);
    assert.ok(latest.category);
    assert.ok(latest.discoverySource);
    assert.ok(latest.discoveryReason);
    assert.ok(latest.confidenceScore > 0);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.equal(latest.metadataVersion, PDW_METADATA_VERSION);
    assert.equal(latest.reportVersion, PRODUCT_DISCOVERY_REPORT_VERSION);
    assert.ok(latest.facts.length >= 1);
    assert.ok(latest.assumptions.length >= 1);
    assert.equal(report.catalog!.reportVersion, PRODUCT_DISCOVERY_REPORT_VERSION);
  });

  test("8 rejects evaluate / rank / select / listing / override / Q3-03 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { evaluateProducts: true },
      { rankProducts: true },
      { selectSuppliers: true },
      { buildListings: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ303OrLater: true },
    ] as const) {
      const report = engine.produceProductDiscoveryReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestDiscovery, null);
    }
  });

  test("9 submits findings through Executive Reporting Runtime integration surface", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createProductDiscoveryWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-pdw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectProductDiscoveryWorker();
    const produced = engine.produceProductDiscoveryReport(sampleInput);
    const submitted = engine.submitFindings({
      discoveryId: produced.latestDiscovery!.discoveryId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-02"]);
    assert.equal(submitted.latestDiscovery!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestDiscovery!.executiveReportId, "ert-worker-pdw-001");
  });

  test("10 removes duplicates and preserves audit / cockpit boundaries", async () => {
    const engine = await build();
    const report = engine.produceProductDiscoveryReport(sampleInput);
    const bamboo = report.discoveries.filter((d) => d.productName === "Bamboo Desk Organizer");
    assert.equal(bamboo.length, 1);
    assert.ok(
      bamboo[0]!.discoverySource === "aggregated" ||
        bamboo[0]!.marketplace === "amazon" ||
        bamboo[0]!.supplier === "alibaba",
    );
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-02");
    assert.equal(cockpit.neverEvaluateProducts, true);
    assert.equal(cockpit.neverBuildListings, true);
    assert.ok(cockpit.totalDiscoveries >= 1);
  });
});
