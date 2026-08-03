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
} from "../../portfolio-risk-engine/index.js";
import {
  createPortfolioBalanceEngine,
  resetPortfolioBalanceEngineForTesting,
  buildPortfolioBalanceEngineConfiguration,
  PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH,
  PBE_CAPABILITIES,
  PORTFOLIO_BALANCE_ENGINE_ID,
} from "../../portfolio-balance-engine/index.js";
import { appendPbeLog, getPbeLogs } from "../../portfolio-balance-engine/pbe-logging.js";

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
    companyName: "Beta Services Co",
    companyId: "company-beta",
    ownershipReference: "structural://ownership/beta",
    companyCategory: "services",
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
      revenueIndex: 80,
      profitabilityIndex: 75,
      operationalEfficiencyIndex: 70,
      customerPerformanceIndex: 68,
      growthIndex: 72,
    },
    validated: true,
  });
  ppe.measureCompanyPerformance({
    companyReference: "company-beta",
    metrics: {
      revenueIndex: 40,
      profitabilityIndex: 38,
      operationalEfficiencyIndex: 42,
      customerPerformanceIndex: 35,
      growthIndex: 40,
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
    investmentOpportunityReference: "structural://opportunity/alpha-a",
    requestedCapital: 120,
    expectedRoiHint: 30,
    validated: true,
  });

  const epd = createExecutivePortfolioDashboard(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
  });
  await epd.initialize();

  const pre = createPortfolioRiskEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
  });
  await pre.initialize();

  const engine = createPortfolioBalanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
  });
  await engine.initialize();
  return { engine, epf };
}

describe("X2-08 Portfolio Balance Engine", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
    resetExecutivePortfolioDashboardForTesting();
    resetPortfolioRiskEngineForTesting();
    resetPortfolioBalanceEngineForTesting();
  });

  test("buildPortfolioBalanceEngineConfiguration loads defaults", () => {
    const config = buildPortfolioBalanceEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverAutoRebalanceBeyondApprovalPolicy, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.ok(PBE_CAPABILITIES.includes("portfolio_diversification_measurement"));
  });

  test("portfolio balance engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PBE-001");
    assert.equal(state.missionId, "X2-08");
    assert.ok(PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH.includes("PORTFOLIO_BALANCE"));
  });

  test("connectPortfolioBalanceEngine registers with EPF via X2-08", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioBalanceEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_BALANCE_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.portfolioRiskEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.executivePortfolioDashboard, true);
  });

  test("measureDiversification and concentration produce scores", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioBalanceEngine();
    const div = engine.measureDiversification({ validated: true });
    assert.equal(div.action, "measure_diversification");
    assert.notEqual(div.validation.decision, "fail");

    const conc = engine.analyzeConcentration({ validated: true });
    assert.equal(conc.action, "analyze_concentration");
    assert.notEqual(conc.validation.decision, "fail");

    const exp = engine.analyzeExposure({ validated: true });
    assert.equal(exp.action, "analyze_exposure");
  });

  test("optimize produces machine-readable pbe-* balance records without auto-rebalance", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioBalanceEngine();
    const report = engine.optimizePortfolioBalance({ validated: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.balanceRunReportId.startsWith("pbe-run-"));
    assert.ok(report.balanceRecords.length > 0);
    const record = report.balanceRecords[0]!;
    assert.ok(record.portfolioBalanceId.startsWith("pbe-"));
    assert.equal(record.metadataVersion, "PBE-001-v1");
    assert.equal(record.autoRebalanceApplied, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(typeof record.diversificationScore === "number");
    assert.ok(typeof record.industryConcentrationScore === "number");
    assert.ok(typeof record.revenueConcentrationScore === "number");
    assert.ok(typeof record.capitalConcentrationScore === "number");
    assert.ok(record.recommendedBalancingActions.every((a) => a.requiresManualApproval === true));
    assert.ok(record.recommendedBalancingActions.every((a) => a.autoApplied === false));
  });

  test("detectImbalance and generateRecommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioBalanceEngine();
    const imbalance = engine.detectImbalance({ validated: true });
    assert.equal(imbalance.action, "detect_imbalance");
    assert.ok(imbalance.balanceRecords.length > 0);

    const recs = engine.generateRecommendations({ validated: true });
    assert.equal(recs.action, "recommend");
    assert.ok(recs.recommendations.length > 0);
    assert.ok(recs.recommendations.every((r) => r.structuralSignalOnly === true));
    assert.ok(recs.recommendations.every((r) => r.autoApplied === false));
  });

  test("rejects unvalidated operations and credential-like references", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioBalanceEngine();
    const unvalidated = engine.measureDiversification({ validated: false });
    assert.equal(unvalidated.validation.decision, "fail");

    const credential = engine.measureDiversification({
      portfolioReference: "token=secret-value",
      validated: true,
    });
    assert.equal(credential.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPbeLog({
      event: "diversification_analysis",
      level: "info",
      details: "api_key=secret-key password=hunter2",
    });
    engine.connectPortfolioBalanceEngine();
    const logs = getPbeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("diagnostics and metadata generation", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioBalanceEngine();
    engine.optimizePortfolioBalance({ validated: true });
    const report = engine.runDiagnostics({});
    assert.equal(report.action, "diagnostics");
    assert.ok(report.validation.validationReportId.startsWith("pbe-val-"));
    assert.equal(report.metadataVersion, "PBE-001-v1");
    assert.notEqual(report.validation.decision, "fail");
  });

  test("validateForSupervisorSync health monitoring and cockpit snapshot", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioBalanceEngine();
    engine.optimizePortfolioBalance({ validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.totalBalanceRecords >= 1);
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.dependenciesConnected, 7);
    const state = engine.getState();
    assert.ok(state.health.healthScore >= 0);
    assert.ok(state.performance.optimizationRuns >= 1);
  });
});
