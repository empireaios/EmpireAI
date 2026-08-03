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
  buildGlobalTaxIntelligenceConfiguration,
  GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH,
  GLOBAL_TAX_INTELLIGENCE_ID,
  GTI_CAPABILITIES,
  GTI_METADATA_VERSION,
} from "../../global-tax-intelligence/index.js";
import {
  appendGtiLog,
  getGtiLogs,
} from "../../global-tax-intelligence/gti-logging.js";

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
  const engine = createGlobalTaxIntelligenceEngine(bootstrap, {
    globalExpansionFramework: gef,
    countryIntelligenceEngine: cie,
    localizationEngine: loc,
    languageIntelligence: li,
    currencyIntelligence: cur,
    regionalComplianceEngine: rce,
  });
  await engine.initialize();
  return { engine, gef };
}

describe("X4-07 Global Tax Intelligence", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
    resetCountryIntelligenceEngineForTesting();
    resetLocalizationEngineForTesting();
    resetLanguageIntelligenceForTesting();
    resetCurrencyIntelligenceForTesting();
    resetRegionalComplianceEngineForTesting();
    resetGlobalTaxIntelligenceForTesting();
  });

  test("buildGlobalTaxIntelligenceConfiguration locks safety flags", () => {
    const config = buildGlobalTaxIntelligenceConfiguration(REPO_ROOT, {
      neverProvideUnvalidatedTaxAsLegalAdvice: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverProvideUnvalidatedTaxAsLegalAdvice, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveTaxCalculationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveFinancialInformation, true);
    assert.ok(GTI_CAPABILITIES.includes("tax_obligation_estimation"));
    assert.ok(GTI_CAPABILITIES.includes("cross_border_tax_requirements"));
  });

  test("global tax intelligence initializes with doctrine PILLOW-GTI-001 / X4-07", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GTI-001");
    assert.equal(state.missionId, "X4-07");
    assert.ok(GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH.includes("GLOBAL_TAX_INTELLIGENCE"));
  });

  test("connectGlobalTaxIntelligence registers with GEF via X4-07", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectGlobalTaxIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === GLOBAL_TAX_INTELLIGENCE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.regionalComplianceEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("country/regulatory/indirect/direct/cross-border produce gti-* records without legal advice", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTaxIntelligence();

    const country = engine.manageCountryTaxRules({
      country: "SG",
      riskHint: 30,
      validated: true,
    });
    assert.notEqual(country.validation.decision, "fail", country.validation.errors.join("; "));
    assert.ok(country.taxRunReportId.startsWith("gti-run-"));
    const record = country.taxRecords[0]!;
    assert.ok(record.taxIntelligenceId.startsWith("gti-"));
    assert.equal(record.metadataVersion, GTI_METADATA_VERSION);
    assert.equal(record.neverProvideUnvalidatedTaxAsLegalAdvice, true);
    assert.equal(record.authoritativeLegalAdviceClaim, "none");
    assert.equal(record.taxCategory, "country_specific");
    assert.equal(record.obligationUnit, "structural_units");

    const regulatory = engine.monitorTaxRegulationUpdates({
      country: "DE",
      validated: true,
    });
    assert.equal(regulatory.taxRecords[0]!.taxCategory, "regulatory_update");

    const indirect = engine.manageIndirectTaxes({ country: "AU", validated: true });
    assert.equal(indirect.taxRecords[0]!.taxCategory, "indirect");

    const direct = engine.manageDirectTaxes({ country: "JP", validated: true });
    assert.equal(direct.taxRecords[0]!.taxCategory, "direct");

    const cross = engine.manageCrossBorder({ country: "US", validated: true });
    assert.equal(cross.taxRecords[0]!.taxCategory, "cross_border");
  });

  test("rejects unvalidated path and never claims legal advice", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTaxIntelligence();
    const report = engine.manageCountryTaxRules({ country: "XX" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("obligation estimation preserves calculation traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTaxIntelligence();
    const estimate = engine.estimateTaxObligation({
      country: "CA",
      obligationHint: 1200,
      validated: true,
    });
    assert.notEqual(estimate.validation.decision, "fail", estimate.validation.errors.join("; "));
    const record = estimate.taxRecords[0]!;
    assert.equal(record.taxCategory, "obligation_estimate");
    assert.equal(record.estimatedTaxObligation, 1200);
    assert.ok(record.calculationTraceId.startsWith("gti-trace-"));
    assert.equal(record.authoritativeLegalAdviceClaim, "none");
  });

  test("compliance risks, optimization, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTaxIntelligence();

    const risks = engine.detectComplianceRisks({
      country: "BR",
      riskHint: 85,
      validated: true,
    });
    assert.notEqual(risks.validation.decision, "fail", risks.validation.errors.join("; "));
    assert.ok(["critical", "high", "medium"].includes(risks.taxRecords[0]!.riskLevel));

    const optimization = engine.detectOptimizationOpportunities({
      country: "BR",
      validated: true,
    });
    assert.equal(optimization.taxRecords[0]!.optimizationOpportunity, true);
    assert.equal(optimization.taxRecords[0]!.taxCategory, "optimization");

    const recommendations = engine.recommendTax({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("gti-rec-"));
    assert.equal(recommendations.recommendations[0]!.authoritativeLegalAdviceClaim, "none");
    assert.equal(
      recommendations.recommendations[0]!.neverProvideUnvalidatedTaxAsLegalAdvice,
      true,
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendGtiLog({
      event: "tax_calculations",
      level: "info",
      details: "api_key=secret-key tax_id=999-88-7777",
    });
    engine.connectGlobalTaxIntelligence();
    const logs = getGtiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("999-88-7777")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTaxIntelligence();
    engine.manageCountryTaxRules({ country: "CA", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalTaxRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectGlobalTaxIntelligence();
    engine.manageCountryTaxRules({ country: "a" });
    engine.manageCountryTaxRules({ country: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
