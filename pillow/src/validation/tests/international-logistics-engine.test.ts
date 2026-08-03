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
  buildInternationalLogisticsEngineConfiguration,
  INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM_PATH,
  INTERNATIONAL_LOGISTICS_ENGINE_ID,
  ILE_CAPABILITIES,
  ILE_METADATA_VERSION,
} from "../../international-logistics-engine/index.js";
import {
  appendIleLog,
  getIleLogs,
} from "../../international-logistics-engine/ile-logging.js";

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
  const engine = createInternationalLogisticsEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-08 International Logistics Engine", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
    resetLanguageIntelligenceForTesting();
    resetCurrencyIntelligenceForTesting();
    resetRegionalComplianceEngineForTesting();
    resetGlobalTaxIntelligenceForTesting();
    resetInternationalLogisticsEngineForTesting();
  });

  test("buildInternationalLogisticsEngineConfiguration locks safety flags", () => {
    const config = buildInternationalLogisticsEngineConfiguration(REPO_ROOT, {
      neverRecommendWithUnvalidatedLogisticsData: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendWithUnvalidatedLogisticsData, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveLogisticsTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(ILE_CAPABILITIES.includes("shipping_route_optimization"));
    assert.ok(ILE_CAPABILITIES.includes("logistics_provider_monitoring"));
  });

  test("international logistics engine initializes with doctrine PILLOW-ILE-001 / X4-08", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ILE-001");
    assert.equal(state.missionId, "X4-08");
    assert.ok(
      INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM_PATH.includes("INTERNATIONAL_LOGISTICS"),
    );
  });

  test("connectInternationalLogisticsEngine registers with GEF via X4-08", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectInternationalLogisticsEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === INTERNATIONAL_LOGISTICS_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.globalTaxIntelligence, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("shipping/provider/performance/delivery/capacity/cost produce ile-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalLogisticsEngine();

    const network = engine.manageShippingNetworks({
      originRegion: "APAC",
      destinationRegion: "EU",
      validated: true,
    });
    assert.notEqual(network.validation.decision, "fail", network.validation.errors.join("; "));
    assert.ok(network.logisticsRunReportId.startsWith("ile-run-"));
    const record = network.logisticsRecords[0]!;
    assert.ok(record.logisticsRecordId.startsWith("ile-"));
    assert.equal(record.metadataVersion, ILE_METADATA_VERSION);
    assert.equal(record.neverRecommendWithUnvalidatedLogisticsData, true);
    assert.equal(record.unvalidatedRecommendationClaim, "none");
    assert.equal(record.logisticsCategory, "shipping_network");
    assert.equal(record.costUnit, "structural_units");

    const provider = engine.monitorProviders({
      originRegion: "US",
      destinationRegion: "LATAM",
      logisticsProvider: "carrier-a",
      validated: true,
    });
    assert.equal(provider.logisticsRecords[0]!.logisticsCategory, "provider");
    assert.equal(provider.logisticsRecords[0]!.logisticsProvider, "carrier-a");

    const performance = engine.monitorShippingPerformance({
      originRegion: "EU",
      destinationRegion: "APAC",
      validated: true,
    });
    assert.equal(performance.logisticsRecords[0]!.logisticsCategory, "shipping_performance");

    const delivery = engine.monitorDeliveryTimes({
      originRegion: "APAC",
      destinationRegion: "NA",
      deliveryPerformanceHint: 48,
      validated: true,
    });
    assert.equal(delivery.logisticsRecords[0]!.logisticsCategory, "delivery_time");

    const capacity = engine.monitorFulfillmentCapacity({
      originRegion: "NA",
      destinationRegion: "EU",
      validated: true,
    });
    assert.equal(capacity.logisticsRecords[0]!.logisticsCategory, "fulfillment_capacity");

    const costs = engine.monitorShippingCosts({
      originRegion: "EU",
      destinationRegion: "ME",
      shippingCostHint: 400,
      validated: true,
    });
    assert.equal(costs.logisticsRecords[0]!.logisticsCategory, "shipping_cost");
    assert.equal(costs.logisticsRecords[0]!.shippingCost, 400);
  });

  test("rejects unvalidated path and never recommends with unvalidated data", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalLogisticsEngine();
    const report = engine.manageShippingNetworks({
      originRegion: "XX",
      destinationRegion: "YY",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("route optimization preserves logistics traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalLogisticsEngine();
    const route = engine.optimizeRoutes({
      originRegion: "APAC",
      destinationRegion: "EU",
      validated: true,
    });
    assert.notEqual(route.validation.decision, "fail", route.validation.errors.join("; "));
    const record = route.logisticsRecords[0]!;
    assert.equal(record.logisticsCategory, "route_optimization");
    assert.equal(record.routeOptimized, true);
    assert.ok(record.logisticsTraceId.startsWith("ile-trace-"));
    assert.equal(record.unvalidatedRecommendationClaim, "none");
  });

  test("bottlenecks, fulfillment risks, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalLogisticsEngine();

    const bottlenecks = engine.detectBottlenecks({
      originRegion: "BR",
      destinationRegion: "US",
      bottleneckHint: true,
      validated: true,
    });
    assert.notEqual(
      bottlenecks.validation.decision,
      "fail",
      bottlenecks.validation.errors.join("; "),
    );
    assert.equal(bottlenecks.logisticsRecords[0]!.bottleneckDetected, true);

    const risks = engine.detectFulfillmentRisks({
      originRegion: "BR",
      destinationRegion: "US",
      riskHint: 85,
      validated: true,
    });
    assert.equal(risks.logisticsRecords[0]!.fulfillmentRiskDetected, true);
    assert.ok(["critical", "high", "medium"].includes(risks.logisticsRecords[0]!.riskLevel));

    const recommendations = engine.recommendLogistics({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("ile-rec-"));
    assert.equal(recommendations.recommendations[0]!.unvalidatedRecommendationClaim, "none");
    assert.equal(
      recommendations.recommendations[0]!.neverRecommendWithUnvalidatedLogisticsData,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendIleLog({
      event: "logistics_monitoring",
      level: "info",
      details: "api_key=secret-key tracking_number=1Z999AA10123456784",
    });
    engine.connectInternationalLogisticsEngine();
    const logs = getIleLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("1Z999AA10123456784")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalLogisticsEngine();
    engine.manageShippingNetworks({
      originRegion: "CA",
      destinationRegion: "US",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalLogisticsRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalLogisticsEngine();
    engine.manageShippingNetworks({ originRegion: "a", destinationRegion: "b" });
    engine.manageShippingNetworks({ originRegion: "c", destinationRegion: "d" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
