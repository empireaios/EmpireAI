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
} from "../../executive-portfolio-dashboard/index.js";
import {
  createPortfolioRiskEngine,
  resetPortfolioRiskEngineForTesting,
  buildPortfolioRiskEngineConfiguration,
  PORTFOLIO_RISK_ENGINE_SYSTEM_PATH,
  PRE_CAPABILITIES,
  PORTFOLIO_RISK_ENGINE_ID,
} from "../../portfolio-risk-engine/index.js";
import { appendPreLog, getPreLogs } from "../../portfolio-risk-engine/pre-logging.js";

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

  const ppe = createPortfolioPerformanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
  });
  await ppe.initialize();
  ppe.connectPortfolioPerformanceEngine();
  ppe.measureCompanyPerformance({
    companyReference: "company-alpha",
    metrics: {
      revenueIndex: 45,
      profitabilityIndex: 42,
      operationalEfficiencyIndex: 40,
      customerPerformanceIndex: 38,
      growthIndex: 44,
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
  cde.manageCapitalPool({ availableUnits: 50, validated: true });

  const epd = createExecutivePortfolioDashboard(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
  });
  await epd.initialize();
  epd.connectExecutivePortfolioDashboard();
  epd.refreshDashboard({ validated: true });

  const engine = createPortfolioRiskEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
  });
  await engine.initialize();
  return { engine, epf };
}

describe("X2-07 Portfolio Risk Engine", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
    resetExecutivePortfolioDashboardForTesting();
    resetPortfolioRiskEngineForTesting();
  });

  test("buildPortfolioRiskEngineConfiguration loads defaults", () => {
    const config = buildPortfolioRiskEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverSuppressCriticalRisks, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(PRE_CAPABILITIES.includes("enterprise_risk_monitoring"));
  });

  test("portfolio risk engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PRE-001");
    assert.equal(state.missionId, "X2-07");
    assert.ok(PORTFOLIO_RISK_ENGINE_SYSTEM_PATH.includes("PORTFOLIO_RISK"));
  });

  test("connectPortfolioRiskEngine registers with EPF via X2-07", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioRiskEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_RISK_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.multiCompanyRegistry, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.crossBusinessKnowledgeEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capitalDistributionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.executivePortfolioDashboard, true);
  });

  test("monitorRisks produces machine-readable pre-* risk records", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioRiskEngine();
    const report = engine.monitorRisks({ validated: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.riskRunReportId.startsWith("pre-run-"));
    assert.ok(report.riskRecords.length > 0);
    const record = report.riskRecords[0]!;
    assert.ok(record.riskRecordId.startsWith("pre-"));
    assert.equal(record.metadataVersion, "PRE-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.suppressedCritical, false);
    assert.ok(typeof record.riskProbability === "number");
    assert.ok(typeof record.riskImpact === "number");
  });

  test("analyze financial and operational risks", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioRiskEngine();
    const financial = engine.analyzeFinancialRisk({ validated: true });
    assert.equal(financial.action, "analyze_financial");
    assert.ok(financial.riskRecords.every((r) => r.riskCategory === "financial"));

    const operational = engine.analyzeOperationalRisk({ validated: true });
    assert.equal(operational.action, "analyze_operational");
    assert.ok(operational.riskRecords.every((r) => r.riskCategory === "operational"));
  });

  test("score portfolio risk and detect emerging risks", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioRiskEngine();
    engine.monitorRisks({ validated: true });
    engine.analyzeFinancialRisk({ validated: true });
    const scored = engine.scorePortfolioRisk({ validated: true });
    assert.equal(scored.action, "score");
    assert.ok(scored.scoreSummary);
    assert.ok(scored.scoreSummary!.overallPortfolioRiskScore >= 0);

    const emerging = engine.detectEmergingRisks({ validated: true });
    assert.equal(emerging.action, "detect_emerging");
    assert.ok(emerging.riskRecords.every((r) => r.emerging === true));
  });

  test("generateRecommendations produces structural mitigation recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioRiskEngine();
    engine.monitorRisks({ validated: true });
    engine.analyzeFinancialRisk({ validated: true });
    engine.scorePortfolioRisk({ validated: true });
    const report = engine.generateRecommendations({ validated: true });
    assert.equal(report.action, "recommend");
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.recommendations.every((r) => r.structuralSignalOnly === true));
  });

  test("rejects unvalidated monitoring and credential-like company references", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioRiskEngine();
    const unvalidated = engine.monitorRisks({ validated: false });
    assert.equal(unvalidated.validation.decision, "fail");

    const credential = engine.monitorRisks({
      companyReference: "token=secret-value",
      validated: true,
    });
    assert.equal(credential.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPreLog({
      event: "risk_monitoring",
      level: "info",
      details: "api_key=secret-key password=hunter2",
    });
    engine.connectPortfolioRiskEngine();
    const logs = getPreLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync health monitoring and cockpit snapshot", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioRiskEngine();
    engine.monitorRisks({ validated: true });
    engine.scorePortfolioRisk({ validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.totalRiskRecords >= 1);
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.dependenciesConnected, 6);
    const state = engine.getState();
    assert.ok(state.health.healthScore >= 0);
    assert.ok(state.performance.monitoringRuns >= 1);
  });
});
