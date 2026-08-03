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
  buildLaunchMonitoringEngineConfiguration,
  LAUNCH_MONITORING_ENGINE_SYSTEM_PATH,
  LME_CAPABILITIES,
  LAUNCH_MONITORING_ENGINE_ID,
} from "../../launch-monitoring-engine/index.js";
import { appendLmeLog, getLmeLogs } from "../../launch-monitoring-engine/lme-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildLaunchMonitoringEngineConfiguration>[1],
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

  const engine = createLaunchMonitoringEngine(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessLaunchOrchestrator: blo,
      growthInitializationEngine: gie,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff };
}

describe("X1-13 Launch Monitoring Engine", () => {
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
  });

  test("buildLaunchMonitoringEngineConfiguration loads defaults", () => {
    const config = buildLaunchMonitoringEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionOperationsWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.monitoringFrequencySeconds >= 1);
    assert.ok(config.alertThreshold >= 0);
    assert.ok(LME_CAPABILITIES.includes("launch_business_monitoring"));
  });

  test("launch monitoring engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-LME-001");
    assert.equal(state.missionId, "X1-13");
    assert.ok(LAUNCH_MONITORING_ENGINE_SYSTEM_PATH.includes("LAUNCH_MONITORING"));
  });

  test("connectLaunchMonitoringEngine registers with Company Factory Framework via X1-13", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectLaunchMonitoringEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === LAUNCH_MONITORING_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessLaunchOrchestrator, true);
    assert.equal(report.engineRecord.dependencyPresence.growthInitializationEngine, true);
  });

  test("monitorLaunch produces machine-readable lme-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchMonitoringEngine();
    const report = engine.monitorLaunch({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.launchMonitoringRunReportId.startsWith("lme-run-"));
    const record = report.monitoringRecords[0]!;
    assert.ok(record.launchMonitoringId.startsWith("lme-mon-"));
    assert.equal(record.metadataVersion, "LME-001-v1");
    assert.equal(record.fabricatedMonitoringFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.modifiedProductionOperationsWithoutValidation, false);
    assert.ok(record.companyReference.length > 0);
    assert.ok(record.launchReference.length > 0);
    assert.ok(record.salesSummary.length > 0);
    assert.ok(record.customerActivitySummary.length > 0);
    assert.ok(record.operationalHealthScore >= 0);
  });

  test("monitoring lifecycle operational sales customers anomalies recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchMonitoringEngine();
    engine.monitorLaunch({ industry: "consumer-goods", validated: true });

    engine.monitorOperationalHealth();
    engine.monitorCustomerActivity();
    engine.monitorSalesPerformance();
    engine.monitorOrderActivity();
    engine.monitorSystemStability();
    engine.detectLaunchAnomalies();
    engine.detectOperationalFailures();

    const report = engine.generateLaunchHealthRecommendations();
    assert.equal(report.action, "generate_launch_health_recommendations");
    assert.ok(report.monitoringRecords[0]!.healthRecommendations.length > 0);
  });

  test("rejects unvalidated launch monitoring", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchMonitoringEngine();
    const report = engine.monitorLaunch({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendLmeLog({
      event: "launch_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectLaunchMonitoringEngine();
    const logs = getLmeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, production-without-validation, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionOperationsWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionOperationsWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report monitoring health", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchMonitoringEngine();
    engine.monitorLaunch({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalMonitoringRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
