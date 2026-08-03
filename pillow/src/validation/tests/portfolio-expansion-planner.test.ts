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
} from "../../portfolio-optimization-engine/index.js";
import {
  createCompanyLifecycleManager,
  resetCompanyLifecycleManagerForTesting,
} from "../../company-lifecycle-manager/index.js";
import {
  createPortfolioExpansionPlanner,
  resetPortfolioExpansionPlannerForTesting,
  buildPortfolioExpansionPlannerConfiguration,
  PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH,
  PEP_CAPABILITIES,
  PORTFOLIO_EXPANSION_PLANNER_ID,
} from "../../portfolio-expansion-planner/index.js";
import { appendPepLog, getPepLogs } from "../../portfolio-expansion-planner/pep-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPortfolioExpansionPlannerConfiguration>[1],
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

  const poe = createPortfolioOptimizationEngine(bootstrap, {
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
  });
  await poe.initialize();

  const clm = createCompanyLifecycleManager(bootstrap, {
    enterprisePortfolioFramework: epf,
    multiCompanyRegistry: mcr,
    portfolioPerformanceEngine: ppe,
    businessHealthRanking: bhr,
    portfolioForecastEngine: pfe,
    portfolioOptimizationEngine: poe,
  });
  await clm.initialize();

  const engine = createPortfolioExpansionPlanner(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      portfolioPerformanceEngine: ppe,
      capitalDistributionEngine: cde,
      portfolioRiskEngine: pre,
      businessHealthRanking: bhr,
      acquisitionEvaluationEngine: aee,
      portfolioOptimizationEngine: poe,
      companyLifecycleManager: clm,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-18 Portfolio Expansion Planner", () => {
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
    resetCompanyLifecycleManagerForTesting();
    resetPortfolioExpansionPlannerForTesting();
  });

  test("buildPortfolioExpansionPlannerConfiguration locks initiation safety flags", () => {
    const config = buildPortfolioExpansionPlannerConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(
      config.neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(PEP_CAPABILITIES.includes("expansion_opportunity_detection"));
    assert.ok(PEP_CAPABILITIES.includes("expansion_recommendations"));
  });

  test("portfolio expansion planner initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PEP-001");
    assert.equal(state.missionId, "X2-18");
    assert.ok(PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH.includes("PORTFOLIO_EXPANSION"));
  });

  test("connectPortfolioExpansionPlanner registers with EPF via X2-18", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioExpansionPlanner();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_EXPANSION_PLANNER_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.acquisitionEvaluationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.companyLifecycleManager, true);
  });

  test("identify and evaluate markets produce machine-readable pep-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioExpansionPlanner();

    const identified = engine.identifyOpportunities({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(
      identified.validation.decision,
      "fail",
      identified.validation.errors.join("; "),
    );
    assert.ok(identified.expansionRunReportId.startsWith("pep-run-"));
    const record = identified.expansionRecords[0]!;
    assert.ok(record.expansionPlanId.startsWith("pep-exp-"));
    assert.equal(record.metadataVersion, "PEP-001-v1");
    assert.equal(record.autoInitiationBlocked, true);

    const markets = engine.evaluateMarkets({
      portfolioReference: "portfolio-enterprise",
      investmentHint: 40,
      returnHint: 55,
      validated: true,
    });
    assert.notEqual(markets.validation.decision, "fail");
    assert.equal(markets.expansionRecords[0]!.expansionCategory, "market");
  });

  test("industries internal acquisition prioritize cost return and recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioExpansionPlanner();
    engine.identifyOpportunities({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });

    assert.notEqual(
      engine.evaluateIndustries({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.evaluateInternal({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.evaluateAcquisition({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );

    const prioritized = engine.prioritizeExpansions({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(prioritized.validation.decision, "fail");
    assert.ok(prioritized.expansionRecords.some((r) => r.rankedPosition === 1));

    assert.notEqual(
      engine.estimateCosts({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.estimateReturns({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );

    const recommended = engine.generateRecommendations({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(recommended.validation.decision, "fail");
    assert.ok(recommended.recommendations.length >= 1);
    assert.ok(recommended.recommendations.every((r) => r.autoInitiationBlocked === true));
  });

  test("rejects unvalidated expansion opportunity identification", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioExpansionPlanner();
    const report = engine.identifyOpportunities({
      portfolioReference: "portfolio-enterprise",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendPepLog({
      event: "expansion_opportunity_discovery",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectPortfolioExpansionPlanner();
    const logs = getPepLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables initiation or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveEnterpriseInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(
      config.neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report expansion health", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioExpansionPlanner();
    engine.identifyOpportunities({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalExpansionRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report expansion status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioExpansionPlanner();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
