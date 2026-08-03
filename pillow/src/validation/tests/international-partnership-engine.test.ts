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
  buildInternationalPartnershipEngineConfiguration,
  INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH,
  INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
  IPE_CAPABILITIES,
  IPE_METADATA_VERSION,
} from "../../international-partnership-engine/index.js";
import {
  appendIpeLog,
  getIpeLogs,
} from "../../international-partnership-engine/ipe-logging.js";

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
  const engine = createInternationalPartnershipEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, gef };
}

describe("X4-12 International Partnership Engine", () => {
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
  });

  test("buildInternationalPartnershipEngineConfiguration locks safety flags", () => {
    const config = buildInternationalPartnershipEngineConfiguration(REPO_ROOT, {
      neverApproveStrategicPartnershipsWithoutValidation: false as never,
      neverExposeCredentials: false as never,
      neverExposeAuthenticationTokens: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverApproveStrategicPartnershipsWithoutValidation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preservePartnershipTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitivePartnershipInformation, true);
    assert.ok(IPE_CAPABILITIES.includes("strategic_partnership_management"));
    assert.ok(IPE_CAPABILITIES.includes("partnership_risk_detection"));
  });

  test("international partnership engine initializes with doctrine PILLOW-IPE-001 / X4-12", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-IPE-001");
    assert.equal(state.missionId, "X4-12");
    assert.ok(INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH.includes("INTERNATIONAL_PARTNERSHIP"));
  });

  test("connectInternationalPartnershipEngine registers with GEF via X4-12", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectInternationalPartnershipEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === INTERNATIONAL_PARTNERSHIP_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.globalBrandManagement, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("strategic/regional/evaluate/performance/reliability/value produce ipe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalPartnershipEngine();
    const input = {
      companyReference: "acme",
      partnerReference: "apac-partner",
      country: "SG",
      validated: true,
    };

    const strategic = engine.manageStrategicPartnerships(input);
    assert.notEqual(
      strategic.validation.decision,
      "fail",
      strategic.validation.errors.join("; "),
    );
    assert.ok(strategic.partnershipRunReportId.startsWith("ipe-run-"));
    const record = strategic.partnershipRecords[0]!;
    assert.ok(record.partnershipId.startsWith("ipe-"));
    assert.equal(record.metadataVersion, IPE_METADATA_VERSION);
    assert.equal(record.neverApproveStrategicPartnershipsWithoutValidation, true);
    assert.equal(record.unvalidatedApprovalClaim, "none");
    assert.equal(record.partnershipCategory, "strategic_partnership");

    assert.equal(
      engine.manageRegionalPartnerNetworks(input).partnershipRecords[0]!.partnershipCategory,
      "regional_partner_network",
    );
    assert.equal(
      engine.evaluateProspectivePartners(input).partnershipRecords[0]!.partnershipCategory,
      "prospective_partner",
    );
    assert.equal(
      engine.monitorPartnerPerformance(input).partnershipRecords[0]!.partnershipCategory,
      "partner_performance",
    );
    assert.equal(
      engine.monitorPartnerReliability({ ...input, reliabilityHint: 80 }).partnershipRecords[0]!
        .partnershipCategory,
      "partner_reliability",
    );
    assert.equal(
      engine.monitorPartnershipValue(input).partnershipRecords[0]!.partnershipCategory,
      "partnership_value",
    );
  });

  test("rejects unvalidated path and never claims unvalidated approval", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalPartnershipEngine();
    const report = engine.manageStrategicPartnerships({ partnerReference: "xx" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("partnership monitoring preserves partnership traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalPartnershipEngine();
    const performance = engine.monitorPartnerPerformance({
      partnerReference: "apac-partner",
      country: "JP",
      performanceHint: 88,
      validated: true,
    });
    assert.notEqual(
      performance.validation.decision,
      "fail",
      performance.validation.errors.join("; "),
    );
    const record = performance.partnershipRecords[0]!;
    assert.equal(record.performanceScore, 88);
    assert.ok(record.partnershipTraceId.startsWith("ipe-trace-"));
    assert.equal(record.unvalidatedApprovalClaim, "none");
  });

  test("risks, opportunities, and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalPartnershipEngine();

    const risks = engine.detectPartnershipRisks({
      partnerReference: "apac-partner",
      country: "ID",
      riskHint: true,
      validated: true,
    });
    assert.notEqual(risks.validation.decision, "fail", risks.validation.errors.join("; "));
    assert.equal(risks.partnershipRecords[0]!.partnershipRiskDetected, true);

    const opportunities = engine.detectPartnershipOpportunities({
      partnerReference: "apac-partner",
      country: "ID",
      opportunityHint: true,
      validated: true,
    });
    assert.equal(opportunities.partnershipRecords[0]!.partnershipOpportunityDetected, true);

    const recommendations = engine.recommendPartnership({ validated: true });
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("ipe-rec-"));
    assert.equal(recommendations.recommendations[0]!.unvalidatedApprovalClaim, "none");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendIpeLog({
      event: "partner_registration",
      level: "info",
      details: "api_key=secret-key partner_contract=deal-private",
    });
    engine.connectInternationalPartnershipEngine();
    const logs = getIpeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("deal-private")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalPartnershipEngine();
    engine.manageStrategicPartnerships({
      partnerReference: "apac-partner",
      country: "SG",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalPartnershipRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectInternationalPartnershipEngine();
    engine.manageStrategicPartnerships({ partnerReference: "a" });
    engine.manageStrategicPartnerships({ partnerReference: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
