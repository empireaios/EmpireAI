import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildGlobalRiskIntelligenceConfiguration,
  createGlobalRiskIntelligenceEngine,
  GRI_CAPABILITIES,
  resetGlobalRiskIntelligenceForTesting,
} from "../../global-risk-intelligence/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createGlobalRiskIntelligenceEngine(bootstrap, {});
  await engine.initialize();
  engine.connectGlobalRiskIntelligence();
  return engine;
}

describe("X4-15 Global Risk Intelligence", () => {
  beforeEach(resetGlobalRiskIntelligenceForTesting);

  test("locks all risk safety flags", () => {
    const config = buildGlobalRiskIntelligenceConfiguration(REPO_ROOT, {
      neverExposeCredentials: false as never,
      neverSuppressCriticalInternationalRisks: false as never,
      neverMakeDecisionsUsingUnvalidatedRiskIntelligence: false as never,
    });
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverSuppressCriticalInternationalRisks, true);
    assert.equal(config.neverMakeDecisionsUsingUnvalidatedRiskIntelligence, true);
    assert.equal(config.preserveRiskTraceability, true);
  });

  test("initializes PILLOW-GRI-001 for X4-15", async () => {
    const engine = await buildEngine();
    assert.equal(engine.getState().engineVersion, "PILLOW-GRI-001");
    assert.equal(engine.getState().missionId, "X4-15");
  });

  test("monitors geopolitical risks", async () => {
    const report = (await buildEngine()).monitorGeopoliticalRisks({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
  });

  test("monitors economic and financial risks", async () => {
    const engine = await buildEngine();
    assert.notEqual(engine.monitorEconomicRisks({ validated: true }).validation.decision, "fail");
    assert.notEqual(engine.monitorFinancialRisks({ validated: true }).validation.decision, "fail");
  });

  test("monitors regulatory risks", async () => {
    const report = (await buildEngine()).monitorRegulatoryRisks({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
  });

  test("monitors operational and logistics risks", async () => {
    const engine = await buildEngine();
    assert.notEqual(engine.monitorOperationalRisks({ validated: true }).validation.decision, "fail");
    assert.notEqual(engine.monitorLogisticsRisks({ validated: true }).validation.decision, "fail");
  });

  test("monitors regional business risks", async () => {
    const report = (await buildEngine()).monitorRegionalBusinessRisks({ validated: true });
    assert.ok(report.optimizationRecords[0]?.globalRiskId.startsWith("gri-risk-"));
  });

  test("detects and ranks international risks", async () => {
    const engine = await buildEngine();
    assert.notEqual(engine.detectEmergingInternationalRisks({ validated: true }).validation.decision, "fail");
    assert.notEqual(engine.rankGlobalRisks({ validated: true }).validation.decision, "fail");
  });

  test("recommends mitigation only from validated records", async () => {
    const engine = await buildEngine();
    engine.monitorGeopoliticalRisks({ validated: true });
    assert.notEqual(engine.recommendRiskMitigation({ validated: true }).validation.decision, "fail");
  });

  test("reports records, diagnostics, and supervisor readiness", async () => {
    const engine = await buildEngine();
    engine.monitorGeopoliticalRisks({ validated: true });
    assert.ok(engine.getRiskRecords().length > 0);
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(GRI_CAPABILITIES.includes("global_risk_ranking"));
  });
});
