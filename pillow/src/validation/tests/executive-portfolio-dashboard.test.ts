import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createEnterprisePortfolioFrameworkEngine,
  resetEnterprisePortfolioFrameworkForTesting,
} from "../../enterprise-portfolio-framework/index.js";
import {
  createMultiCompanyRegistry,
  resetMultiCompanyRegistryForTesting,
} from "../../multi-company-registry/index.js";
import {
  createPortfolioPerformanceEngine,
  resetPortfolioPerformanceEngineForTesting,
} from "../../portfolio-performance-engine/index.js";
import {
  createCrossBusinessKnowledgeEngine,
  resetCrossBusinessKnowledgeEngineForTesting,
} from "../../cross-business-knowledge-engine/index.js";
import {
  createCapitalDistributionEngine,
  resetCapitalDistributionEngineForTesting,
} from "../../capital-distribution-engine/index.js";
import {
  createExecutivePortfolioDashboard,
  resetExecutivePortfolioDashboardForTesting,
  buildExecutivePortfolioDashboardConfiguration,
  EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH,
  EPD_CAPABILITIES,
  EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
} from "../../executive-portfolio-dashboard/index.js";
import {
  appendEpdLog,
  getEpdLogs,
} from "../../executive-portfolio-dashboard/epd-logging.js";

async function buildDashboard() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const epf = createEnterprisePortfolioFrameworkEngine(bootstrap);
  await epf.initialize();
  const mcr = createMultiCompanyRegistry(bootstrap, {
    enterprisePortfolioFramework: epf,
  });
  await mcr.initialize();
  mcr.connectMultiCompanyRegistry();
  mcr.registerCompany({
    companyName: "Alpha Commerce Co",
    companyId: "company-alpha",
    ownershipReference: "structural://ownership/alpha",
    validated: true,
  });

  const ppe = createPortfolioPerformanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
  });
  await ppe.initialize();
  ppe.connectPortfolioPerformanceEngine();
  ppe.measureCompanyPerformance({
    companyReference: "company-alpha",
    metrics: {
      revenueIndex: 75,
      profitabilityIndex: 70,
      operationalEfficiencyIndex: 68,
      customerPerformanceIndex: 66,
      growthIndex: 72,
    },
    validated: true,
  });

  const cbk = createCrossBusinessKnowledgeEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
  });
  await cbk.initialize();

  const cde = createCapitalDistributionEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
  });
  await cde.initialize();
  cde.connectCapitalDistributionEngine();
  cde.manageCapitalPool({ availableUnits: 200, validated: true });
  cde.allocateCapital({
    companyReference: "company-alpha",
    investmentOpportunityReference: "structural://opportunity/alpha-growth",
    requestedCapital: 50,
    expectedRoiHint: 25,
    validated: true,
  });

  const dashboard = createExecutivePortfolioDashboard(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
  });
  await dashboard.initialize();
  return { dashboard, epf };
}

