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
  buildBusinessOpportunityDiscoveryConfiguration,
  BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH,
  BOD_CAPABILITIES,
  BUSINESS_OPPORTUNITY_DISCOVERY_ID,
} from "../../business-opportunity-discovery/index.js";
import { appendBodLog, getBodLogs } from "../../business-opportunity-discovery/bod-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildBusinessOpportunityDiscoveryConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const cff = createCompanyFactoryFrameworkEngine(bootstrap);
  await cff.initialize();

  const engine = createBusinessOpportunityDiscovery(
    bootstrap,
    { companyFactoryFramework: cff },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, cff };
}

describe("X1-02 Business Opportunity Discovery", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
    resetBusinessOpportunityDiscoveryForTesting();
  });

  test("buildBusinessOpportunityDiscoveryConfiguration loads defaults", () => {
    const config = buildBusinessOpportunityDiscoveryConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverFabricateMarketInformation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(BOD_CAPABILITIES.includes("business_opportunity_discovery"));
  });

  test("business opportunity discovery initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BOD-001");
    assert.equal(state.missionId, "X1-02");
    assert.ok(BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH.includes("BUSINESS_OPPORTUNITY"));
  });

  test("connectBusinessOpportunityDiscovery registers with Company Factory Framework via X1-02", async () => {
    const { engine, cff } = await buildEngine();
    const report = engine.connectBusinessOpportunityDiscovery();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = cff.getRegisteredModules();
    assert.ok(modules.some((m) => m.companyModuleIdentifier === BUSINESS_OPPORTUNITY_DISCOVERY_ID));
    assert.equal(report.engineRecord.dependencyPresence.companyFactoryFramework, true);
  });

  test("discoverOpportunities produces machine-readable bod-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessOpportunityDiscovery();
    const report = engine.discoverOpportunities({
      industry: "consumer-goods",
      marketReference: "structural://consumer-goods",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.opportunityRunReportId.startsWith("bod-run-"));
    const record = report.opportunityRecords[0]!;
    assert.ok(record.opportunityId.startsWith("bod-opp-"));
    assert.equal(record.metadataVersion, "BOD-001-v1");
    assert.equal(record.fabricatedMarketInformation, false);
    assert.equal(record.structuralSignalOnly, true);
    assert.ok(record.opportunityScore >= 50);
  });

  test("monitor score and rank lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessOpportunityDiscovery();
    engine.discoverOpportunities({ industry: "digital-services", validated: true });

    const trends = engine.monitorMarketTrends();
    assert.equal(trends.action, "monitor_market_trends");
    engine.monitorEmergingIndustries();
    engine.monitorCustomerDemand();
    engine.monitorCompetitorActivity();
    engine.identifyUnderservedMarkets();
    engine.identifyProfitableNiches();

    const scored = engine.scoreOpportunities();
    assert.equal(scored.action, "score_opportunities");
    assert.ok(scored.opportunityRecords[0]!.opportunityScore >= 50);

    const ranked = engine.rankOpportunities();
    assert.equal(ranked.action, "rank_opportunities");
    assert.ok(ranked.opportunityRecords.every((r) => r.ranking !== null));
    assert.ok(ranked.opportunityRecords.every((r) => r.fabricatedMarketInformation === false));
  });

  test("rejects unvalidated discovery", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessOpportunityDiscovery();
    const report = engine.discoverOpportunities({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBodLog({
      event: "opportunity_discovery",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectBusinessOpportunityDiscovery();
    const logs = getBodLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables fabrication or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverFabricateMarketInformation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      structuralSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    const config = engine.getState().configuration;
    assert.equal(config.neverFabricateMarketInformation, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectBusinessOpportunityDiscovery();
    engine.discoverOpportunities({ industry: "health-wellness", validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalOpportunityRecords >= 1);
  });
});
