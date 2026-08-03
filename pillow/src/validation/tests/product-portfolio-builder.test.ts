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
  buildProductPortfolioBuilderConfiguration,
  PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH,
  PPB_CAPABILITIES,
  PRODUCT_PORTFOLIO_BUILDER_ID,
} from "../../product-portfolio-builder/index.js";
import { appendPpbLog, getPpbLogs } from "../../product-portfolio-builder/ppb-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildProductPortfolioBuilderConfiguration>[1],
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

  const engine = createProductPortfolioBuilder(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessOpportunityDiscovery: bod,
      marketValidationEngine: mve,
      businessModelGenerator: bmg,
      storeGenerationEngine: sge,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, bod, mve, bmg, sge };
}

describe("X1-08 Product Portfolio Builder", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
    resetBusinessModelGeneratorForTesting();
    resetBrandCreationEngineForTesting();
    resetDomainDigitalAssetPlannerForTesting();
    resetStoreGenerationEngineForTesting();
    resetProductPortfolioBuilderForTesting();
  });

  test("buildProductPortfolioBuilderConfiguration loads defaults", () => {
    const config = buildProductPortfolioBuilderConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoPublish, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(PPB_CAPABILITIES.includes("product_portfolio_generation"));
  });

  test("product portfolio builder initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PPB-001");
    assert.equal(state.missionId, "X1-08");
    assert.ok(PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH.includes("PRODUCT_PORTFOLIO"));
  });

  test("connectProductPortfolioBuilder registers with Company Factory Framework via X1-08", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectProductPortfolioBuilder();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === PRODUCT_PORTFOLIO_BUILDER_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessOpportunityDiscovery, true);
    assert.equal(report.engineRecord.dependencyPresence.marketValidationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.businessModelGenerator, true);
    assert.equal(report.engineRecord.dependencyPresence.storeGenerationEngine, true);
  });

  test("buildPortfolio produces machine-readable ppb-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectProductPortfolioBuilder();
    const report = engine.buildPortfolio({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.portfolioRunReportId.startsWith("ppb-run-"));
    const record = report.portfolioRecords[0]!;
    assert.ok(record.portfolioId.startsWith("ppb-prt-"));
    assert.equal(record.metadataVersion, "PPB-001-v1");
    assert.equal(record.fabricatedPortfolioFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.automaticPublication, false);
    assert.ok(record.productReferences.length > 0);
    assert.ok(record.productCategories.length > 0);
    assert.ok(record.portfolioProfitabilityScore >= 0);
    assert.ok(record.portfolioDemandScore >= 0);
    assert.ok(record.recommendations.length > 0);
    assert.ok(record.businessModelReference.length > 0);
  });

  test("portfolio lifecycle discover evaluate optimize recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectProductPortfolioBuilder();
    engine.buildPortfolio({ industry: "consumer-goods", validated: true });

    const discover = engine.discoverProducts();
    assert.equal(discover.action, "discover_products");
    engine.evaluateProducts();
    engine.categorizeProducts();
    engine.rankProducts();
    engine.estimateProfitability();
    engine.estimateDemand();
    engine.detectOverlappingProducts();

    const optimize = engine.optimizePortfolio();
    assert.equal(optimize.action, "optimize_portfolio");
    const recommend = engine.recommendImprovements();
    assert.equal(recommend.action, "recommend_improvements");
    assert.ok(recommend.portfolioRecords[0]!.recommendations.length > 0);
    assert.ok(recommend.portfolioRecords.every((r) => r.automaticPublication === false));
  });

  test("rejects unvalidated portfolio generation", async () => {
    const { engine } = await buildEngine();
    engine.connectProductPortfolioBuilder();
    const report = engine.buildPortfolio({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPpbLog({
      event: "portfolio_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectProductPortfolioBuilder();
    const logs = getPpbLogs(50);
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
    engine.connectProductPortfolioBuilder();
    engine.buildPortfolio({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalPortfolioRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
