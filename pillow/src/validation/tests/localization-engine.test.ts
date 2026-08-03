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
  buildLocalizationEngineConfiguration,
  LOCALIZATION_ENGINE_SYSTEM_PATH,
  LOCALIZATION_ENGINE_ID,
  LOC_CAPABILITIES,
  LOC_METADATA_VERSION,
} from "../../localization-engine/index.js";
import {
  appendLocLog,
  getLocLogs,
} from "../../localization-engine/loc-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const gef = createGlobalExpansionFrameworkEngine(bootstrap);
  await gef.initialize();
  const cie = createCountryIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
  });
  await cie.initialize();
  const engine = createLocalizationEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
  });
  await engine.initialize();
  return { engine, gef, cie };
}

describe("X4-03 Localization Engine", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
  });

  test("buildLocalizationEngineConfiguration locks safety flags", () => {
    const config = buildLocalizationEngineConfiguration(REPO_ROOT, {
      neverOverwriteCanonicalSourceContent: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverOverwriteCanonicalSourceContent, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveLocalizationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(LOC_CAPABILITIES.includes("product_localization"));
    assert.ok(LOC_CAPABILITIES.includes("localization_gap_detection"));
  });

  test("localization engine initializes with doctrine PILLOW-LOC-001 / X4-03", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-LOC-001");
    assert.equal(state.missionId, "X4-03");
    assert.ok(LOCALIZATION_ENGINE_SYSTEM_PATH.includes("LOCALIZATION_ENGINE"));
  });

  test("connectLocalizationEngine registers with GEF via X4-03", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectLocalizationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(modules.some((m) => m.expansionModuleIdentifier === LOCALIZATION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.globalExpansionFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.countryIntelligenceEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("localize product/service/storefront/marketing produces loc-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectLocalizationEngine();

    const product = engine.localizeProduct({
      targetCountry: "SG",
      readinessHint: 80,
      gapHint: 20,
      validated: true,
    });
    assert.notEqual(product.validation.decision, "fail", product.validation.errors.join("; "));
    assert.ok(product.localizationRunReportId.startsWith("loc-run-"));
    const record = product.localizationRecords[0]!;
    assert.ok(record.localizationId.startsWith("loc-"));
    assert.equal(record.metadataVersion, LOC_METADATA_VERSION);
    assert.equal(record.neverOverwriteCanonicalSourceContent, true);
    assert.equal(record.canonicalSourcePreserved, true);
    assert.equal(record.localizationCategory, "product");

    const service = engine.localizeService({
      targetCountry: "SG",
      validated: true,
    });
    assert.equal(service.localizationRecords[0]!.localizationCategory, "service");

    const storefront = engine.localizeStorefront({
      targetCountry: "JP",
      validated: true,
    });
    assert.equal(storefront.localizationRecords[0]!.localizationCategory, "storefront");

    const marketing = engine.localizeMarketing({
      targetCountry: "AU",
      validated: true,
    });
    assert.equal(marketing.localizationRecords[0]!.localizationCategory, "marketing");
  });

  test("rejects unvalidated path and preserves canonical source flag", async () => {
    const { engine } = await buildEngine();
    engine.connectLocalizationEngine();
    const report = engine.localizeProduct({ targetCountry: "XX" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("brand and customer experience localization work", async () => {
    const { engine } = await buildEngine();
    engine.connectLocalizationEngine();

    const brand = engine.localizeBrand({
      targetCountry: "DE",
      readinessHint: 70,
      validated: true,
    });
    assert.notEqual(brand.validation.decision, "fail", brand.validation.errors.join("; "));
    assert.equal(brand.localizationRecords[0]!.localizationCategory, "branding");

    const cx = engine.localizeCustomerExperience({
      targetCountry: "DE",
      validated: true,
    });
    assert.equal(cx.localizationRecords[0]!.localizationCategory, "customer_experience");
  });

  test("detectGaps and recommendLocalization generate machine-readable outputs", async () => {
    const { engine } = await buildEngine();
    engine.connectLocalizationEngine();
    engine.localizeProduct({
      targetCountry: "MY",
      readinessHint: 45,
      gapHint: 55,
      validated: true,
    });

    const gaps = engine.detectGaps({ validated: true });
    assert.notEqual(gaps.validation.decision, "fail", gaps.validation.errors.join("; "));
    assert.ok(gaps.localizationRecords.length >= 1);

    const recommendations = engine.recommendLocalization({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("loc-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.neverOverwriteCanonicalSourceContent,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendLocLog({
      event: "localization_processing",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectLocalizationEngine();
    const logs = getLocLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectLocalizationEngine();
    engine.localizeProduct({
      targetCountry: "CA",
      readinessHint: 72,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalLocalizationRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectLocalizationEngine();
    engine.localizeProduct({ targetCountry: "a" });
    engine.localizeProduct({ targetCountry: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
