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
  buildPortfolioPerformanceEngineConfiguration,
  PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH,
  PPE_CAPABILITIES,
  PORTFOLIO_PERFORMANCE_ENGINE_ID,
} from "../../portfolio-performance-engine/index.js";
import {
  appendPpeLog,
  getPpeLogs,
} from "../../portfolio-performance-engine/ppe-logging.js";

async function buildEngine() {
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
  mcr.registerCompany({
    companyName: "Beta Services",
    companyId: "company-beta",
    ownershipReference: "structural://ownership/beta",
    validated: true,
  });

  const engine = createPortfolioPerformanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
  });
  await engine.initialize();
  return { engine, epf, mcr };
}

describe("X2-03 Portfolio Performance Engine", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
  });

  test("buildPortfolioPerformanceEngineConfiguration loads defaults", () => {
    const config = buildPortfolioPerformanceEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverManipulatePerformanceMetrics, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(PPE_CAPABILITIES.includes("company_performance_measurement"));
  });

  test("portfolio performance engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PPE-001");
    assert.equal(state.missionId, "X2-03");
    assert.ok(PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH.includes("PORTFOLIO_PERFORMANCE"));
  });

  test("connectPortfolioPerformanceEngine registers with EPF via X2-03", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioPerformanceEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_PERFORMANCE_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.multiCompanyRegistry, true);
  });

  test("measureCompanyPerformance produces machine-readable ppe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioPerformanceEngine();
    const report = engine.measureCompanyPerformance({
      companyReference: "company-alpha",
      metrics: {
        revenueIndex: 72,
        profitabilityIndex: 68,
        operationalEfficiencyIndex: 70,
        customerPerformanceIndex: 65,
        growthIndex: 60,
      },
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.performanceRunReportId.startsWith("ppe-run-"));
    const record = report.performanceRecords[0]!;
    assert.ok(record.portfolioPerformanceId.startsWith("ppe-"));
    assert.equal(record.metadataVersion, "PPE-001-v1");
    assert.equal(record.manipulatedMetrics, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(record.overallPerformanceScore > 0);
  });

  test("compareCompanies ranks companies objectively", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioPerformanceEngine();
    engine.measureCompanyPerformance({
      companyReference: "company-alpha",
      metrics: { revenueIndex: 80, profitabilityIndex: 75, operationalEfficiencyIndex: 70, customerPerformanceIndex: 68, growthIndex: 72 },
      validated: true,
    });
    engine.measureCompanyPerformance({
      companyReference: "company-beta",
      metrics: { revenueIndex: 50, profitabilityIndex: 48, operationalEfficiencyIndex: 52, customerPerformanceIndex: 45, growthIndex: 40 },
      validated: true,
    });
    const report = engine.compareCompanies({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "compare_companies");
    assert.equal(report.performanceRecords[0]?.ranking, 1);
    assert.equal(report.performanceRecords[0]?.companyReference, "company-alpha");
  });

  test("calculatePortfolioKpis and analyzePortfolio", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioPerformanceEngine();
    engine.measureCompanyPerformance({
      companyReference: "company-alpha",
      metrics: { revenueIndex: 70, profitabilityIndex: 66, operationalEfficiencyIndex: 64, customerPerformanceIndex: 62, growthIndex: 60 },
      validated: true,
    });
    engine.measureCompanyPerformance({
      companyReference: "company-beta",
      metrics: { revenueIndex: 55, profitabilityIndex: 50, operationalEfficiencyIndex: 52, customerPerformanceIndex: 48, growthIndex: 45 },
      validated: true,
    });
    const kpis = engine.calculatePortfolioKpis({ validated: true });
    assert.notEqual(kpis.validation.decision, "fail");
    assert.ok(kpis.kpiSnapshot);
    assert.equal(kpis.kpiSnapshot!.companiesMeasured, 2);
    assert.equal(kpis.kpiSnapshot!.structuralSignalOnly, true);

    const analyzed = engine.analyzePortfolio({ validated: true });
    assert.equal(analyzed.action, "analyze_portfolio");
    assert.ok(analyzed.kpiSnapshot);
  });

  test("generateRecommendations produces structural recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioPerformanceEngine();
    engine.measureCompanyPerformance({
      companyReference: "company-beta",
      metrics: { revenueIndex: 40, profitabilityIndex: 42, operationalEfficiencyIndex: 44, customerPerformanceIndex: 41, growthIndex: 38 },
      validated: true,
    });
    engine.calculatePortfolioKpis({ validated: true });
    const report = engine.generateRecommendations();
    assert.equal(report.action, "recommend");
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.recommendations.every((r) => r.structuralSignalOnly === true));
  });

  test("rejects unvalidated measurement", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioPerformanceEngine();
    const report = engine.measureCompanyPerformance({
      companyReference: "company-alpha",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPpeLog({
      event: "kpi_calculation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectPortfolioPerformanceEngine();
    const logs = getPpeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioPerformanceEngine();
    engine.measureCompanyPerformance({
      companyReference: "company-alpha",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.totalPerformanceRecords, 1);
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.dependenciesConnected, 2);
  });
});
