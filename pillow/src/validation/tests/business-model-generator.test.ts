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
  buildBusinessModelGeneratorConfiguration,
  BUSINESS_MODEL_GENERATOR_SYSTEM_PATH,
  BMG_CAPABILITIES,
  BUSINESS_MODEL_GENERATOR_ID,
} from "../../business-model-generator/index.js";
import { appendBmgLog, getBmgLogs } from "../../business-model-generator/bmg-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildBusinessModelGeneratorConfiguration>[1],
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

  const engine = createBusinessModelGenerator(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessOpportunityDiscovery: bod,
      marketValidationEngine: mve,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, bod, mve };
}

describe("X1-04 Business Model Generator", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
    resetBusinessModelGeneratorForTesting();
  });

  test("buildBusinessModelGeneratorConfiguration loads defaults", () => {
    const config = buildBusinessModelGeneratorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverFabricateValidationResults, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(BMG_CAPABILITIES.includes("business_model_generation"));
  });

  test("business model generator initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BMG-001");
    assert.equal(state.missionId, "X1-04");
    assert.ok(BUSINESS_MODEL_GENERATOR_SYSTEM_PATH.includes("BUSINESS_MODEL"));
  });

  test("connectBusinessModelGenerator registers with Company Factory Framework via X1-04", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectBusinessModelGenerator();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === BUSINESS_MODEL_GENERATOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessOpportunityDiscovery, true);
    assert.equal(report.engineRecord.dependencyPresence.marketValidationEngine, true);
  });

  test("generateBusinessModel produces machine-readable bmg-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessModelGenerator();
    const report = engine.generateBusinessModel({
      industry: "digital-services",
      opportunityReference: "bod-opp-test",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.businessModelRunReportId.startsWith("bmg-run-"));
    const record = report.businessModelRecords[0]!;
    assert.ok(record.businessModelId.startsWith("bmg-mdl-"));
    assert.equal(record.metadataVersion, "BMG-001-v1");
    assert.equal(record.fabricatedValidationResults, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(record.businessModelScore >= 55);
    assert.ok(record.revenueModel);
    assert.ok(record.valueProposition);
    assert.ok(record.customerSegment);
  });

  test("generation lifecycle revenue segments value cost score", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessModelGenerator();
    engine.generateBusinessModel({ industry: "consumer-goods", validated: true });

    const revenue = engine.generateRevenueModel();
    assert.equal(revenue.action, "generate_revenue_model");
    engine.generateCustomerSegments();
    engine.generateValueProposition();
    engine.generateCostStructure();
    engine.generateDistributionChannels();
    engine.generatePartnershipStrategies();
    engine.generateOperationalModels();

    const scored = engine.scoreBusinessModels();
    assert.equal(scored.action, "score_business_models");
    assert.ok(scored.businessModelRecords[0]!.businessModelScore >= 55);
    assert.ok(scored.businessModelRecords.every((r) => r.fabricatedValidationResults === false));
  });

  test("rejects unvalidated business model generation", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessModelGenerator();
    const report = engine.generateBusinessModel({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBmgLog({
      event: "business_model_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectBusinessModelGenerator();
    const logs = getBmgLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables fabrication or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverFabricateValidationResults: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverFabricateValidationResults, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessModelGenerator();
    engine.generateBusinessModel({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalBusinessModelRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
