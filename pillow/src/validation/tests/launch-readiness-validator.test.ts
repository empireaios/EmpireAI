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
  buildLaunchReadinessValidatorConfiguration,
  LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH,
  LRV_CAPABILITIES,
  LAUNCH_READINESS_VALIDATOR_ID,
} from "../../launch-readiness-validator/index.js";
import { appendLrvLog, getLrvLogs } from "../../launch-readiness-validator/lrv-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildLaunchReadinessValidatorConfiguration>[1],
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

  const engine = createLaunchReadinessValidator(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessModelGenerator: bmg,
      brandCreationEngine: bce,
      domainDigitalAssetPlanner: dap,
      storeGenerationEngine: sge,
      productPortfolioBuilder: ppb,
      pricingStrategyEngine: pse,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff };
}

describe("X1-10 Launch Readiness Validator", () => {
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
  });

  test("buildLaunchReadinessValidatorConfiguration loads defaults", () => {
    const config = buildLaunchReadinessValidatorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverCertifyWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.launchThreshold >= 1);
    assert.ok(LRV_CAPABILITIES.includes("launch_readiness_validation"));
  });

  test("launch readiness validator initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-LRV-001");
    assert.equal(state.missionId, "X1-10");
    assert.ok(LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH.includes("LAUNCH_READINESS"));
  });

  test("connectLaunchReadinessValidator registers with Company Factory Framework via X1-10", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectLaunchReadinessValidator();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === LAUNCH_READINESS_VALIDATOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessModelGenerator, true);
    assert.equal(report.engineRecord.dependencyPresence.brandCreationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.domainDigitalAssetPlanner, true);
    assert.equal(report.engineRecord.dependencyPresence.storeGenerationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.productPortfolioBuilder, true);
    assert.equal(report.engineRecord.dependencyPresence.pricingStrategyEngine, true);
  });

  test("validateLaunchReadiness produces machine-readable lrv-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchReadinessValidator();
    const report = engine.validateLaunchReadiness({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.launchRunReportId.startsWith("lrv-run-"));
    const record = report.readinessRecords[0]!;
    assert.ok(record.launchReadinessId.startsWith("lrv-lrd-"));
    assert.equal(record.metadataVersion, "LRV-001-v1");
    assert.equal(record.fabricatedLaunchFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(record.readinessScore >= 0);
    assert.ok(record.businessModelReference.length > 0);
    assert.ok(record.storefrontReference.length > 0);
    assert.ok(record.productPortfolioReference.length > 0);
    assert.ok(record.pricingReference.length > 0);
    assert.ok(record.launchRecommendation.length > 0);
  });

  test("launch readiness lifecycle domain checks score recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchReadinessValidator();
    engine.validateLaunchReadiness({ industry: "consumer-goods", validated: true });

    engine.validateBusinessConfiguration();
    engine.validateBrandReadiness();
    engine.validateDigitalAssetReadiness();
    engine.validateStorefrontReadiness();
    engine.validateProductPortfolioReadiness();
    engine.validatePricingReadiness();
    engine.detectLaunchBlockers();

    const score = engine.calculateReadinessScore();
    assert.equal(score.action, "calculate_readiness_score");
    const recommend = engine.generateLaunchRecommendations();
    assert.equal(recommend.action, "generate_launch_recommendations");
    assert.ok(recommend.readinessRecords[0]!.launchRecommendation.length > 0);
  });

  test("rejects unvalidated launch readiness validation", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchReadinessValidator();
    const report = engine.validateLaunchReadiness({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendLrvLog({
      event: "launch_validation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectLaunchReadinessValidator();
    const logs = getLrvLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, certify-without-validation, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverCertifyWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverCertifyWithoutValidation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectLaunchReadinessValidator();
    engine.validateLaunchReadiness({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalReadinessRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
