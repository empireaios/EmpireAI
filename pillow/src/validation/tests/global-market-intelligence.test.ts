import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createGlobalExpansionFrameworkEngine,
  resetGlobalExpansionFrameworkForTesting,
} from "../../global-expansion-framework/index.js";
import {
  createCountryIntelligenceEngine,
  resetCountryIntelligenceEngineForTesting,
} from "../../country-intelligence-engine/index.js";
import {
  createLocalizationEngine,
  resetLocalizationEngineForTesting,
} from "../../localization-engine/index.js";
import {
  createLanguageIntelligenceEngine,
  resetLanguageIntelligenceForTesting,
} from "../../language-intelligence/index.js";
import {
  createCurrencyIntelligenceEngine,
  resetCurrencyIntelligenceForTesting,
} from "../../currency-intelligence/index.js";
import {
  createRegionalComplianceEngine,
  resetRegionalComplianceEngineForTesting,
} from "../../regional-compliance-engine/index.js";
import {
  createGlobalTaxIntelligenceEngine,
  resetGlobalTaxIntelligenceForTesting,
} from "../../global-tax-intelligence/index.js";
import {
  createInternationalLogisticsEngine,
  resetInternationalLogisticsEngineForTesting,
} from "../../international-logistics-engine/index.js";
import {
  createGlobalMarketIntelligenceEngine,
  resetGlobalMarketIntelligenceForTesting,
  buildGlobalMarketIntelligenceConfiguration,
  GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH,
  GLOBAL_MARKET_INTELLIGENCE_ID,
  GMI_CAPABILITIES,
  GMI_METADATA_VERSION,
} from "../../global-market-intelligence/index.js";
import {
  appendGmiLog,
  getGmiLogs,
} from "../../global-market-intelligence/gmi-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const gef = createGlobalExpansionFrameworkEngine(bootstrap);
  await gef.initialize();
  const cie = createCountryIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
  });
  await cie.initialize();
  const loc = createLocalizationEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
  });
  await loc.initialize();
  const li = createLanguageIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
  });
  await li.initialize();
  const cur = createCurrencyIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
  });
  await cur.initialize();
  const rce = createRegionalComplianceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
  });
  await rce.initialize();
  const gti = createGlobalTaxIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
  });
  await gti.initialize();
  const ile = createInternationalLogisticsEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
  });
  await ile.initialize();
  const engine = createGlobalMarketIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-09 Global Market Intelligence", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
    resetLanguageIntelligenceForTesting();
    resetCurrencyIntelligenceForTesting();
    resetRegionalComplianceEngineForTesting();
    resetGlobalTaxIntelligenceForTesting();
    resetInternationalLogisticsEngineForTesting();
    resetGlobalMarketIntelligenceForTesting();
  });

  test("buildGlobalMarketIntelligenceConfiguration locks safety flags", () => {
    const config = buildGlobalMarketIntelligenceConfiguration(REPO_ROOT, {
      neverRecommendWithUnvalidatedIntelligence: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendWithUnvalidatedIntelligence, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveMarketTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(GMI_CAPABILITIES.includes("global_opportunity_ranking"));
    assert.ok(GMI_CAPABILITIES.includes("emerging_market_detection"));
  });

  test("global market intelligence initializes with doctrine PILLOW-GMI-001 / X4-09", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GMI-001");
    assert.equal(state.missionId, "X4-09");
    assert.ok(GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH.includes("GLOBAL_MARKET_INTELLIGENCE"));
  });

  test("connectGlobalMarketIntelligence registers with GEF via X4-09", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectGlobalMarketIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === GLOBAL_MARKET_INTELLIGENCE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.internationalLogisticsEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("markets/trends/demand/competitors/products/growth produce gmi-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalMarketIntelligence();

    const markets = engine.monitorInternationalMarkets({
      country: "SG",
      region: "APAC",
      validated: true,
    });
    assert.notEqual(markets.validation.decision, "fail", markets.validation.errors.join("; "));
    assert.ok(markets.marketRunReportId.startsWith("gmi-run-"));
    const record = markets.marketRecords[0]!;
    assert.ok(record.marketIntelligenceId.startsWith("gmi-"));
    assert.equal(record.metadataVersion, GMI_METADATA_VERSION);
    assert.equal(record.neverRecommendWithUnvalidatedIntelligence, true);
    assert.equal(record.unvalidatedRecommendationClaim, "none");
    assert.equal(record.marketCategory, "international_market");

    const trends = engine.monitorMarketTrends({ country: "DE", region: "EU", validated: true });
    assert.equal(trends.marketRecords[0]!.marketCategory, "market_trend");

    const demand = engine.monitorCustomerDemand({
      country: "JP",
      region: "APAC",
      demandHint: 80,
      validated: true,
    });
    assert.equal(demand.marketRecords[0]!.marketCategory, "customer_demand");
    assert.equal(demand.marketRecords[0]!.demandScore, 80);

    const competitors = engine.monitorCompetitorActivity({
      country: "US",
      region: "NA",
      validated: true,
    });
    assert.equal(competitors.marketRecords[0]!.marketCategory, "competitor_activity");

    const products = engine.monitorProductOpportunities({
      country: "AU",
      region: "APAC",
      validated: true,
    });
    assert.equal(products.marketRecords[0]!.marketCategory, "product_opportunity");

    const growth = engine.monitorRegionalGrowth({
      country: "BR",
      region: "LATAM",
      validated: true,
    });
    assert.equal(growth.marketRecords[0]!.marketCategory, "regional_growth");
  });

  test("rejects unvalidated path and never recommends with unvalidated intelligence", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalMarketIntelligence();
    const report = engine.monitorInternationalMarkets({ country: "XX" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("opportunity ranking preserves market traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalMarketIntelligence();
    engine.monitorInternationalMarkets({
      country: "CA",
      region: "NA",
      opportunityHint: 55,
      validated: true,
    });
    const ranked = engine.rankGlobalOpportunities({
      country: "CA",
      region: "NA",
      opportunityHint: 88,
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail", ranked.validation.errors.join("; "));
    const record = ranked.marketRecords[0]!;
    assert.equal(record.marketCategory, "opportunity_ranking");
    assert.ok(record.rankingPosition !== null && record.rankingPosition >= 1);
    assert.ok(record.marketTraceId.startsWith("gmi-trace-"));
    assert.equal(record.unvalidatedRecommendationClaim, "none");
  });

  test("emerging, declining, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalMarketIntelligence();

    const emerging = engine.detectEmergingMarkets({
      country: "VN",
      region: "APAC",
      validated: true,
    });
    assert.notEqual(
      emerging.validation.decision,
      "fail",
      emerging.validation.errors.join("; "),
    );
    assert.equal(emerging.marketRecords[0]!.emergingDetected, true);

    const declining = engine.detectDecliningMarkets({
      country: "XX",
      region: "EU",
      validated: true,
    });
    assert.equal(declining.marketRecords[0]!.decliningDetected, true);

    const recommendations = engine.recommendMarket({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("gmi-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.unvalidatedRecommendationClaim,
      "none",
    );
    assert.equal(
      recommendations.recommendations[0]!.neverRecommendWithUnvalidatedIntelligence,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendGmiLog({
      event: "market_monitoring",
      level: "info",
      details: "api_key=secret-key customer_list=private.csv",
    });
    engine.connectGlobalMarketIntelligence();
    const logs = getGmiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("private.csv")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalMarketIntelligence();
    engine.monitorInternationalMarkets({ country: "CA", region: "NA", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalMarketRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalMarketIntelligence();
    engine.monitorInternationalMarkets({ country: "a" });
    engine.monitorInternationalMarkets({ country: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
