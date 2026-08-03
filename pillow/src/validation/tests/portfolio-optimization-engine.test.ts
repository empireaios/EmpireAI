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
} from "../../business-health-ranking/index.js";
import {
  createSharedSupplierIntelligence,
  resetSharedSupplierIntelligenceForTesting,
} from "../../shared-supplier-intelligence/index.js";
import {
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
} from "../../cross-company-resource-engine/index.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createPortfolioForecastEngine,
  resetPortfolioForecastEngineForTesting,
} from "../../portfolio-forecast-engine/index.js";
import {
  createAcquisitionEvaluationEngine,
  resetAcquisitionEvaluationEngineForTesting,
} from "../../acquisition-evaluation-engine/index.js";
import {
  createPortfolioOptimizationEngine,
  resetPortfolioOptimizationEngineForTesting,
  buildPortfolioOptimizationEngineConfiguration,
  PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH,
  POE_CAPABILITIES,
  PORTFOLIO_OPTIMIZATION_ENGINE_ID,
} from "../../portfolio-optimization-engine/index.js";
import { appendPoeLog, getPoeLogs } from "../../portfolio-optimization-engine/poe-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPortfolioOptimizationEngineConfiguration>[1],
) {
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

  const bhr = createBusinessHealthRanking(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
  });
  await bhr.initialize();

  const ccre = createCrossCompanyResourceEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    crossBusinessKnowledgeEngine: cbk,
    capitalDistributionEngine: cde,
    portfolioIntelligenceCertified: null,
  });
  await ccre.initialize();

  const supplierFramework = createSupplierFrameworkEngine(bootstrap);
  await supplierFramework.initialize();

  const ssi = createSharedSupplierIntelligence(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    crossBusinessKnowledgeEngine: cbk,
    crossCompanyResourceEngine: ccre,
    supplierFramework,
    supplierOperationsCertification: null,
  });
  await ssi.initialize();

  const pfe = createPortfolioForecastEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    portfolioRiskEngine: pre,
    portfolioBalanceEngine: pbe,
    businessHealthRanking: bhr,
    sharedCustomerIntelligence: null,
    sharedSupplierIntelligence: ssi,
  });
  await pfe.initialize();

  const aee = createAcquisitionEvaluationEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    portfolioRiskEngine: pre,
    businessHealthRanking: bhr,
    sharedSupplierIntelligence: ssi,
    portfolioForecastEngine: pfe,
  });
  await aee.initialize();

  const engine = createPortfolioOptimizationEngine(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      portfolioPerformanceEngine: ppe,
      capitalDistributionEngine: cde,
      portfolioRiskEngine: pre,
      portfolioBalanceEngine: pbe,
      businessHealthRanking: bhr,
      sharedCustomerIntelligence: null,
      sharedSupplierIntelligence: ssi,
      portfolioForecastEngine: pfe,
      acquisitionEvaluationEngine: aee,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-16 Portfolio Optimization Engine", () => {
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
    resetCrossCompanyResourceEngineForTesting();
    resetSupplierFrameworkForTesting();
    resetSharedSupplierIntelligenceForTesting();
    resetPortfolioForecastEngineForTesting();
    resetAcquisitionEvaluationEngineForTesting();
    resetPortfolioOptimizationEngineForTesting();
  });

  test("buildPortfolioOptimizationEngineConfiguration locks approval safety flags", () => {
    const config = buildPortfolioOptimizationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(
      config.neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(POE_CAPABILITIES.includes("enterprise_performance_optimization"));
    assert.ok(POE_CAPABILITIES.includes("optimization_recommendations"));
  });

  test("portfolio optimization engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-POE-001");
    assert.equal(state.missionId, "X2-16");
    assert.ok(PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH.includes("PORTFOLIO_OPTIMIZATION"));
  });

  test("connectPortfolioOptimizationEngine registers with EPF via X2-16", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioOptimizationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_OPTIMIZATION_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.acquisitionEvaluationEngine, true);
  });

  test("performance capital resource produce machine-readable poe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioOptimizationEngine();

    const performance = engine.optimizeEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      expectedBenefitHint: 48,
      validated: true,
    });
    assert.notEqual(
      performance.validation.decision,
      "fail",
      performance.validation.errors.join("; "),
    );
    assert.ok(performance.optimizationRunReportId.startsWith("poe-run-"));
    const record = performance.optimizationRecords[0]!;
    assert.ok(record.portfolioOptimizationId.startsWith("poe-opt-"));
    assert.equal(record.metadataVersion, "POE-001-v1");
    assert.equal(record.autoExecutionBlocked, true);
    assert.equal(record.optimizationCategory, "performance");

    const capital = engine.optimizeCapitalAllocation({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(capital.validation.decision, "fail");
    assert.equal(capital.optimizationRecords[0]!.optimizationCategory, "capital");

    const resources = engine.optimizeResourceUtilization({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(resources.validation.decision, "fail");
    assert.equal(resources.optimizationRecords[0]!.optimizationCategory, "resource");
  });

  test("priorities operational balance detect rank and recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioOptimizationEngine();

    assert.notEqual(
      engine.optimizeCompanyPriorities({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.optimizeOperationalEfficiency({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.optimizePortfolioBalance({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );

    const detected = engine.detectOpportunities({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(detected.validation.decision, "fail");
    assert.ok(detected.optimizationRecords.length >= 3);

    const ranked = engine.rankPriorities({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.optimizationRecords.some((r) => r.rankedPosition === 1));

    const recommended = engine.generateRecommendations({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(recommended.validation.decision, "fail");
    assert.ok(recommended.recommendations.length >= 1);
    assert.ok(recommended.recommendations.every((r) => r.autoExecutionBlocked === true));
  });

  test("rejects unvalidated optimization analysis", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioOptimizationEngine();
    const report = engine.optimizeEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendPoeLog({
      event: "optimization_analysis",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectPortfolioOptimizationEngine();
    const logs = getPoeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables approval or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveEnterpriseInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(
      config.neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report optimization health", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioOptimizationEngine();
    engine.optimizeEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      expectedBenefitHint: 55,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalOptimizationRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report optimization status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioOptimizationEngine();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
