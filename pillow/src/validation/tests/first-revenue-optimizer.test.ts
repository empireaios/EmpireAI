import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCompanyFactoryFrameworkEngine,
  resetCompanyFactoryFrameworkForTesting,
} from "../../company-factory-framework/index.js";
import {
  createBusinessOpportunityDiscovery,
  resetBusinessOpportunityDiscoveryForTesting,
} from "../../business-opportunity-discovery/index.js";
import {
  createMarketValidationEngine,
  resetMarketValidationEngineForTesting,
} from "../../market-validation-engine/index.js";
import {
  createBusinessModelGenerator,
  resetBusinessModelGeneratorForTesting,
} from "../../business-model-generator/index.js";
import {
  createBrandCreationEngine,
  resetBrandCreationEngineForTesting,
} from "../../brand-creation-engine/index.js";
import {
  createDomainDigitalAssetPlanner,
  resetDomainDigitalAssetPlannerForTesting,
} from "../../domain-digital-asset-planner/index.js";
import {
  createStoreGenerationEngine,
  resetStoreGenerationEngineForTesting,
} from "../../store-generation-engine/index.js";
import {
  createProductPortfolioBuilder,
  resetProductPortfolioBuilderForTesting,
} from "../../product-portfolio-builder/index.js";
import {
  createPricingStrategyEngine,
  resetPricingStrategyEngineForTesting,
} from "../../pricing-strategy-engine/index.js";
import {
  createLaunchReadinessValidator,
  resetLaunchReadinessValidatorForTesting,
} from "../../launch-readiness-validator/index.js";
import {
  createBusinessLaunchOrchestrator,
  resetBusinessLaunchOrchestratorForTesting,
} from "../../business-launch-orchestrator/index.js";
import {
  createGrowthInitializationEngine,
  resetGrowthInitializationEngineForTesting,
} from "../../growth-initialization-engine/index.js";
import {
  createLaunchMonitoringEngine,
  resetLaunchMonitoringEngineForTesting,
} from "../../launch-monitoring-engine/index.js";
import {
  createFirstRevenueOptimizer,
  resetFirstRevenueOptimizerForTesting,
  buildFirstRevenueOptimizerConfiguration,
  FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH,
  FRO_CAPABILITIES,
  FIRST_REVENUE_OPTIMIZER_ID,
} from "../../first-revenue-optimizer/index.js";
import { appendFroLog, getFroLogs } from "../../first-revenue-optimizer/fro-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildFirstRevenueOptimizerConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const cff = createCompanyFactoryFrameworkEngine(bootstrap);
  await cff.initialize();

  const bod = createBusinessOpportunityDiscovery(bootstrap, {
    companyFactoryFramework: cff,
  });
  await bod.initialize();
  bod.connectBusinessOpportunityDiscovery();
  bod.discoverOpportunities({ industry: "digital-services", validated: true });

  const mve = createMarketValidationEngine(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
  });
  await mve.initialize();
  mve.connectMarketValidationEngine();
  mve.validateOpportunity({ industry: "digital-services", validated: true });

  const bmg = createBusinessModelGenerator(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
    marketValidationEngine: mve,
  });
  await bmg.initialize();
  bmg.connectBusinessModelGenerator();
  bmg.generateBusinessModel({ industry: "digital-services", validated: true });

  const bce = createBrandCreationEngine(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
    marketValidationEngine: mve,
    businessModelGenerator: bmg,
  });
  await bce.initialize();
  bce.connectBrandCreationEngine();
  bce.createBrand({ industry: "digital-services", validated: true });

  const dap = createDomainDigitalAssetPlanner(bootstrap, {
    companyFactoryFramework: cff,
    businessModelGenerator: bmg,
    brandCreationEngine: bce,
  });
  await dap.initialize();
  dap.connectDomainDigitalAssetPlanner();
  dap.createPlan({ industry: "digital-services", validated: true });

  const sge = createStoreGenerationEngine(bootstrap, {
    companyFactoryFramework: cff,
    businessModelGenerator: bmg,
    brandCreationEngine: bce,
    domainDigitalAssetPlanner: dap,
  });
  await sge.initialize();
  sge.connectStoreGenerationEngine();
  sge.generateStorefront({ industry: "digital-services", validated: true });

  const ppb = createProductPortfolioBuilder(bootstrap, {
    companyFactoryFramework: cff,
    businessOpportunityDiscovery: bod,
    marketValidationEngine: mve,
    businessModelGenerator: bmg,
    storeGenerationEngine: sge,
  });
  await ppb.initialize();
  ppb.connectProductPortfolioBuilder();
  ppb.buildPortfolio({ industry: "digital-services", validated: true });

  const pse = createPricingStrategyEngine(bootstrap, {
    companyFactoryFramework: cff,
    marketValidationEngine: mve,
    businessModelGenerator: bmg,
    productPortfolioBuilder: ppb,
  });
  await pse.initialize();
  pse.connectPricingStrategyEngine();
  pse.generatePricingStrategy({ industry: "digital-services", validated: true });

  const lrv = createLaunchReadinessValidator(bootstrap, {
    companyFactoryFramework: cff,
    businessModelGenerator: bmg,
    brandCreationEngine: bce,
    domainDigitalAssetPlanner: dap,
    storeGenerationEngine: sge,
    productPortfolioBuilder: ppb,
    pricingStrategyEngine: pse,
  });
  await lrv.initialize();
  lrv.connectLaunchReadinessValidator();
  lrv.validateLaunchReadiness({ industry: "digital-services", validated: true });

  const blo = createBusinessLaunchOrchestrator(bootstrap, {
    companyFactoryFramework: cff,
    brandCreationEngine: bce,
    domainDigitalAssetPlanner: dap,
    storeGenerationEngine: sge,
    pricingStrategyEngine: pse,
    launchReadinessValidator: lrv,
  });
  await blo.initialize();
  blo.connectBusinessLaunchOrchestrator();
  blo.orchestrateLaunch({ industry: "digital-services", validated: true });

  const gie = createGrowthInitializationEngine(bootstrap, {
    companyFactoryFramework: cff,
    productPortfolioBuilder: ppb,
    pricingStrategyEngine: pse,
    businessLaunchOrchestrator: blo,
  });
  await gie.initialize();
  gie.connectGrowthInitializationEngine();
  gie.initializeGrowthPlan({ industry: "digital-services", validated: true });

  const lme = createLaunchMonitoringEngine(bootstrap, {
    companyFactoryFramework: cff,
    businessLaunchOrchestrator: blo,
    growthInitializationEngine: gie,
  });
  await lme.initialize();
  lme.connectLaunchMonitoringEngine();
  lme.monitorLaunch({ industry: "digital-services", validated: true });

  const engine = createFirstRevenueOptimizer(
    bootstrap,
    {
      companyFactoryFramework: cff,
      productPortfolioBuilder: ppb,
      pricingStrategyEngine: pse,
      growthInitializationEngine: gie,
      launchMonitoringEngine: lme,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff };
}

