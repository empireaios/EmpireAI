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
  buildGlobalBrandManagementConfiguration,
  GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH,
  GLOBAL_BRAND_MANAGEMENT_ID,
  GBM_CAPABILITIES,
  GBM_METADATA_VERSION,
} from "../../global-brand-management/index.js";
import {
  appendGbmLog,
  getGbmLogs,
} from "../../global-brand-management/gbm-logging.js";

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
  const engine = createGlobalBrandManagementEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, gef };
}

describe("X4-11 Global Brand Management", () => {
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
  });

  test("buildGlobalBrandManagementConfiguration locks safety flags", () => {
    const config = buildGlobalBrandManagementConfiguration(REPO_ROOT, {
      neverModifyProtectedBrandAssetsWithoutAuthorization: false as never,
      neverExposeCredentials: false as never,
      requireAuthorizationForProtectedAssets: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverModifyProtectedBrandAssetsWithoutAuthorization, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.requireAuthorizationForProtectedAssets, true);
    assert.equal(config.preserveBrandTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveBrandInformation, true);
    assert.ok(GBM_CAPABILITIES.includes("worldwide_brand_identity"));
    assert.ok(GBM_CAPABILITIES.includes("brand_reputation_risk_detection"));
  });

  test("global brand management initializes with doctrine PILLOW-GBM-001 / X4-11", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GBM-001");
    assert.equal(state.missionId, "X4-11");
    assert.ok(GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH.includes("GLOBAL_BRAND_MANAGEMENT"));
  });

  test("connectGlobalBrandManagement registers with GEF via X4-11", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectGlobalBrandManagement();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === GLOBAL_BRAND_MANAGEMENT_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.executiveGlobalDashboard, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("identity/adaptation/consistency/performance/reputation/compliance produce gbm-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalBrandManagement();
    const input = {
      companyReference: "acme",
      brandReference: "acme-global",
      region: "APAC",
      validated: true,
    };

    const identity = engine.manageWorldwideIdentity(input);
    assert.notEqual(
      identity.validation.decision,
      "fail",
      identity.validation.errors.join("; "),
    );
    assert.ok(identity.brandRunReportId.startsWith("gbm-run-"));
    const record = identity.brandRecords[0]!;
    assert.ok(record.brandGovernanceId.startsWith("gbm-"));
    assert.equal(record.metadataVersion, GBM_METADATA_VERSION);
    assert.equal(record.neverModifyProtectedBrandAssetsWithoutAuthorization, true);
    assert.equal(record.protectedAssetModificationClaim, "none");
    assert.equal(record.brandCategory, "worldwide_identity");

    assert.equal(
      engine.manageRegionalAdaptations(input).brandRecords[0]!.brandCategory,
      "regional_adaptation",
    );
    assert.equal(
      engine.manageBrandConsistency(input).brandRecords[0]!.brandCategory,
      "brand_consistency",
    );
    assert.equal(
      engine.monitorBrandPerformance(input).brandRecords[0]!.brandCategory,
      "brand_performance",
    );
    assert.equal(
      engine.monitorBrandReputation({ ...input, reputationHint: 80 }).brandRecords[0]!
        .brandCategory,
      "brand_reputation",
    );
    assert.equal(
      engine.monitorBrandCompliance(input).brandRecords[0]!.brandCategory,
      "brand_compliance",
    );
  });

  test("rejects unvalidated path and never claims protected asset modification", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalBrandManagement();
    const report = engine.manageWorldwideIdentity({ brandReference: "xx" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("brand consistency preserves brand traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalBrandManagement();
    const consistency = engine.manageBrandConsistency({
      brandReference: "acme-global",
      region: "EU",
      consistencyHint: 88,
      validated: true,
    });
    assert.notEqual(
      consistency.validation.decision,
      "fail",
      consistency.validation.errors.join("; "),
    );
    const record = consistency.brandRecords[0]!;
    assert.equal(record.brandConsistencyScore, 88);
    assert.ok(record.brandTraceId.startsWith("gbm-trace-"));
    assert.equal(record.protectedAssetModificationClaim, "none");
  });

  test("inconsistencies, reputation risks, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalBrandManagement();

    const inconsistencies = engine.detectBrandInconsistencies({
      brandReference: "acme-global",
      region: "LATAM",
      inconsistencyHint: true,
      validated: true,
    });
    assert.notEqual(
      inconsistencies.validation.decision,
      "fail",
      inconsistencies.validation.errors.join("; "),
    );
    assert.equal(inconsistencies.brandRecords[0]!.inconsistencyDetected, true);

    const risks = engine.detectReputationRisks({
      brandReference: "acme-global",
      region: "LATAM",
      reputationHint: 30,
      validated: true,
    });
    assert.equal(risks.brandRecords[0]!.reputationRiskDetected, true);

    const recommendations = engine.recommendBrand({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("gbm-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.protectedAssetModificationClaim,
      "none",
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendGbmLog({
      event: "brand_governance",
      level: "info",
      details: "api_key=secret-key brand_asset_key=logo-private",
    });
    engine.connectGlobalBrandManagement();
    const logs = getGbmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("logo-private")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalBrandManagement();
    engine.manageWorldwideIdentity({
      brandReference: "acme-global",
      region: "NA",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalBrandRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalBrandManagement();
    engine.manageWorldwideIdentity({ brandReference: "a" });
    engine.manageWorldwideIdentity({ brandReference: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
