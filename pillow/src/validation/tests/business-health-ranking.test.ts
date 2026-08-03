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
} from "../../portfolio-balance-engine/index.js";
import {
  createBusinessHealthRanking,
  resetBusinessHealthRankingForTesting,
  buildBusinessHealthRankingConfiguration,
  BUSINESS_HEALTH_RANKING_SYSTEM_PATH,
  BHR_CAPABILITIES,
  BUSINESS_HEALTH_RANKING_ID,
} from "../../business-health-ranking/index.js";
import { appendBhrLog, getBhrLogs } from "../../business-health-ranking/bhr-logging.js";

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
      revenueIndex: 85,
      profitabilityIndex: 80,
      operationalEfficiencyIndex: 78,
      customerPerformanceIndex: 82,
      growthIndex: 88,
    },
    validated: true,
  });
  ppe.measureCompanyPerformance({
    companyReference: "company-beta",
    metrics: {
      revenueIndex: 35,
      profitabilityIndex: 30,
      operationalEfficiencyIndex: 32,
      customerPerformanceIndex: 28,
      growthIndex: 25,
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

  const pbe = createPortfolioBalanceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
  });
  await pbe.initialize();

  const engine = createBusinessHealthRanking(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
  });
  await engine.initialize();
  return { engine, epf };
}

describe("X2-09 Business Health Ranking", () => {
  beforeEach(() => {
    resetEnterprisePortfolioFrameworkForTesting();
    resetMultiCompanyRegistryForTesting();
    resetPortfolioPerformanceEngineForTesting();
    resetCrossBusinessKnowledgeEngineForTesting();
    resetCapitalDistributionEngineForTesting();
    resetExecutivePortfolioDashboardForTesting();
    resetPortfolioRiskEngineForTesting();
    resetPortfolioBalanceEngineForTesting();
    resetBusinessHealthRankingForTesting();
  });

  test("buildBusinessHealthRankingConfiguration locks safety flags", () => {
    const config = buildBusinessHealthRankingConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverManipulateBusinessRankings, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.ok(BHR_CAPABILITIES.includes("company_health_measurement"));
  });

  test("business health ranking initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BHR-001");
    assert.equal(state.missionId, "X2-09");
    assert.ok(BUSINESS_HEALTH_RANKING_SYSTEM_PATH.includes("BUSINESS_HEALTH_RANKING"));
  });

  test("connectBusinessHealthRanking registers with EPF via X2-09", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectBusinessHealthRanking();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === BUSINESS_HEALTH_RANKING_ID));
    assert.equal(report.engineRecord.dependencyPresence.portfolioBalanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioRiskEngine, true);
  });

  test("measureBusinessHealth produces dimension scores", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessHealthRanking();
    const report = engine.measureBusinessHealth({ validated: true });
    assert.equal(report.action, "measure_health");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.healthRecords.length >= 2);
    for (const r of report.healthRecords) {
      assert.ok(typeof r.financialHealthScore === "number");
      assert.ok(typeof r.operationalHealthScore === "number");
      assert.ok(typeof r.customerHealthScore === "number");
      assert.ok(typeof r.growthHealthScore === "number");
    }
  });

  test("rankCompanies produces objective company ranking records", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessHealthRanking();
    const report = engine.rankCompanies({ validated: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.rankingRunReportId.startsWith("bhr-run-"));
    assert.ok(report.healthRecords.length >= 2);
    const alpha = report.healthRecords.find((r) => r.companyReference === "company-alpha");
    const beta = report.healthRecords.find((r) => r.companyReference === "company-beta");
    assert.ok(alpha);
    assert.ok(beta);
    assert.ok(alpha!.businessHealthId.startsWith("bhr-"));
    assert.equal(alpha!.metadataVersion, "BHR-001-v1");
    assert.equal(alpha!.rankingManipulated, false);
    assert.equal(alpha!.structuralSignalOnly, true);
    assert.equal(alpha!.overallEnterpriseRanking, 1);
    assert.ok(beta!.overallEnterpriseRanking > alpha!.overallEnterpriseRanking);
  });

  test("detect declining and high-performing businesses", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessHealthRanking();
    engine.rankCompanies({ validated: true });
    const declining = engine.detectDeclining({ validated: true });
    const high = engine.detectHighPerforming({ validated: true });
    assert.ok(declining.healthRecords.some((r) => r.companyReference === "company-beta"));
    assert.ok(high.healthRecords.some((r) => r.companyReference === "company-alpha"));
  });

  test("generatePriorities produces management attention recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessHealthRanking();
    const report = engine.generatePriorities({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.recommendations.length >= 1);
    assert.ok(report.recommendations.every((r) => r.structuralSignalOnly === true));
  });

  test("logging redacts credentials and records ranking events", async () => {
    appendBhrLog({
      event: "test_secret",
      level: "info",
      details: "authorization bearer super-secret-token",
    });
    const logs = getBhrLogs(10);
    assert.ok(logs.some((l) => l.details.includes("redacted")));
  });

  test("missing metrics yield partial validation not crash", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const epf = createEnterprisePortfolioFrameworkEngine(bootstrap);
    await epf.initialize();
    const engine = createBusinessHealthRanking(bootstrap, {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: null,
      portfolioPerformanceEngine: null,
      crossBusinessKnowledgeEngine: null,
      capitalDistributionEngine: null,
      executivePortfolioDashboard: null,
      portfolioRiskEngine: null,
      portfolioBalanceEngine: null,
    });
    await engine.initialize();
    const connect = engine.connectBusinessHealthRanking();
    assert.equal(connect.validation.decision, "partial");
    const measure = engine.measureBusinessHealth({
      companyReference: "orphan-co",
      validated: true,
    });
    assert.notEqual(measure.validation.decision, "fail");
  });

  test("cockpit snapshot and supervisor sync report ranking health", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessHealthRanking();
    engine.rankCompanies({ validated: true });
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.totalHealthRecords >= 2);
    assert.ok(cockpit.dependenciesConnected >= 1);
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore > 0);
    assert.ok(sync.notes.length > 0);
  });
});
