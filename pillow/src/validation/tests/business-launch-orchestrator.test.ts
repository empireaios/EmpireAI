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
  buildBusinessLaunchOrchestratorConfiguration,
  BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM_PATH,
  BLO_CAPABILITIES,
  BUSINESS_LAUNCH_ORCHESTRATOR_ID,
} from "../../business-launch-orchestrator/index.js";
import { appendBloLog, getBloLogs } from "../../business-launch-orchestrator/blo-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildBusinessLaunchOrchestratorConfiguration>[1],
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

  const engine = createBusinessLaunchOrchestrator(
    bootstrap,
    {
      companyFactoryFramework: cff,
      brandCreationEngine: bce,
      domainDigitalAssetPlanner: dap,
      storeGenerationEngine: sge,
      pricingStrategyEngine: pse,
      launchReadinessValidator: lrv,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, lrv };
}

describe("X1-11 Business Launch Orchestrator", () => {
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
  });

  test("buildBusinessLaunchOrchestratorConfiguration loads defaults", () => {
    const config = buildBusinessLaunchOrchestratorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLaunchWithoutReadinessValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.maxLaunchesPerCycle >= 1);
    assert.ok(BLO_CAPABILITIES.includes("business_launch_orchestration"));
  });

  test("business launch orchestrator initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BLO-001");
    assert.equal(state.missionId, "X1-11");
    assert.ok(BUSINESS_LAUNCH_ORCHESTRATOR_SYSTEM_PATH.includes("BUSINESS_LAUNCH"));
  });

  test("connectBusinessLaunchOrchestrator registers with Company Factory Framework via X1-11", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectBusinessLaunchOrchestrator();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === BUSINESS_LAUNCH_ORCHESTRATOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.brandCreationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.domainDigitalAssetPlanner, true);
    assert.equal(report.engineRecord.dependencyPresence.storeGenerationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.pricingStrategyEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.launchReadinessValidator, true);
  });

  test("orchestrateLaunch produces machine-readable blo-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessLaunchOrchestrator();
    const report = engine.orchestrateLaunch({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.launchRunReportId.startsWith("blo-run-"));
    const record = report.launchRecords[0]!;
    assert.ok(record.launchId.startsWith("blo-lnc-"));
    assert.equal(record.metadataVersion, "BLO-001-v1");
    assert.equal(record.fabricatedLaunchFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.launchedWithoutReadinessValidation, false);
    assert.ok(record.companyReference.length > 0);
    assert.ok(record.launchWorkflowReference.length > 0);
    assert.ok(record.readinessReference.length > 0);
    assert.ok(record.launchProgress >= 0);
  });

  test("launch lifecycle workflow stages dependencies progress recovery report", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessLaunchOrchestrator();
    engine.orchestrateLaunch({ industry: "consumer-goods", validated: true });

    engine.executeLaunchWorkflow();
    engine.manageLaunchStages();
    engine.coordinateDependencies();
    engine.trackLaunchProgress();
    engine.detectLaunchFailures();
    engine.coordinateLaunchRecovery();

    const report = engine.generateLaunchReport();
    assert.equal(report.action, "generate_launch_report");
    assert.ok(report.launchRecords[0]!.launchReportSummary.length > 0);
  });

  test("rejects launch without readiness validation", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessLaunchOrchestrator();
    const report = engine.orchestrateLaunch({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBloLog({
      event: "launch_execution",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectBusinessLaunchOrchestrator();
    const logs = getBloLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, launch-without-readiness, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLaunchWithoutReadinessValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverLaunchWithoutReadinessValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report launch health", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessLaunchOrchestrator();
    engine.orchestrateLaunch({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalLaunchRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
