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
  buildBrandCreationEngineConfiguration,
  BRAND_CREATION_ENGINE_SYSTEM_PATH,
  BCE_CAPABILITIES,
  BRAND_CREATION_ENGINE_ID,
} from "../../brand-creation-engine/index.js";
import { appendBceLog, getBceLogs } from "../../brand-creation-engine/bce-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildBrandCreationEngineConfiguration>[1],
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

  const engine = createBrandCreationEngine(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessOpportunityDiscovery: bod,
      marketValidationEngine: mve,
      businessModelGenerator: bmg,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, bod, mve, bmg };
}

describe("X1-05 Brand Creation Engine", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
    resetBusinessModelGeneratorForTesting();
    resetBrandCreationEngineForTesting();
  });

  test("buildBrandCreationEngineConfiguration loads defaults", () => {
    const config = buildBrandCreationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.preventDuplicateBrandIdentities, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(BCE_CAPABILITIES.includes("brand_creation"));
  });

  test("brand creation engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BCE-001");
    assert.equal(state.missionId, "X1-05");
    assert.ok(BRAND_CREATION_ENGINE_SYSTEM_PATH.includes("BRAND_CREATION"));
  });

  test("connectBrandCreationEngine registers with Company Factory Framework via X1-05", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectBrandCreationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === BRAND_CREATION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessOpportunityDiscovery, true);
    assert.equal(report.engineRecord.dependencyPresence.marketValidationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.businessModelGenerator, true);
  });

  test("createBrand produces machine-readable bce-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectBrandCreationEngine();
    const report = engine.createBrand({
      industry: "digital-services",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.brandRunReportId.startsWith("bce-run-"));
    const record = report.brandRecords[0]!;
    assert.ok(record.brandId.startsWith("bce-brd-"));
    assert.equal(record.metadataVersion, "BCE-001-v1");
    assert.equal(record.fabricatedBrandFacts, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(record.companyName.length > 0);
    assert.ok(record.brandIdentity.length > 0);
    assert.ok(record.brandPositioning.length > 0);
    assert.ok(record.brandGuidelineReference.length > 0);
    assert.ok(record.businessModelReference.length > 0);
  });

  test("brand generation lifecycle name identity positioning guidelines", async () => {
    const { engine } = await buildEngine();
    engine.connectBrandCreationEngine();
    engine.createBrand({ industry: "consumer-goods", validated: true });

    const naming = engine.generateCompanyName();
    assert.equal(naming.action, "generate_company_name");
    engine.generateBrandIdentity();
    engine.generateBrandPositioning();
    engine.generateBrandMessaging();
    engine.generateBrandValues();
    engine.generateBrandVoice();
    engine.generateColourRecommendations();
    engine.generateTypographyRecommendations();

    const guidelines = engine.generateBrandGuidelines();
    assert.equal(guidelines.action, "generate_brand_guidelines");
    assert.ok(guidelines.brandRecords[0]!.brandGuidelineReference.startsWith("structural://"));
    assert.ok(guidelines.brandRecords.every((r) => r.fabricatedBrandFacts === false));
  });

  test("rejects unvalidated brand creation", async () => {
    const { engine } = await buildEngine();
    engine.connectBrandCreationEngine();
    const report = engine.createBrand({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBceLog({
      event: "brand_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectBrandCreationEngine();
    const logs = getBceLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables credential, duplicate, or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExposeCredentials: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      preventDuplicateBrandIdentities: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.preventDuplicateBrandIdentities, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectBrandCreationEngine();
    engine.createBrand({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalBrandRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
