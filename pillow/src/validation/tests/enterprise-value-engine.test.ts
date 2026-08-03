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
  buildEnterpriseValueEngineConfiguration,
  ENTERPRISE_VALUE_ENGINE_SYSTEM_PATH,
  EVE_CAPABILITIES,
  ENTERPRISE_VALUE_ENGINE_ID,
} from "../../enterprise-value-engine/index.js";
import { appendEveLog, getEveLogs } from "../../enterprise-value-engine/eve-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildEnterpriseValueEngineConfiguration>[1],
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

  const engine = createEnterpriseValueEngine(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      portfolioPerformanceEngine: ppe,
      capitalDistributionEngine: cde,
      executivePortfolioDashboard: epd,
      businessHealthRanking: bhr,
      portfolioForecastEngine: pfe,
      acquisitionEvaluationEngine: aee,
      portfolioOptimizationEngine: poe,
      portfolioExpansionPlanner: pep,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-19 Enterprise Value Engine", () => {
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
  });

  test("buildEnterpriseValueEngineConfiguration locks valuation safety flags", () => {
    const config = buildEnterpriseValueEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.neverLogSensitiveFinancialInformation, true);
    assert.ok(EVE_CAPABILITIES.includes("enterprise_value_calculation"));
    assert.ok(EVE_CAPABILITIES.includes("valuation_recommendations"));
  });

  test("enterprise value engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EVE-001");
    assert.equal(state.missionId, "X2-19");
    assert.ok(ENTERPRISE_VALUE_ENGINE_SYSTEM_PATH.includes("ENTERPRISE_VALUE"));
  });

  test("connectEnterpriseValueEngine registers with EPF via X2-19", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectEnterpriseValueEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.portfolioModuleIdentifier === ENTERPRISE_VALUE_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioExpansionPlanner, true);
  });

  test("enterprise company and portfolio valuations produce machine-readable eve-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectEnterpriseValueEngine();

    const enterprise = engine.calculateEnterpriseValue({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(
      enterprise.validation.decision,
      "fail",
      enterprise.validation.errors.join("; "),
    );
    assert.ok(enterprise.valuationRunReportId.startsWith("eve-run-"));
    const record = enterprise.valuationRecords[0]!;
    assert.ok(record.enterpriseValueId.startsWith("eve-val-"));
    assert.equal(record.metadataVersion, "EVE-001-v1");
    assert.equal(record.notGuaranteedMarketPrice, true);
    assert.ok(record.enterpriseValuation > 0);

    const company = engine.calculateCompanyValuation({
      portfolioReference: "portfolio-enterprise",
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(company.validation.decision, "fail");
    assert.equal(company.valuationRecords[0]!.companyReference, "company-alpha");
    assert.ok(company.valuationRecords[0]!.companyValuation > 0);

    const portfolio = engine.calculatePortfolioValuation({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(portfolio.validation.decision, "fail");
    assert.ok(portfolio.valuationRecords[0]!.portfolioValuation > 0);
  });

  test("intrinsic market growth history anomalies and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectEnterpriseValueEngine();
    engine.calculateEnterpriseValue({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });

    assert.notEqual(
      engine.estimateIntrinsic({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.estimateMarket({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.measureValueGrowth({
        portfolioReference: "portfolio-enterprise",
        validated: true,
      }).validation.decision,
      "fail",
    );

    const history = engine.trackHistory({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(history.validation.decision, "fail");
    assert.ok(history.historyEntries.length >= 1);
    assert.ok(history.historyEntries[0]!.historyId.startsWith("eve-hist-"));
    assert.ok(engine.getHistory().length >= 1);

    assert.notEqual(
      engine.detectAnomalies({
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
    assert.ok(
      recommended.recommendations.every((r) => r.notGuaranteedMarketPrice === true),
    );
  });

  test("rejects unvalidated enterprise valuation", async () => {
    const { engine } = await buildEngine();
    engine.connectEnterpriseValueEngine();
    const report = engine.calculateEnterpriseValue({
      portfolioReference: "portfolio-enterprise",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive financial values in logs", async () => {
    const { engine } = await buildEngine();
    appendEveLog({
      event: "enterprise_valuation",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectEnterpriseValueEngine();
    const logs = getEveLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables market-price or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverRepresentEstimatedValuesAsGuaranteedMarketPrices: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeAuthenticationTokens: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveFinancialInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverRepresentEstimatedValuesAsGuaranteedMarketPrices, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.neverLogSensitiveFinancialInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report valuation health", async () => {
    const { engine } = await buildEngine();
    engine.connectEnterpriseValueEngine();
    engine.calculateEnterpriseValue({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalValuationRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report valuation status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectEnterpriseValueEngine();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
