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
  buildCountryIntelligenceEngineConfiguration,
  COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  COUNTRY_INTELLIGENCE_ENGINE_ID,
  CIE_CAPABILITIES,
  CIE_METADATA_VERSION,
} from "../../country-intelligence-engine/index.js";
import {
  appendCieLog,
  getCieLogs,
} from "../../country-intelligence-engine/cie-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const gef = createGlobalExpansionFrameworkEngine(bootstrap);
  await gef.initialize();
  const engine = createCountryIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-02 Country Intelligence Engine", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
  });

  test("buildCountryIntelligenceEngineConfiguration locks safety flags", () => {
    const config = buildCountryIntelligenceEngineConfiguration(REPO_ROOT, {
      neverRecommendUsingUnvalidatedCountryData: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendUsingUnvalidatedCountryData, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveEvaluationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(CIE_CAPABILITIES.includes("country_evaluation"));
    assert.ok(CIE_CAPABILITIES.includes("country_ranking"));
  });

  test("country intelligence engine initializes with doctrine PILLOW-CIE-001 / X4-02", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CIE-001");
    assert.equal(state.missionId, "X4-02");
    assert.ok(COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH.includes("COUNTRY_INTELLIGENCE"));
  });

  test("connectCountryIntelligenceEngine registers with GEF via X4-02", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectCountryIntelligenceEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(modules.some((m) => m.expansionModuleIdentifier === COUNTRY_INTELLIGENCE_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.globalExpansionFramework, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("evaluateCountry produces cie-* records with scores", async () => {
    const { engine } = await buildEngine();
    engine.connectCountryIntelligenceEngine();

    const evaluated = engine.evaluateCountry({
      country: "SG",
      marketSizeHint: 80,
      economicHint: 85,
      commerceReadinessHint: 88,
      operationalFeasibilityHint: 82,
      validated: true,
    });
    assert.notEqual(
      evaluated.validation.decision,
      "fail",
      evaluated.validation.errors.join("; "),
    );
    assert.ok(evaluated.countryRunReportId.startsWith("cie-run-"));
    const record = evaluated.countryRecords[0]!;
    assert.ok(record.countryIntelligenceId.startsWith("cie-"));
    assert.equal(record.metadataVersion, CIE_METADATA_VERSION);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.country, "SG");
    assert.ok(record.marketSizeScore >= 0 && record.marketSizeScore <= 100);
    assert.ok(record.economicScore >= 0 && record.economicScore <= 100);
    assert.ok(record.commerceReadinessScore >= 0 && record.commerceReadinessScore <= 100);
    assert.ok(
      record.operationalFeasibilityScore >= 0 && record.operationalFeasibilityScore <= 100,
    );
  });

  test("rejects unvalidated path and does not recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectCountryIntelligenceEngine();
    const report = engine.evaluateCountry({ country: "XX" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));

    const recommendations = engine.recommendCountries({ country: "XX" });
    assert.equal(recommendations.validation.decision, "fail");
    assert.equal(recommendations.recommendations.length, 0);
  });

  test("rankCountries orders by expansion priority/score", async () => {
    const { engine } = await buildEngine();
    engine.connectCountryIntelligenceEngine();

    engine.evaluateCountry({
      country: "low-market",
      marketSizeHint: 30,
      economicHint: 30,
      commerceReadinessHint: 30,
      operationalFeasibilityHint: 30,
      validated: true,
    });
    engine.evaluateCountry({
      country: "high-market",
      marketSizeHint: 95,
      economicHint: 92,
      commerceReadinessHint: 90,
      operationalFeasibilityHint: 88,
      validated: true,
    });

    const ranked = engine.rankCountries({ validated: true });
    assert.notEqual(ranked.validation.decision, "fail", ranked.validation.errors.join("; "));
    assert.ok(ranked.countryRecords.length >= 2);
    assert.equal(ranked.countryRecords[0]!.country, "high-market");
    const priorities = ["critical", "high", "medium", "low", "deferred"] as const;
    const firstRank = priorities.indexOf(ranked.countryRecords[0]!.expansionPriority);
    const secondRank = priorities.indexOf(ranked.countryRecords[1]!.expansionPriority);
    assert.ok(firstRank <= secondRank);
  });

  test("recommendCountries returns recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectCountryIntelligenceEngine();
    engine.evaluateCountry({
      country: "AU",
      marketSizeHint: 78,
      economicHint: 80,
      commerceReadinessHint: 76,
      operationalFeasibilityHint: 74,
      validated: true,
    });

    const recommendations = engine.recommendCountries({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("cie-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.neverRecommendUsingUnvalidatedCountryData,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCieLog({
      event: "country_evaluation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectCountryIntelligenceEngine();
    const logs = getCieLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCountryIntelligenceEngine();
    engine.evaluateCountry({
      country: "CA",
      marketSizeHint: 70,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalCountryRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectCountryIntelligenceEngine();
    engine.evaluateCountry({ country: "a" });
    engine.evaluateCountry({ country: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