describe("X1-14 First Revenue Optimizer", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
    resetBusinessModelGeneratorForTesting();
    resetBrandCreationEngineForTesting();
    resetDomainDigitalAssetPlannerForTesting();
    resetStoreGenerationEngineForTesting();
    resetProductPortfolioBuilderForTesting();
    resetPricingStrategyEngineForTesting();
    resetLaunchReadinessValidatorForTesting();
    resetBusinessLaunchOrchestratorForTesting();
    resetGrowthInitializationEngineForTesting();
    resetLaunchMonitoringEngineForTesting();
    resetFirstRevenueOptimizerForTesting();
  });

  test("buildFirstRevenueOptimizerConfiguration loads defaults", () => {
    const config = buildFirstRevenueOptimizerConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionPricingWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.maxOptimizationsPerCycle >= 1);
    assert.ok(FRO_CAPABILITIES.includes("first_sales_monitoring"));
  });

  test("first revenue optimizer initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FRO-001");
    assert.equal(state.missionId, "X1-14");
    assert.ok(FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH.includes("FIRST_REVENUE"));
  });

  test("connectFirstRevenueOptimizer registers with Company Factory Framework via X1-14", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectFirstRevenueOptimizer();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === FIRST_REVENUE_OPTIMIZER_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.productPortfolioBuilder, true);
    assert.equal(report.engineRecord.dependencyPresence.pricingStrategyEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.growthInitializationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.launchMonitoringEngine, true);
  });

  test("optimizeFirstRevenue produces machine-readable fro-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectFirstRevenueOptimizer();
    const report = engine.optimizeFirstRevenue({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.revenueRunReportId.startsWith("fro-run-"));
    const record = report.revenueRecords[0]!;
    assert.ok(record.revenueOptimizationId.startsWith("fro-rev-"));
    assert.equal(record.metadataVersion, "FRO-001-v1");
    assert.equal(record.fabricatedRevenueFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.modifiedProductionPricingWithoutValidation, false);
    assert.ok(record.companyReference.length > 0);
    assert.ok(record.productReference.length > 0);
    assert.ok(record.revenueSummary.length > 0);
    assert.ok(record.optimizationRecommendation.length > 0);
    assert.ok(record.expectedRevenueImprovement.length > 0);
    assert.ok(record.productPerformanceScore >= 0);
  });

  test("revenue lifecycle sales analyze products bottlenecks optimize recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectFirstRevenueOptimizer();
    engine.optimizeFirstRevenue({ industry: "consumer-goods", validated: true });

    engine.monitorFirstSales();
    engine.analyzeEarlyRevenue();
    engine.analyzeProductPerformance();
    engine.analyzeCustomerPurchasing();
    engine.detectRevenueBottlenecks();
    engine.detectUnderperformingProducts();
    engine.optimizeProductPriorities();
    engine.optimizePricingRecommendations();

    const report = engine.generateEarlyRevenueRecommendations();
    assert.equal(report.action, "generate_early_revenue_recommendations");
    assert.ok(report.revenueRecords[0]!.optimizationRecommendation.length > 0);
  });

  test("rejects unvalidated first revenue optimization", async () => {
    const { engine } = await buildEngine();
    engine.connectFirstRevenueOptimizer();
    const report = engine.optimizeFirstRevenue({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendFroLog({
      event: "revenue_analysis",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectFirstRevenueOptimizer();
    const logs = getFroLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, pricing-without-validation, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionPricingWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionPricingWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report optimization health", async () => {
    const { engine } = await buildEngine();
    engine.connectFirstRevenueOptimizer();
    engine.optimizeFirstRevenue({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalRevenueRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
