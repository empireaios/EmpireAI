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
  buildLanguageIntelligenceConfiguration,
  LANGUAGE_INTELLIGENCE_SYSTEM_PATH,
  LANGUAGE_INTELLIGENCE_ID,
  LI_CAPABILITIES,
  LI_METADATA_VERSION,
} from "../../language-intelligence/index.js";
import {
  appendLiLog,
  getLiLogs,
} from "../../language-intelligence/li-logging.js";

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
  const engine = createLanguageIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
  });
  await engine.initialize();
  return { engine, gef, cie, loc };
}

describe("X4-04 Language Intelligence", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
    resetLanguageIntelligenceForTesting();
  });

  test("buildLanguageIntelligenceConfiguration locks safety flags", () => {
    const config = buildLanguageIntelligenceConfiguration(REPO_ROOT, {
      neverOverwriteCanonicalSourceContentAutomatically: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverOverwriteCanonicalSourceContentAutomatically, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveTranslationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(config.supportedLanguages.includes("en"));
    assert.ok(LI_CAPABILITIES.includes("language_preference_detection"));
    assert.ok(LI_CAPABILITIES.includes("translation_quality_detection"));
  });

  test("language intelligence initializes with doctrine PILLOW-LI-001 / X4-04", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-LI-001");
    assert.equal(state.missionId, "X4-04");
    assert.ok(LANGUAGE_INTELLIGENCE_SYSTEM_PATH.includes("LANGUAGE_INTELLIGENCE"));
  });

  test("connectLanguageIntelligence registers with GEF via X4-04", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectLanguageIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(modules.some((m) => m.expansionModuleIdentifier === LANGUAGE_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.globalExpansionFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.countryIntelligenceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.localizationEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("detectLanguage and translate produce li-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectLanguageIntelligence();

    const detected = engine.detectLanguage({
      sampleText: "Bonjour et merci",
      validated: true,
    });
    assert.notEqual(detected.validation.decision, "fail", detected.validation.errors.join("; "));
    assert.ok(detected.languageRunReportId.startsWith("li-run-"));
    const record = detected.languageRecords[0]!;
    assert.ok(record.languageIntelligenceId.startsWith("li-"));
    assert.equal(record.metadataVersion, LI_METADATA_VERSION);
    assert.equal(record.language, "fr");
    assert.equal(record.neverOverwriteCanonicalSourceContentAutomatically, true);
    assert.ok(record.detectedPreferenceConfidence >= 0);

    const customer = engine.translateCustomerFacing({
      language: "es",
      qualityHint: 82,
      validated: true,
    });
    assert.equal(customer.languageRecords[0]!.translationCategory, "customer_facing");

    const operational = engine.translateOperational({
      language: "de",
      validated: true,
    });
    assert.equal(operational.languageRecords[0]!.translationCategory, "operational");

    const ai = engine.translateAiWorkforce({
      language: "ja",
      validated: true,
    });
    assert.equal(ai.languageRecords[0]!.translationCategory, "ai_workforce");
  });

  test("rejects unvalidated path", async () => {
    const { engine } = await buildEngine();
    engine.connectLanguageIntelligence();
    const report = engine.detectLanguage({ language: "xx" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("manageSupportedLanguages and terminology consistency", async () => {
    const { engine } = await buildEngine();
    engine.connectLanguageIntelligence();

    const managed = engine.manageSupportedLanguages({ validated: true });
    assert.notEqual(managed.validation.decision, "fail", managed.validation.errors.join("; "));
    assert.ok(managed.languageRecords.length >= 3);

    const terminology = engine.maintainTerminology({
      language: "en",
      terminologyHint: 88,
      validated: true,
    });
    assert.equal(terminology.languageRecords[0]!.translationCategory, "terminology");
    assert.ok(terminology.languageRecords[0]!.terminologyConsistencyScore >= 80);
  });

  test("quality analysis, unsupported detection, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectLanguageIntelligence();

    engine.analyzeQuality({
      language: "zz-unsupported-lang",
      qualityHint: 30,
      validated: true,
    });

    const unsupported = engine.detectUnsupported({ validated: true });
    assert.notEqual(
      unsupported.validation.decision,
      "fail",
      unsupported.validation.errors.join("; "),
    );
    assert.ok(unsupported.languageRecords.length >= 1);

    const recommendations = engine.recommendLanguage({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("li-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.neverOverwriteCanonicalSourceContentAutomatically,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendLiLog({
      event: "translation_execution",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectLanguageIntelligence();
    const logs = getLiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectLanguageIntelligence();
    engine.detectLanguage({
      language: "en",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalLanguageRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectLanguageIntelligence();
    engine.detectLanguage({ language: "a" });
    engine.detectLanguage({ language: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
