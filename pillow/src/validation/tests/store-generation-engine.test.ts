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
  buildStoreGenerationEngineConfiguration,
  STORE_GENERATION_ENGINE_SYSTEM_PATH,
  SGE_CAPABILITIES,
  STORE_GENERATION_ENGINE_ID,
} from "../../store-generation-engine/index.js";
import { appendSgeLog, getSgeLogs } from "../../store-generation-engine/sge-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildStoreGenerationEngineConfiguration>[1],
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

  const engine = createStoreGenerationEngine(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessModelGenerator: bmg,
      brandCreationEngine: bce,
      domainDigitalAssetPlanner: dap,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, bmg, bce, dap };
}

describe("X1-07 Store Generation Engine", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
    resetBusinessModelGeneratorForTesting();
    resetBrandCreationEngineForTesting();
    resetDomainDigitalAssetPlannerForTesting();
    resetStoreGenerationEngineForTesting();
  });

  test("buildStoreGenerationEngineConfiguration loads defaults", () => {
    const config = buildStoreGenerationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoDeploy, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(SGE_CAPABILITIES.includes("storefront_generation"));
  });

  test("store generation engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SGE-001");
    assert.equal(state.missionId, "X1-07");
    assert.ok(STORE_GENERATION_ENGINE_SYSTEM_PATH.includes("STORE_GENERATION"));
  });

  test("connectStoreGenerationEngine registers with Company Factory Framework via X1-07", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectStoreGenerationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === STORE_GENERATION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessModelGenerator, true);
    assert.equal(report.engineRecord.dependencyPresence.brandCreationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.domainDigitalAssetPlanner, true);
  });

  test("generateStorefront produces machine-readable sge-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectStoreGenerationEngine();
    const report = engine.generateStorefront({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.storefrontRunReportId.startsWith("sge-run-"));
    const record = report.storefrontRecords[0]!;
    assert.ok(record.storefrontId.startsWith("sge-sft-"));
    assert.equal(record.metadataVersion, "SGE-001-v1");
    assert.equal(record.fabricatedStorefrontFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.automaticDeployment, false);
    assert.ok(record.websiteStructureReference.length > 0);
    assert.ok(record.navigationStructure.length > 0);
    assert.ok(record.homepageLayout.length > 0);
    assert.ok(record.productCatalogueStructure.length > 0);
    assert.ok(record.deploymentPackageReference.length > 0);
    assert.ok(record.brandReference.length > 0);
    assert.ok(record.domainPlanReference.length > 0);
  });

  test("storefront generation lifecycle website navigation catalogue deployment", async () => {
    const { engine } = await buildEngine();
    engine.connectStoreGenerationEngine();
    engine.generateStorefront({ industry: "consumer-goods", validated: true });

    const website = engine.createWebsiteStructure();
    assert.equal(website.action, "create_website_structure");
    engine.createNavigationStructure();
    engine.createHomepageLayout();
    engine.createProductCatalogueStructure();
    engine.createCategoryStructure();
    engine.createCompanyInformationPages();
    engine.prepareLegalPageTemplates();

    const deployment = engine.prepareDeploymentPackage();
    assert.equal(deployment.action, "prepare_deployment_package");
    assert.ok(deployment.storefrontRecords[0]!.deploymentPackageReference.startsWith("structural://"));
    assert.ok(deployment.storefrontRecords.every((r) => r.automaticDeployment === false));
  });

  test("rejects unvalidated storefront generation", async () => {
    const { engine } = await buildEngine();
    engine.connectStoreGenerationEngine();
    const report = engine.generateStorefront({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSgeLog({
      event: "store_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectStoreGenerationEngine();
    const logs = getSgeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, auto-deploy, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      neverAutoDeploy: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverAutoDeploy, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectStoreGenerationEngine();
    engine.generateStorefront({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalStorefrontRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
