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
  buildCurrencyIntelligenceConfiguration,
  CURRENCY_INTELLIGENCE_SYSTEM_PATH,
  CURRENCY_INTELLIGENCE_ID,
  CUR_CAPABILITIES,
  CUR_METADATA_VERSION,
} from "../../currency-intelligence/index.js";
import {
  appendCurLog,
  getCurLogs,
} from "../../currency-intelligence/cur-logging.js";

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
  const engine = createCurrencyIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-05 Currency Intelligence", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
    resetLanguageIntelligenceForTesting();
    resetCurrencyIntelligenceForTesting();
  });

  test("buildCurrencyIntelligenceConfiguration locks safety flags", () => {
    const config = buildCurrencyIntelligenceConfiguration(REPO_ROOT, {
      neverPerformFinancialConversionsUsingUnvalidatedExchangeData: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverPerformFinancialConversionsUsingUnvalidatedExchangeData, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveFinancialTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveFinancialInformation, true);
    assert.ok(config.supportedCurrencies.includes("USD"));
    assert.ok(CUR_CAPABILITIES.includes("price_conversion"));
    assert.ok(CUR_CAPABILITIES.includes("currency_anomaly_detection"));
  });

  test("currency intelligence initializes with doctrine PILLOW-CUR-001 / X4-05", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CUR-001");
    assert.equal(state.missionId, "X4-05");
    assert.ok(CURRENCY_INTELLIGENCE_SYSTEM_PATH.includes("CURRENCY_INTELLIGENCE"));
  });

  test("connectCurrencyIntelligence registers with GEF via X4-05", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectCurrencyIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(modules.some((m) => m.expansionModuleIdentifier === CURRENCY_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.globalExpansionFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.languageIntelligence, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("manage currencies and convert with validated exchange data", async () => {
    const { engine } = await buildEngine();
    engine.connectCurrencyIntelligence();

    const managed = engine.manageCurrencies({ validated: true });
    assert.notEqual(managed.validation.decision, "fail", managed.validation.errors.join("; "));
    assert.ok(managed.currencyRunReportId.startsWith("cur-run-"));
    assert.ok(managed.currencyRecords.length >= 3);
    assert.equal(managed.currencyRecords[0]!.metadataVersion, CUR_METADATA_VERSION);

    const converted = engine.convertPrice({
      currencyCode: "USD",
      targetCurrencyCode: "EUR",
      amount: 100,
      validated: true,
      exchangeDataValidated: true,
    });
    assert.notEqual(
      converted.validation.decision,
      "fail",
      converted.validation.errors.join("; "),
    );
    assert.ok(typeof converted.convertedAmount === "number");
    assert.ok(converted.convertedAmount! > 0);
    assert.equal(
      converted.currencyRecords[0]!.neverPerformFinancialConversionsUsingUnvalidatedExchangeData,
      true,
    );
  });

  test("blocks conversion when exchange data is unvalidated", async () => {
    const { engine } = await buildEngine();
    engine.connectCurrencyIntelligence();
    const report = engine.convertPrice({
      currencyCode: "USD",
      targetCurrencyCode: "EUR",
      amount: 50,
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(
      report.validation.errors.some((e) =>
        e.toLowerCase().includes("unvalidated exchange"),
      ),
    );
  });

  test("preference, rates, regional pricing, and fluctuations", async () => {
    const { engine } = await buildEngine();
    engine.connectCurrencyIntelligence();

    const pref = engine.detectPreference({
      currencyCode: "SGD",
      preferenceHint: 90,
      validated: true,
    });
    assert.equal(pref.currencyRecords[0]!.currencyCode, "SGD");

    const rates = engine.refreshExchangeRates({
      currencyCode: "JPY",
      validated: true,
    });
    assert.notEqual(rates.validation.decision, "fail");
    assert.ok(rates.currencyRecords[0]!.exchangeRateToUsd > 0);

    const pricing = engine.regionalPricing({
      currencyCode: "AUD",
      region: "APAC",
      validated: true,
    });
    assert.ok(["enabled", "partial", "anomaly"].includes(pricing.currencyRecords[0]!.regionalPricingStatus));

    const fluct = engine.monitorFluctuations({
      currencyCode: "GBP",
      fluctuationHint: 12,
      validated: true,
    });
    assert.ok(fluct.currencyRecords[0]!.fluctuationPercent >= 8);
  });

  test("anomaly detection and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectCurrencyIntelligence();
    engine.detectAnomalies({
      currencyCode: "EUR",
      anomalyHint: 80,
      fluctuationHint: 15,
      validated: true,
    });

    const recommendations = engine.recommendCurrency({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("cur-rec-"));
    assert.equal(
      recommendations.recommendations[0]!
        .neverPerformFinancialConversionsUsingUnvalidatedExchangeData,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCurLog({
      event: "currency_conversion",
      level: "info",
      details: "api_key=secret-key account_number=123456789",
    });
    engine.connectCurrencyIntelligence();
    const logs = getCurLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("123456789")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCurrencyIntelligence();
    engine.detectPreference({ currencyCode: "USD", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalCurrencyRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectCurrencyIntelligence();
    engine.detectPreference({ currencyCode: "a" });
    engine.detectPreference({ currencyCode: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
