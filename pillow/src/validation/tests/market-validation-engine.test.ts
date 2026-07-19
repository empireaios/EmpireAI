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
  buildMarketValidationEngineConfiguration,
  MARKET_VALIDATION_ENGINE_SYSTEM_PATH,
  MVE_CAPABILITIES,
  MARKET_VALIDATION_ENGINE_ID,
} from "../../market-validation-engine/index.js";
import { appendMveLog, getMveLogs } from "../../market-validation-engine/mve-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMarketValidationEngineConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const cff = createCompanyFactoryFrameworkEngine(bootstrap);
  await cff.initialize();

  const bod = createBusinessOpportunityDiscovery(bootstrap, {
    companyFactoryFramework: cff,
  });
  await bod.initialize();
  bod.connectBusinessOpportunityDiscovery();
  bod.discoverOpportunities({ industry: "consumer-goods", validated: true });

  const engine = createMarketValidationEngine(
    bootstrap,
    {
      companyFactoryFramework: cff,
      businessOpportunityDiscovery: bod,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff, bod };
}

describe("X1-03 Market Validation Engine", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
    resetMarketValidationEngineForTesting();
  });

  test("buildMarketValidationEngineConfiguration loads defaults", () => {
    const config = buildMarketValidationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverFabricateValidationResults, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(MVE_CAPABILITIES.includes("market_validation"));
  });

  test("market validation engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MVE-001");
    assert.equal(state.missionId, "X1-03");
    assert.ok(MARKET_VALIDATION_ENGINE_SYSTEM_PATH.includes("MARKET_VALIDATION"));
  });

  test("connectMarketValidationEngine registers with Company Factory Framework via X1-03", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectMarketValidationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === MARKET_VALIDATION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.businessOpportunityDiscovery, true);
  });

  test("validateOpportunity produces machine-readable mve-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketValidationEngine();
    const report = engine.validateOpportunity({
      industry: "consumer-goods",
      opportunityReference: "bod-opp-test",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.marketValidationRunReportId.startsWith("mve-run-"));
    const record = report.validationRecords[0]!;
    assert.ok(record.validationId.startsWith("mve-vld-"));
    assert.equal(record.metadataVersion, "MVE-001-v1");
    assert.equal(record.fabricatedValidationResults, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(record.validationConfidence >= 55);
    assert.ok(record.investmentRecommendation);
  });

  test("validation lifecycle demand customer competition profitability recommendation", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketValidationEngine();
    engine.validateOpportunity({ industry: "digital-services", validated: true });

    const demand = engine.validateMarketDemand();
    assert.equal(demand.action, "validate_market_demand");
    engine.validateCustomerInterest();
    engine.validateCompetitiveLandscape();
    engine.validateMarketSize();
    engine.validateProfitabilityPotential();
    engine.calculateValidationConfidence();
    engine.identifyMarketRisks();

    const rec = engine.generateInvestmentRecommendation();
    assert.equal(rec.action, "generate_investment_recommendation");
    assert.ok(
      ["proceed", "caution", "investigate", "reject"].includes(
        rec.validationRecords[0]!.investmentRecommendation,
      ),
    );
    assert.ok(rec.validationRecords.every((r) => r.fabricatedValidationResults === false));
  });

  test("rejects unvalidated opportunity validation", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketValidationEngine();
    const report = engine.validateOpportunity({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMveLog({
      event: "validation_execution",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectMarketValidationEngine();
    const logs = getMveLogs(50);
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
    engine.connectMarketValidationEngine();
    engine.validateOpportunity({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalValidationRecords >= 1);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
