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
} from "../../portfolio-expansion-planner/index.js";
import {
  createEnterpriseValueEngine,
  resetEnterpriseValueEngineForTesting,
} from "../../enterprise-value-engine/index.js";
import {
  createAutonomousPortfolioBoard,
  resetAutonomousPortfolioBoardForTesting,
  buildAutonomousPortfolioBoardConfiguration,
  AUTONOMOUS_PORTFOLIO_BOARD_SYSTEM_PATH,
  APB_CAPABILITIES,
  AUTONOMOUS_PORTFOLIO_BOARD_ID,
} from "../../autonomous-portfolio-board/index.js";
import { appendApbLog, getApbLogs } from "../../autonomous-portfolio-board/apb-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAutonomousPortfolioBoardConfiguration>[1],
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

  const pep = createPortfolioExpansionPlanner(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    portfolioRiskEngine: pre,
    businessHealthRanking: bhr,
    acquisitionEvaluationEngine: aee,
    portfolioOptimizationEngine: poe,
    companyLifecycleManager: clm,
  });
  await pep.initialize();

  const eve = createEnterpriseValueEngine(bootstrap, {
    enterprisePortfolioFramework: epf,
    portfolioPerformanceEngine: ppe,
    capitalDistributionEngine: cde,
    executivePortfolioDashboard: epd,
    businessHealthRanking: bhr,
    portfolioForecastEngine: pfe,
    acquisitionEvaluationEngine: aee,
    portfolioOptimizationEngine: poe,
    portfolioExpansionPlanner: pep,
  });
  await eve.initialize();

  const engine = createAutonomousPortfolioBoard(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      portfolioPerformanceEngine: ppe,
      capitalDistributionEngine: cde,
      executivePortfolioDashboard: epd,
      portfolioRiskEngine: pre,
      businessHealthRanking: bhr,
      portfolioForecastEngine: pfe,
      acquisitionEvaluationEngine: aee,
      portfolioOptimizationEngine: poe,
      companyLifecycleManager: clm,
      portfolioExpansionPlanner: pep,
      enterpriseValueEngine: eve,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-20 Autonomous Portfolio Board", () => {
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
    resetEnterpriseValueEngineForTesting();
    resetAutonomousPortfolioBoardForTesting();
  });

  test("buildAutonomousPortfolioBoardConfiguration locks executive safety flags", () => {
    const config = buildAutonomousPortfolioBoardConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(
      config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(APB_CAPABILITIES.includes("enterprise_performance_review"));
    assert.ok(APB_CAPABILITIES.includes("executive_recommendations"));
  });

  test("autonomous portfolio board initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-APB-001");
    assert.equal(state.missionId, "X2-20");
    assert.ok(AUTONOMOUS_PORTFOLIO_BOARD_SYSTEM_PATH.includes("AUTONOMOUS_PORTFOLIO"));
  });

  test("connectAutonomousPortfolioBoard registers with EPF via X2-20", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectAutonomousPortfolioBoard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === AUTONOMOUS_PORTFOLIO_BOARD_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.enterpriseValueEngine, true);
  });

  test("executive reviews produce machine-readable apb-* board records", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousPortfolioBoard();

    const performance = engine.reviewEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(
      performance.validation.decision,
      "fail",
      performance.validation.errors.join("; "),
    );
    assert.ok(performance.executiveBoardRunReportId.startsWith("apb-run-"));
    const record = performance.boardRecords[0]!;
    assert.ok(record.executiveBoardId.startsWith("apb-brd-"));
    assert.equal(record.metadataVersion, "APB-001-v1");
    assert.equal(record.autoExecutionBlocked, true);
    assert.ok(record.strategicIssues.length >= 1);

    assert.notEqual(
      engine.reviewPortfolioHealth({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.reviewStrategicOpportunities({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.reviewEnterpriseRisks({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("capital expansion acquisition prioritize and recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousPortfolioBoard();
    engine.reviewEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });

    assert.notEqual(
      engine.reviewCapitalAllocation({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.reviewExpansionOpportunities({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.reviewAcquisitionOpportunities({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );

    const prioritized = engine.prioritizeExecutiveDecisions({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(prioritized.validation.decision, "fail");
    assert.ok(prioritized.boardRecords[0]!.executivePriorities.length >= 1);

    const recommended = engine.generateExecutiveRecommendations({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(recommended.validation.decision, "fail");
    assert.ok(recommended.recommendations.length >= 1);
    assert.ok(recommended.recommendations.every((r) => r.autoExecutionBlocked === true));
  });

  test("rejects unvalidated enterprise performance review", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousPortfolioBoard();
    const report = engine.reviewEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendApbLog({
      event: "executive_review",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectAutonomousPortfolioBoard();
    const logs = getApbLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables auto-execution or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeAuthenticationTokens: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveEnterpriseInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(
      config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies,
      true,
    );
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report board health", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousPortfolioBoard();
    engine.reviewEnterprisePerformance({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalBoardRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report executive board status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousPortfolioBoard();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
