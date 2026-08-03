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
  buildExecutiveGlobalDashboardConfiguration,
  EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH,
  EXECUTIVE_GLOBAL_DASHBOARD_ID,
  EGD_CAPABILITIES,
  EGD_METADATA_VERSION,
} from "../../executive-global-dashboard/index.js";
import {
  appendEgdLog,
  getEgdLogs,
} from "../../executive-global-dashboard/egd-logging.js";

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
  const engine = createExecutiveGlobalDashboardEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, gef };
}

describe("X4-10 Executive Global Dashboard", () => {
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
  });

  test("buildExecutiveGlobalDashboardConfiguration locks safety flags", () => {
    const config = buildExecutiveGlobalDashboardConfiguration(REPO_ROOT, {
      neverExposeRestrictedEnterpriseInformation: false as never,
      neverExposeCredentials: false as never,
      requireAuthorizedAccess: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeRestrictedEnterpriseInformation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.requireAuthorizedAccess, true);
    assert.equal(config.preserveDashboardTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(EGD_CAPABILITIES.includes("worldwide_operations_display"));
    assert.ok(EGD_CAPABILITIES.includes("executive_alerts_display"));
  });

  test("executive global dashboard initializes with doctrine PILLOW-EGD-001 / X4-10", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EGD-001");
    assert.equal(state.missionId, "X4-10");
    assert.ok(EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH.includes("EXECUTIVE_GLOBAL_DASHBOARD"));
  });

  test("connectExecutiveGlobalDashboard registers with GEF via X4-10", async () => {
    const { engine, gef } = await buildEngine();
    const report = engine.connectExecutiveGlobalDashboard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = gef.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.expansionModuleIdentifier === EXECUTIVE_GLOBAL_DASHBOARD_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.globalMarketIntelligence, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("worldwide/country/regional/market/logistics/compliance/tax/localization widgets", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveGlobalDashboard();
    const input = { companyReference: "acme", validated: true, authorized: true };

    const worldwide = engine.displayWorldwideOperations(input);
    assert.notEqual(
      worldwide.validation.decision,
      "fail",
      worldwide.validation.errors.join("; "),
    );
    assert.ok(worldwide.dashboardRunReportId.startsWith("egd-run-"));
    const snap = worldwide.snapshots[0]!;
    assert.ok(snap.dashboardId.startsWith("egd-"));
    assert.equal(snap.metadataVersion, EGD_METADATA_VERSION);
    assert.equal(snap.neverExposeRestrictedEnterpriseInformation, true);
    assert.equal(snap.restrictedInformationExposureClaim, "none");
    assert.equal(snap.authorizedAccess, true);
    assert.ok(snap.activeWidgets.includes("worldwide_operations"));

    assert.ok(
      engine.displayCountryExpansion(input).snapshots[0]!.activeWidgets.includes(
        "country_expansion",
      ),
    );
    assert.ok(
      engine.displayRegionalPerformance(input).snapshots[0]!.activeWidgets.includes(
        "regional_performance",
      ),
    );
    assert.ok(
      engine.displayMarketOpportunities(input).snapshots[0]!.activeWidgets.includes(
        "market_opportunities",
      ),
    );
    assert.ok(
      engine.displayLogisticsPerformance(input).snapshots[0]!.activeWidgets.includes(
        "logistics_performance",
      ),
    );
    assert.ok(
      engine.displayComplianceStatus(input).snapshots[0]!.activeWidgets.includes(
        "compliance_status",
      ),
    );
    assert.ok(
      engine.displayTaxationStatus(input).snapshots[0]!.activeWidgets.includes(
        "taxation_status",
      ),
    );
    assert.ok(
      engine.displayLocalizationReadiness(input).snapshots[0]!.activeWidgets.includes(
        "localization_readiness",
      ),
    );
  });

  test("rejects unvalidated path and never exposes restricted information", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveGlobalDashboard();
    const report = engine.displayWorldwideOperations({ companyReference: "xx" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("refresh preserves dashboard traceability", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveGlobalDashboard();
    const refresh = engine.refreshDashboard({
      companyReference: "acme",
      validated: true,
      authorized: true,
    });
    assert.notEqual(refresh.validation.decision, "fail", refresh.validation.errors.join("; "));
    const snap = refresh.snapshots[0]!;
    assert.ok(snap.dashboardTraceId.startsWith("egd-trace-"));
    assert.ok(snap.globalOperationsSummary.length > 0);
    assert.ok(snap.taxationSummary.length > 0);
    assert.ok(snap.localizationReadinessSummary.length > 0);
    assert.equal(snap.restrictedInformationExposureClaim, "none");
  });

  test("executive alerts and global recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveGlobalDashboard();
    const input = {
      companyReference: "acme",
      validated: true,
      authorized: true,
      alertHint: true,
    };

    const alerts = engine.displayExecutiveAlerts(input);
    assert.notEqual(alerts.validation.decision, "fail", alerts.validation.errors.join("; "));
    assert.ok(alerts.snapshots[0]!.executiveAlerts.length >= 1);

    const recommendations = engine.displayGlobalRecommendations(input);
    assert.notEqual(
      recommendations.validation.decision,
      "fail",
      recommendations.validation.errors.join("; "),
    );
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("egd-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.restrictedInformationExposureClaim,
      "none",
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendEgdLog({
      event: "dashboard_refresh",
      level: "info",
      details: "api_key=secret-key restricted_data=payroll.csv",
    });
    engine.connectExecutiveGlobalDashboard();
    const logs = getEgdLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("payroll.csv")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveGlobalDashboard();
    engine.displayWorldwideOperations({
      companyReference: "acme",
      validated: true,
      authorized: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalSnapshots >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
  });

  test("diagnostics and recovery readiness track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveGlobalDashboard();
    engine.displayWorldwideOperations({ companyReference: "a" });
    engine.displayWorldwideOperations({ companyReference: "b" });
    const diagnostics = engine.runDiagnostics({});
    assert.notEqual(diagnostics.validation.decision, "fail");
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
