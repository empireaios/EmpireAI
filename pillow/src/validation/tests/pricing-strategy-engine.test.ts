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
  buildPricingStrategyEngineConfiguration,
  PRICING_STRATEGY_ENGINE_SYSTEM_PATH,
  PSE_CAPABILITIES,
  PRICING_STRATEGY_ENGINE_ID,
} from "../../pricing-strategy-engine/index.js";
import { appendPseLog, getPseLogs } from "../../pricing-strategy-engine/pse-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildPricingStrategyEngineConfiguration>[1],
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

  const engine = createPricingStrategyEngine(
    bootstrap,
    {
      companyFactoryFramework: cff,
      marketValidationEngine: mve,
      businessModelGenerator: bmg,
      productPortfolioBuilder: ppb,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, mve, bmg, ppb };
}

describe("X1-09 Pricing Strategy Engine", () => {
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
  });

  test("buildPricingStrategyEngineConfiguration loads defaults", () => {
    const config = buildPricingStrategyEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoPublish, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(PSE_CAPABILITIES.includes("pricing_strategy_generation"));
  });

  test("pricing strategy engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PSE-001");
    assert.equal(state.missionId, "X1-09");
    assert.ok(PRICING_STRATEGY_ENGINE_SYSTEM_PATH.includes("PRICING_STRATEGY"));
  });

  test("connectPricingStrategyEngine registers with Company Factory Framework via X1-09", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectPricingStrategyEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === PRICING_STRATEGY_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.marketValidationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.businessModelGenerator, true);
    assert.equal(report.engineRecord.dependencyPresence.productPortfolioBuilder, true);
  });

  test("generatePricingStrategy produces machine-readable pse-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectPricingStrategyEngine();
    const report = engine.generatePricingStrategy({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.pricingRunReportId.startsWith("pse-run-"));
    const record = report.pricingRecords[0]!;
    assert.ok(record.pricingRecordId.startsWith("pse-prc-"));
    assert.equal(record.metadataVersion, "PSE-001-v1");
    assert.equal(record.fabricatedPricingFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.automaticPublication, false);
    assert.ok(record.recommendedSellingPrice > 0);
    assert.ok(record.estimatedProfitMargin >= 0);
    assert.ok(record.competitiveScore >= 0);
    assert.ok(record.productReference.length > 0);
    assert.ok(record.recommendations.length > 0);
  });

  test("pricing lifecycle price margin competitor recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectPricingStrategyEngine();
    engine.generatePricingStrategy({ industry: "consumer-goods", validated: true });

    const price = engine.calculateSellingPrice();
    assert.equal(price.action, "calculate_selling_price");
    engine.calculateProfitMargin();
    engine.evaluateCompetitorPricing();
    engine.evaluateWillingnessToPay();
    engine.selectPricingModel();
    engine.detectPricingConflicts();
    engine.detectUnprofitablePricing();
    engine.analyzePricing();

    const recommend = engine.recommendImprovements();
    assert.equal(recommend.action, "recommend_improvements");
    assert.ok(recommend.pricingRecords[0]!.recommendations.length > 0);
    assert.ok(recommend.pricingRecords.every((r) => r.automaticPublication === false));
  });

  test("rejects unvalidated pricing strategy generation", async () => {
    const { engine } = await buildEngine();
    engine.connectPricingStrategyEngine();
    const report = engine.generatePricingStrategy({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPseLog({
      event: "price_calculations",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectPricingStrategyEngine();
    const logs = getPseLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, auto-publish, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverAutoPublish: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoPublish, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPricingStrategyEngine();
    engine.generatePricingStrategy({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalPricingRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
