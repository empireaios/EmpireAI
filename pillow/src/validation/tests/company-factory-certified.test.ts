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
} from "../../first-revenue-optimizer/index.js";
import {
  createCompanyFactoryCertified,
  resetCompanyFactoryCertifiedForTesting,
  buildCompanyFactoryCertifiedConfiguration,
  COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH,
  CFC_CAPABILITIES,
  COMPANY_FACTORY_CERTIFIED_ID,
  CERTIFIED_MODULE_IDS,
} from "../../company-factory-certified/index.js";
import { appendCfcLog, getCfcLogs } from "../../company-factory-certified/cfc-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCompanyFactoryCertifiedConfiguration>[1],
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

  const fro = createFirstRevenueOptimizer(bootstrap, {
    companyFactoryFramework: cff,
    productPortfolioBuilder: ppb,
    pricingStrategyEngine: pse,
    growthInitializationEngine: gie,
    launchMonitoringEngine: lme,
  });
  await fro.initialize();
  fro.connectFirstRevenueOptimizer();
  fro.optimizeFirstRevenue({ industry: "digital-services", validated: true });

  const engine = createCompanyFactoryCertified(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessOpportunityDiscovery: bod,
      marketValidationEngine: mve,
      businessModelGenerator: bmg,
      brandCreationEngine: bce,
      domainDigitalAssetPlanner: dap,
      storeGenerationEngine: sge,
      productPortfolioBuilder: ppb,
      pricingStrategyEngine: pse,
      launchReadinessValidator: lrv,
      businessLaunchOrchestrator: blo,
      growthInitializationEngine: gie,
      launchMonitoringEngine: lme,
      firstRevenueOptimizer: fro,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff };
}

describe("X1-15 Company Factory Certified", () => {
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
    resetCompanyFactoryCertifiedForTesting();
  });

  test("buildCompanyFactoryCertifiedConfiguration loads defaults", () => {
    const config = buildCompanyFactoryCertifiedConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionSystemsUnlessSafeTestMode, true);
    assert.equal(config.safeTestMode, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.passThresholdPercent >= 1);
    assert.equal(CERTIFIED_MODULE_IDS.length, 14);
    assert.ok(CFC_CAPABILITIES.includes("company_factory_validation"));
  });

  test("company factory certified initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CFC-001");
    assert.equal(state.missionId, "X1-15");
    assert.ok(COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH.includes("COMPANY_FACTORY_CERTIFIED"));
  });

  test("connectCompanyFactoryCertified registers with Company Factory Framework via X1-15", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectCompanyFactoryCertified();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === COMPANY_FACTORY_CERTIFIED_ID));
    assert.equal(report.engineRecord.dependencyPresence["company-factory-framework"], true);
    assert.equal(report.engineRecord.dependencyPresence["first-revenue-optimizer"], true);
  });

  test("certifyCompanyFactory produces machine-readable cfc-* certification reports", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyFactoryCertified();
    const report = engine.certifyCompanyFactory({
      industry: "digital-services",
      validated: true,
      runEndToEnd: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.certificationRunReportId.startsWith("cfc-run-"));
    const record = report.certificationReports[0]!;
    assert.ok(record.certificationId.startsWith("cfc-crt-"));
    assert.equal(record.metadataVersion, "CFC-001-v1");
    assert.equal(record.fabricatedCertificationFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.modifiedProductionSystemsWithoutSafeTestMode, false);
    assert.equal(record.perModulePassFailStatus.length, 14);
    assert.equal(record.endToEndValidationResult, "pass");
    assert.equal(record.overallCertificationStatus, "certified");
    assert.ok(record.certifiedCompanyFactoryModules.length > 0);
  });

  test("certification lifecycle module validators e2e report", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyFactoryCertified();
    engine.certifyCompanyFactory({ industry: "consumer-goods", validated: true });

    engine.validateCompanyFramework();
    engine.validateOpportunityDiscovery();
    engine.validateMarketValidation();
    engine.validateBusinessModel();
    engine.validateBrand();
    engine.validateStore();
    engine.validateProductPortfolio();
    engine.validateLaunch();
    engine.runEndToEndCompanyCreation();

    const report = engine.generateCertificationReport();
    assert.equal(report.action, "generate_certification_report");
    assert.ok(report.certificationReports[0]!.evidenceReferences.length > 0);
  });

  test("rejects unvalidated company factory certification", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyFactoryCertified();
    const report = engine.certifyCompanyFactory({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCfcLog({
      event: "certification_start",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectCompanyFactoryCertified();
    const logs = getCfcLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, production, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionSystemsUnlessSafeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      safeTestMode: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverModifyProductionSystemsUnlessSafeTestMode, true);
    assert.equal(config.safeTestMode, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report certification health", async () => {
    const { engine } = await buildEngine();
    engine.connectCompanyFactoryCertified();
    engine.certifyCompanyFactory({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalCertificationReports >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
