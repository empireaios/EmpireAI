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
} from "../../global-market-intelligence/index.js";
import {
  createExecutiveGlobalDashboardEngine,
  resetExecutiveGlobalDashboardForTesting,
} from "../../executive-global-dashboard/index.js";
import {
  createGlobalBrandManagementEngine,
  resetGlobalBrandManagementForTesting,
} from "../../global-brand-management/index.js";
import {
  createInternationalPartnershipEngine,
  resetInternationalPartnershipEngineForTesting,
} from "../../international-partnership-engine/index.js";
import {
  createGlobalTalentIntelligenceEngine,
  resetGlobalTalentIntelligenceForTesting,
} from "../../global-talent-intelligence/index.js";
import {
  createRegionalGrowthOptimizerEngine,
  resetRegionalGrowthOptimizerForTesting,
  buildRegionalGrowthOptimizerConfiguration,
  REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH,
  REGIONAL_GROWTH_OPTIMIZER_ID,
  RGO_CAPABILITIES,
  RGO_METADATA_VERSION,
} from "../../regional-growth-optimizer/index.js";
import {
  appendRgoLog,
  getRgoLogs,
} from "../../regional-growth-optimizer/rgo-logging.js";

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
  const gmi = createGlobalMarketIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
  });
  await gmi.initialize();
  const egd = createExecutiveGlobalDashboardEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
    globalMarketIntelligence: gmi,
  });
  await egd.initialize();
  const gbm = createGlobalBrandManagementEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
    globalMarketIntelligence: gmi,
    executiveGlobalDashboard: egd,
  });
  await gbm.initialize();
  const ipe = createInternationalPartnershipEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
    globalMarketIntelligence: gmi,
    executiveGlobalDashboard: egd,
    globalBrandManagement: gbm,
  });
  await ipe.initialize();
  const tal = createGlobalTalentIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
    globalMarketIntelligence: gmi,
    executiveGlobalDashboard: egd,
    globalBrandManagement: gbm,
    internationalPartnershipEngine: ipe,
  });
  await tal.initialize();
  const engine = createRegionalGrowthOptimizerEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
    globalTaxIntelligence: gti,
    internationalLogisticsEngine: ile,
    globalMarketIntelligence: gmi,
    executiveGlobalDashboard: egd,
    globalBrandManagement: gbm,
    internationalPartnershipEngine: ipe,
    globalTalentIntelligence: tal,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-14 Regional Growth Optimizer", () => {
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
    resetExecutiveGlobalDashboardForTesting();
    resetGlobalBrandManagementForTesting();
    resetInternationalPartnershipEngineForTesting();
    resetGlobalTalentIntelligenceForTesting();
    resetRegionalGrowthOptimizerForTesting();
  });

  test("buildRegionalGrowthOptimizerConfiguration locks safety flags", () => {
    const config = buildRegionalGrowthOptimizerConfiguration(REPO_ROOT, {
      neverOptimizeUsingUnvalidatedRegionalIntelligence: false as never,
      neverExposeCredentials: false as never,
      neverExposeAuthenticationTokens: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverOptimizeUsingUnvalidatedRegionalIntelligence, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveOptimizationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(RGO_CAPABILITIES.includes("regional_business_performance_monitoring"));
    assert.ok(RGO_CAPABILITIES.includes("regional_performance_bottleneck_detection"));
  });

  test("regional growth optimizer initializes with doctrine PILLOW-RGO-001 / X4-14", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RGO-001");
    assert.equal(state.missionId, "X4-14");
    assert.ok(REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH.includes("REGIONAL_GROWTH"));
  });

  test("connectRegionalGrowthOptimizer registers with GEF via X4-14", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectRegionalGrowthOptimizer();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === REGIONAL_GROWTH_OPTIMIZER_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.globalTalentIntelligence, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("performance/revenue/profitability/customer/efficiency produce rgo-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalGrowthOptimizer();
    const input = {
      companyReference: "acme",
      region: "APAC",
      validated: true,
    };

    const performance = engine.monitorRegionalBusinessPerformance(input);
    assert.notEqual(
      performance.validation.decision,
      "fail",
      performance.validation.errors.join("; "),
    );
    assert.ok(performance.regionalRunReportId.startsWith("rgo-run-"));
    const record = performance.optimizationRecords[0]!;
    assert.ok(record.regionalOptimizationId.startsWith("rgo-"));
    assert.equal(record.metadataVersion, RGO_METADATA_VERSION);
    assert.equal(record.neverOptimizeUsingUnvalidatedRegionalIntelligence, true);
    assert.equal(record.unvalidatedOptimizationClaim, "none");
    assert.equal(record.optimizationCategory, "regional_business_performance");

    assert.equal(
      engine.monitorRegionalRevenueGrowth(input).optimizationRecords[0]!.optimizationCategory,
      "regional_revenue_growth",
    );
    assert.equal(
      engine.monitorRegionalProfitability(input).optimizationRecords[0]!.optimizationCategory,
      "regional_profitability",
    );
    assert.equal(
      engine.monitorRegionalCustomerGrowth(input).optimizationRecords[0]!.optimizationCategory,
      "regional_customer_growth",
    );
    assert.equal(
      engine.monitorRegionalOperationalEfficiency(input).optimizationRecords[0]!
        .optimizationCategory,
      "regional_operational_efficiency",
    );
  });

  test("rejects unvalidated path and never claims unvalidated optimization", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalGrowthOptimizer();
    const report = engine.monitorRegionalBusinessPerformance({ region: "EU" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("revenue monitoring preserves optimization traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalGrowthOptimizer();
    const revenue = engine.monitorRegionalRevenueGrowth({
      region: "EU",
      revenueHint: 88,
      validated: true,
    });
    assert.notEqual(revenue.validation.decision, "fail", revenue.validation.errors.join("; "));
    const record = revenue.optimizationRecords[0]!;
    assert.equal(record.revenueScore, 88);
    assert.ok(record.optimizationTraceId.startsWith("rgo-trace-"));
    assert.equal(record.unvalidatedOptimizationClaim, "none");
  });

  test("opportunities, bottlenecks, priorities, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalGrowthOptimizer();

    const opportunities = engine.detectRegionalGrowthOpportunities({
      region: "LATAM",
      opportunityHint: true,
      validated: true,
    });
    assert.notEqual(
      opportunities.validation.decision,
      "fail",
      opportunities.validation.errors.join("; "),
    );
    assert.equal(opportunities.optimizationRecords[0]!.growthOpportunityDetected, true);

    const bottlenecks = engine.detectRegionalPerformanceBottlenecks({
      region: "LATAM",
      bottleneckHint: true,
      validated: true,
    });
    assert.equal(bottlenecks.optimizationRecords[0]!.bottleneckDetected, true);

    const priorities = engine.rankRegionalOptimizationPriorities({
      region: "LATAM",
      validated: true,
    });
    assert.equal(
      priorities.optimizationRecords[0]!.optimizationCategory,
      "regional_optimization_priority",
    );

    const recommendations = engine.recommendRegionalGrowth({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("rgo-rec-"));
    assert.equal(recommendations.recommendations[0]!.unvalidatedOptimizationClaim, "none");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendRgoLog({
      event: "regional_monitoring",
      level: "info",
      details: "api_key=secret-key revenue_detail=private-margin",
    });
    engine.connectRegionalGrowthOptimizer();
    const logs = getRgoLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("private-margin")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalGrowthOptimizer();
    engine.monitorRegionalBusinessPerformance({
      region: "APAC",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalOptimizationRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectRegionalGrowthOptimizer();
    engine.monitorRegionalBusinessPerformance({ region: "a" });
    engine.monitorRegionalBusinessPerformance({ region: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
