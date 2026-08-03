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
  createSharedCustomerIntelligence,
  resetSharedCustomerIntelligenceForTesting,
} from "../../shared-customer-intelligence/index.js";
import {
  createSharedSupplierIntelligence,
  resetSharedSupplierIntelligenceForTesting,
} from "../../shared-supplier-intelligence/index.js";
import {
  createCrossBusinessKnowledgeEngine,
  resetCrossBusinessKnowledgeEngineForTesting,
} from "../../cross-business-knowledge-engine/index.js";
import {
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
} from "../../cross-company-resource-engine/index.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createPortfolioForecastEngine,
  resetPortfolioForecastEngineForTesting,
  buildPortfolioForecastEngineConfiguration,
  PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH,
  PFE_CAPABILITIES,
  PORTFOLIO_FORECAST_ENGINE_ID,
} from "../../portfolio-forecast-engine/index.js";
import { appendPfeLog, getPfeLogs } from "../../portfolio-forecast-engine/pfe-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPortfolioForecastEngineConfiguration>[1],
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

  const cie = createCustomerIdentityEngine(bootstrap);
  await cie.initialize();
  cie.connectCustomerIdentityEngine();

  const sci = createSharedCustomerIntelligence(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      crossBusinessKnowledgeEngine: cbk,
      crossCompanyResourceEngine: ccre,
      customerIdentityEngine: cie,
      customerOperationsCertification: null,
    },
  );
  await sci.initialize();

  const supplierFramework = createSupplierFrameworkEngine(bootstrap);
  await supplierFramework.initialize();

  const ssi = createSharedSupplierIntelligence(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      crossBusinessKnowledgeEngine: cbk,
      crossCompanyResourceEngine: ccre,
      supplierFramework,
      supplierOperationsCertification: null,
    },
  );
  await ssi.initialize();

  const engine = createPortfolioForecastEngine(
    bootstrap,
    {
      enterprisePortfolioFramework: epf,
      multiCompanyRegistry: mcr,
      portfolioPerformanceEngine: ppe,
      capitalDistributionEngine: cde,
      executivePortfolioDashboard: epd,
      portfolioRiskEngine: pre,
      portfolioBalanceEngine: pbe,
      businessHealthRanking: bhr,
      sharedCustomerIntelligence: sci,
      sharedSupplierIntelligence: ssi,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, epf };
}

describe("X2-14 Portfolio Forecast Engine", () => {
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
    resetCustomerIdentityEngineForTesting();
    resetSharedCustomerIntelligenceForTesting();
    resetSupplierFrameworkForTesting();
    resetSharedSupplierIntelligenceForTesting();
    resetPortfolioForecastEngineForTesting();
  });

  test("buildPortfolioForecastEngineConfiguration locks forecast safety flags", () => {
    const config = buildPortfolioForecastEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverPresentForecastsAsGuaranteedOutcomes, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(PFE_CAPABILITIES.includes("portfolio_revenue_forecasting"));
    assert.ok(PFE_CAPABILITIES.includes("executive_forecast_generation"));
  });

  test("portfolio forecast engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PFE-001");
    assert.equal(state.missionId, "X2-14");
    assert.ok(PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH.includes("PORTFOLIO_FORECAST_ENGINE"));
  });

  test("connectPortfolioForecastEngine registers with EPF via X2-14", async () => {
    const { engine, epf } = await buildEngine();
    const report = engine.connectPortfolioForecastEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = epf.getRegisteredModules();
    assert.ok(modules.some((m) => m.portfolioModuleIdentifier === PORTFOLIO_FORECAST_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.enterprisePortfolioFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.portfolioPerformanceEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.sharedSupplierIntelligence, true);
  });

  test("revenue profit growth produce machine-readable pfe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioForecastEngine();

    const revenue = engine.forecastRevenue({
      portfolioReference: "portfolio-enterprise",
      forecastPeriod: "90d",
      baselineRevenue: 100000,
      validated: true,
    });
    assert.notEqual(revenue.validation.decision, "fail", revenue.validation.errors.join("; "));
    assert.ok(revenue.forecastRunReportId.startsWith("pfe-run-"));
    const record = revenue.forecastRecords[0]!;
    assert.ok(record.forecastId.startsWith("pfe-fc-"));
    assert.equal(record.metadataVersion, "PFE-001-v1");
    assert.equal(record.notGuaranteedOutcome, true);
    assert.ok(record.revenueForecast > 0);

    const profit = engine.forecastProfit({
      portfolioReference: "portfolio-enterprise",
      baselineRevenue: 100000,
      validated: true,
    });
    assert.notEqual(profit.validation.decision, "fail");
    assert.ok(profit.forecastRecords[0]!.profitForecast > 0);

    const growth = engine.forecastGrowth({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(growth.validation.decision, "fail");
    assert.ok(growth.forecastRecords[0]!.growthForecast >= 0);
  });

  test("capital customer supplier risk scenarios and executive forecasts", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioForecastEngine();
    engine.forecastRevenue({
      portfolioReference: "portfolio-enterprise",
      baselineRevenue: 120000,
      validated: true,
    });

    const capital = engine.forecastCapital({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(capital.validation.decision, "fail");
    assert.ok(capital.forecastRecords[0]!.capitalRequirementForecast >= 0);

    const customers = engine.forecastCustomerGrowth({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(customers.validation.decision, "fail");

    const suppliers = engine.forecastSupplierCapacity({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(suppliers.validation.decision, "fail");

    const risks = engine.forecastRisks({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(risks.validation.decision, "fail");
    assert.ok(risks.forecastRecords[0]!.riskForecast >= 0);

    const scenarios = engine.generateScenarios({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(scenarios.validation.decision, "fail", scenarios.validation.errors.join("; "));
    assert.ok(scenarios.scenarios.length >= 3);
    assert.ok(scenarios.scenarios.every((s) => s.notGuaranteedOutcome === true));

    const executive = engine.generateExecutiveForecast({
      portfolioReference: "portfolio-enterprise",
      validated: true,
    });
    assert.notEqual(executive.validation.decision, "fail");
    assert.ok(executive.forecastRecords.length >= 1);
    assert.equal(executive.forecastRecords[0]!.notGuaranteedOutcome, true);
  });

  test("rejects unvalidated forecast generation", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioForecastEngine();
    const report = engine.forecastRevenue({
      portfolioReference: "portfolio-enterprise",
      validated: false,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive enterprise values in logs", async () => {
    const { engine } = await buildEngine();
    appendPfeLog({
      event: "forecast_generation",
      level: "info",
      details: "api_key=secret-key token=bearer-abc",
    });
    engine.connectPortfolioForecastEngine();
    const logs = getPfeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
    assert.ok(!logs.some((l) => l.details.includes("bearer-abc")));
  });

  test("never disables guaranteed-outcome or credential guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverPresentForecastsAsGuaranteedOutcomes: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLogSensitiveEnterpriseInformation: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverPresentForecastsAsGuaranteedOutcomes, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report forecast health", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioForecastEngine();
    engine.forecastRevenue({
      portfolioReference: "portfolio-enterprise",
      baselineRevenue: 80000,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalForecastRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });

  test("diagnostics report forecast status and recovery readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPortfolioForecastEngine();
    const report = engine.runDiagnostics({});
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "diagnostics");
    assert.ok(
      ["healthy", "degraded", "standby", "failed"].includes(report.engineRecord.healthStatus),
    );
  });
});
