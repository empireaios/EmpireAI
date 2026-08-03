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
  buildGrowthInitializationEngineConfiguration,
  GROWTH_INITIALIZATION_ENGINE_SYSTEM_PATH,
  GIE_CAPABILITIES,
  GROWTH_INITIALIZATION_ENGINE_ID,
} from "../../growth-initialization-engine/index.js";
import { appendGieLog, getGieLogs } from "../../growth-initialization-engine/gie-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildGrowthInitializationEngineConfiguration>[1],
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

  const engine = createGrowthInitializationEngine(
    bootstrap,
    {
      companyFactoryFramework: cff,
      productPortfolioBuilder: ppb,
      pricingStrategyEngine: pse,
      businessLaunchOrchestrator: blo,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff };
}

describe("X1-12 Growth Initialization Engine", () => {
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
  });

  test("buildGrowthInitializationEngineConfiguration loads defaults", () => {
    const config = buildGrowthInitializationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyOperationalConfigWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.maxPlansPerCycle >= 1);
    assert.ok(GIE_CAPABILITIES.includes("growth_strategy_generation"));
  });

  test("growth initialization engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GIE-001");
    assert.equal(state.missionId, "X1-12");
    assert.ok(GROWTH_INITIALIZATION_ENGINE_SYSTEM_PATH.includes("GROWTH_INITIALIZATION"));
  });

  test("connectGrowthInitializationEngine registers with Company Factory Framework via X1-12", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectGrowthInitializationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === GROWTH_INITIALIZATION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.productPortfolioBuilder, true);
    assert.equal(report.engineRecord.dependencyPresence.pricingStrategyEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.businessLaunchOrchestrator, true);
  });

  test("initializeGrowthPlan produces machine-readable gie-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectGrowthInitializationEngine();
    const report = engine.initializeGrowthPlan({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.growthRunReportId.startsWith("gie-run-"));
    const record = report.growthRecords[0]!;
    assert.ok(record.growthPlanId.startsWith("gie-pln-"));
    assert.equal(record.metadataVersion, "GIE-001-v1");
    assert.equal(record.fabricatedGrowthFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.modifiedOperationalConfigWithoutValidation, false);
    assert.ok(record.companyReference.length > 0);
    assert.ok(record.launchReference.length > 0);
    assert.ok(record.growthObjectives.length > 0);
    assert.ok(record.revenueMilestones.length > 0);
    assert.ok(record.customerAcquisitionPlan.length > 0);
    assert.ok(record.growthScore >= 0);
  });

  test("growth lifecycle strategy sales milestones acquisition track optimize", async () => {
    const { engine } = await buildEngine();
    engine.connectGrowthInitializationEngine();
    engine.initializeGrowthPlan({ industry: "consumer-goods", validated: true });

    engine.generateGrowthStrategy();
    engine.generateLaunchMarketingRecommendations();
    engine.generateSalesTargets();
    engine.generateOperationalPriorities();
    engine.generateRevenueMilestones();
    engine.generateCustomerAcquisitionPlan();
    engine.generatePerformanceBaselines();
    engine.trackEarlyPerformance();

    const report = engine.recommendImmediateOptimizations();
    assert.equal(report.action, "recommend_immediate_optimizations");
    assert.ok(report.growthRecords[0]!.immediateOptimizations.length > 0);
  });

  test("rejects unvalidated growth plan initialization", async () => {
    const { engine } = await buildEngine();
    engine.connectGrowthInitializationEngine();
    const report = engine.initializeGrowthPlan({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendGieLog({
      event: "growth_plan_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectGrowthInitializationEngine();
    const logs = getGieLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, config-without-validation, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyOperationalConfigWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyOperationalConfigWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report growth health", async () => {
    const { engine } = await buildEngine();
    engine.connectGrowthInitializationEngine();
    engine.initializeGrowthPlan({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalGrowthRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
