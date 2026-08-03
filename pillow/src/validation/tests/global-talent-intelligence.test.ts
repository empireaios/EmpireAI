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
  buildGlobalTalentIntelligenceConfiguration,
  GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH,
  GLOBAL_TALENT_INTELLIGENCE_ID,
  TAL_CAPABILITIES,
  TAL_METADATA_VERSION,
} from "../../global-talent-intelligence/index.js";
import {
  appendTalLog,
  getTalLogs,
} from "../../global-talent-intelligence/tal-logging.js";

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
  const engine = createGlobalTalentIntelligenceEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, gef };
}

describe("X4-13 Global Talent Intelligence", () => {
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
  });

  test("buildGlobalTalentIntelligenceConfiguration locks safety flags", () => {
    const config = buildGlobalTalentIntelligenceConfiguration(REPO_ROOT, {
      neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: false as never,
      neverExposeCredentials: false as never,
      neverExposeAuthenticationTokens: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveWorkforceTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveWorkforceInformation, true);
    assert.ok(TAL_CAPABILITIES.includes("global_workforce_availability_monitoring"));
    assert.ok(TAL_CAPABILITIES.includes("workforce_shortage_detection"));
  });

  test("global talent intelligence initializes with doctrine PILLOW-TAL-001 / X4-13", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-TAL-001");
    assert.equal(state.missionId, "X4-13");
    assert.ok(GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH.includes("GLOBAL_TALENT"));
  });

  test("connectGlobalTalentIntelligence registers with GEF via X4-13", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectGlobalTalentIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === GLOBAL_TALENT_INTELLIGENCE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.internationalPartnershipEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("availability/regional/capability/performance/cost/utilization produce tal-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTalentIntelligence();
    const input = {
      companyReference: "acme",
      region: "APAC",
      validated: true,
    };

    const availability = engine.monitorGlobalWorkforceAvailability(input);
    assert.notEqual(
      availability.validation.decision,
      "fail",
      availability.validation.errors.join("; "),
    );
    assert.ok(availability.workforceRunReportId.startsWith("tal-run-"));
    const record = availability.workforceRecords[0]!;
    assert.ok(record.workforceIntelligenceId.startsWith("tal-"));
    assert.equal(record.metadataVersion, TAL_METADATA_VERSION);
    assert.equal(record.neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence, true);
    assert.equal(record.unvalidatedDecisionClaim, "none");
    assert.equal(record.workforceCategory, "global_workforce_availability");

    assert.equal(
      engine.monitorRegionalTalentMarkets(input).workforceRecords[0]!.workforceCategory,
      "regional_talent_market",
    );
    assert.equal(
      engine.monitorWorkforceCapabilities(input).workforceRecords[0]!.workforceCategory,
      "workforce_capability",
    );
    assert.equal(
      engine.monitorWorkforcePerformance(input).workforceRecords[0]!.workforceCategory,
      "workforce_performance",
    );
    assert.equal(
      engine.monitorWorkforceCosts({ ...input, costHint: 70 }).workforceRecords[0]!
        .workforceCategory,
      "workforce_cost",
    );
    assert.equal(
      engine.monitorWorkforceUtilization(input).workforceRecords[0]!.workforceCategory,
      "workforce_utilization",
    );
  });

  test("rejects unvalidated path and never claims unvalidated decisions", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTalentIntelligence();
    const report = engine.monitorGlobalWorkforceAvailability({ region: "EU" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("workforce capability monitoring preserves workforce traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTalentIntelligence();
    const capability = engine.monitorWorkforceCapabilities({
      region: "EU",
      capabilityHint: 88,
      validated: true,
    });
    assert.notEqual(
      capability.validation.decision,
      "fail",
      capability.validation.errors.join("; "),
    );
    const record = capability.workforceRecords[0]!;
    assert.equal(record.capabilityScore, 88);
    assert.ok(record.workforceTraceId.startsWith("tal-trace-"));
    assert.equal(record.unvalidatedDecisionClaim, "none");
  });

  test("shortages, opportunities, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTalentIntelligence();

    const shortages = engine.detectWorkforceShortages({
      region: "LATAM",
      shortageHint: true,
      validated: true,
    });
    assert.notEqual(
      shortages.validation.decision,
      "fail",
      shortages.validation.errors.join("; "),
    );
    assert.equal(shortages.workforceRecords[0]!.workforceShortageDetected, true);

    const opportunities = engine.detectWorkforceOpportunities({
      region: "LATAM",
      opportunityHint: true,
      validated: true,
    });
    assert.equal(opportunities.workforceRecords[0]!.workforceOpportunityDetected, true);

    const recommendations = engine.recommendWorkforce({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("tal-rec-"));
    assert.equal(recommendations.recommendations[0]!.unvalidatedDecisionClaim, "none");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendTalLog({
      event: "workforce_monitoring",
      level: "info",
      details: "api_key=secret-key salary=120000",
    });
    engine.connectGlobalTalentIntelligence();
    const logs = getTalLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("120000")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTalentIntelligence();
    engine.monitorGlobalWorkforceAvailability({
      region: "APAC",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalWorkforceRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTalentIntelligence();
    engine.monitorGlobalWorkforceAvailability({ region: "a" });
    engine.monitorGlobalWorkforceAvailability({ region: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