describe("X2-06 Executive Portfolio Dashboard", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
    resetExecutivePortfolioDashboardForTesting();
  });

  test("buildExecutivePortfolioDashboardConfiguration loads defaults", () => {
    const config = buildExecutivePortfolioDashboardConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverPermitUnauthorizedAccess, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(EPD_CAPABILITIES.includes("enterprise_portfolio_summary_display"));
  });

  test("executive portfolio dashboard initializes with doctrine doc", async () => {
    const { dashboard } = await buildDashboard();
    const state = dashboard.getState();
    assert.equal(state.engineVersion, "PILLOW-EPD-001");
    assert.equal(state.missionId, "X2-06");
    assert.ok(EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH.includes("EXECUTIVE_PORTFOLIO"));
  });

  test("connectExecutivePortfolioDashboard registers with EPF via X2-06", async () => {
    const { dashboard, epf } = await buildDashboard();
    const report = dashboard.connectExecutivePortfolioDashboard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === EXECUTIVE_PORTFOLIO_DASHBOARD_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.multiCompanyRegistry, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.crossBusinessKnowledgeEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capitalDistributionEngine, true);
  });

  test("refreshDashboard produces machine-readable epd-* snapshot with summaries", async () => {
    const { dashboard } = await buildDashboard();
    dashboard.connectExecutivePortfolioDashboard();
    const report = dashboard.refreshDashboard({ validated: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.dashboardRunReportId.startsWith("epd-run-"));
    const snapshot = report.snapshot!;
    assert.ok(snapshot.dashboardId.startsWith("epd-dash-"));
    assert.equal(snapshot.metadataVersion, "EPD-001-v1");
    assert.equal(snapshot.structuralSignalOnly, true);
    assert.equal(snapshot.unauthorizedAccess, false);
    assert.ok(snapshot.portfolioSummary.registeredModules >= 0);
    assert.ok(snapshot.companySummary.totalCompanies >= 1);
    assert.ok(snapshot.portfolioKpiSummary.companiesMeasured >= 1);
    assert.ok(snapshot.capitalAllocationSummary.allocationCount >= 1);
    assert.ok(snapshot.growthSummary.averageGrowthIndex >= 0);
    assert.ok(snapshot.enterpriseHealthSummary.overallHealthScore >= 0);
    assert.ok(snapshot.widgets.length >= 8);
  });

  test("executive alerts and recommendations function correctly", async () => {
    const { dashboard } = await buildDashboard();
    dashboard.connectExecutivePortfolioDashboard();
    dashboard.refreshDashboard({ validated: true });
    const alerts = dashboard.generateExecutiveAlerts({ validated: true });
    assert.equal(alerts.action, "generate_alerts");
    assert.ok(Array.isArray(alerts.snapshot?.executiveAlerts));
    const recs = dashboard.generateRecommendations({ validated: true });
    assert.equal(recs.action, "recommend");
    assert.ok((recs.snapshot?.executiveRecommendations.length ?? 0) > 0);
    assert.ok(
      recs.snapshot!.executiveRecommendations.every((r) => r.structuralSignalOnly === true),
    );
  });

  test("aggregatePortfolioKpis and drill-down capability", async () => {
    const { dashboard } = await buildDashboard();
    dashboard.connectExecutivePortfolioDashboard();
    const kpis = dashboard.aggregatePortfolioKpis({ validated: true });
    assert.equal(kpis.action, "aggregate_kpis");
    assert.ok((kpis.snapshot?.portfolioKpiSummary.overallKpiScore ?? -1) >= 0);

    const drill = dashboard.drillDown({
      focus: "company",
      focusReference: "company-alpha",
      validated: true,
    });
    assert.equal(drill.action, "drill_down");
    assert.ok(drill.snapshot?.drillDown);
    assert.equal(drill.snapshot!.drillDown!.focus, "company");
    assert.ok(drill.snapshot!.drillDown!.details.length > 0);
  });

  test("rejects unvalidated refresh and credential-like drill-down", async () => {
    const { dashboard } = await buildDashboard();
    dashboard.connectExecutivePortfolioDashboard();
    const refresh = dashboard.refreshDashboard({ validated: false });
    assert.equal(refresh.validation.decision, "fail");

    const drill = dashboard.drillDown({
      focus: "kpi",
      focusReference: "token=secret-value",
      validated: true,
    });
    assert.equal(drill.validation.decision, "fail");
  });

  test("validation and metadata generation on diagnostics", async () => {
    const { dashboard } = await buildDashboard();
    dashboard.connectExecutivePortfolioDashboard();
    dashboard.refreshDashboard({ validated: true });
    const report = dashboard.runDiagnostics({});
    assert.equal(report.action, "diagnostics");
    assert.ok(report.validation.validationReportId.startsWith("epd-val-"));
    assert.equal(report.metadataVersion, "EPD-001-v1");
    assert.notEqual(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { dashboard } = await buildDashboard();
    appendEpdLog({
      event: "dashboard_refresh",
      level: "info",
      details: "api_key=secret-key password=hunter2",
    });
    dashboard.connectExecutivePortfolioDashboard();
    const logs = getEpdLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync health monitoring and cockpit snapshot", async () => {
    const { dashboard } = await buildDashboard();
    dashboard.connectExecutivePortfolioDashboard();
    dashboard.refreshDashboard({ validated: true });
    const sync = dashboard.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = dashboard.getCockpitSnapshot();
    assert.ok(cockpit.companiesTracked >= 1);
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.dependenciesConnected, 5);
    const state = dashboard.getState();
    assert.ok(state.health.healthScore >= 0);
    assert.ok(state.performance.dashboardRefreshes >= 1);
  });
});
