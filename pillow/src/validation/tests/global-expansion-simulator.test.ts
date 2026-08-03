import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildGlobalExpansionSimulatorConfiguration, createGlobalExpansionSimulator, GES_CAPABILITIES, resetGlobalExpansionSimulatorForTesting } from "../../global-expansion-simulator/index.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine() { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const engine = createGlobalExpansionSimulator(bootstrap, {}); await engine.initialize(); engine.connectGlobalExpansionSimulator(); return engine; }
describe("X4-17 Global Expansion Simulator", () => {
  beforeEach(resetGlobalExpansionSimulatorForTesting);
  test("locks simulation safety flags", () => { const c = buildGlobalExpansionSimulatorConfiguration(REPO_ROOT, { neverExecuteSimulatedActionsAgainstProductionSystems: false as never }); assert.equal(c.neverExecuteSimulatedActionsAgainstProductionSystems, true); assert.equal(c.structuralSignalsOnly, true); assert.equal(c.neverOptimizeOrExecuteUsingUnvalidatedSimulationIntelligence, true); });
  test("initializes PILLOW-GES-001 for X4-17", async () => { const e = await buildEngine(); assert.equal(e.getState().engineVersion, "PILLOW-GES-001"); assert.equal(e.getState().missionId, "X4-17"); });
  test("simulates country expansion", async () => assert.notEqual((await buildEngine()).simulateCountryExpansion({ targetCountry: "DE", validated: true }).validation.decision, "fail"));
  test("simulates regional and operational readiness", async () => { const e = await buildEngine(); assert.notEqual(e.simulateRegionalExpansion({ validated: true }).validation.decision, "fail"); assert.notEqual(e.simulateOperationalReadiness({ validated: true }).validation.decision, "fail"); });
  test("simulates logistics and regulation", async () => { const e = await buildEngine(); assert.notEqual(e.simulateLogisticsPerformance({ validated: true }).validation.decision, "fail"); assert.notEqual(e.simulateRegulatoryImpact({ validated: true }).validation.decision, "fail"); });
  test("simulates financial and market outcomes", async () => { const e = await buildEngine(); assert.notEqual(e.simulateFinancialOutcomes({ validated: true }).validation.decision, "fail"); assert.notEqual(e.simulateMarketDemand({ validated: true }).validation.decision, "fail"); });
  test("simulates business risks structurally", async () => assert.equal((await buildEngine()).simulateBusinessRisks({ targetCountry: "JP" }).simulationRecords[0]?.neverExecuteSimulatedActionsAgainstProductionSystems, true));
  test("compares and ranks simulations", async () => { const e = await buildEngine(); e.simulateCountryExpansion({ validated: true }); assert.notEqual(e.compareExpansionScenarios({ validated: true }).validation.decision, "fail"); assert.notEqual(e.rankSimulationOutcomes({ validated: true }).validation.decision, "fail"); });
  test("recommends only from validated projections", async () => { const e = await buildEngine(); e.simulateCountryExpansion({ validated: true }); e.recommendExpansion({ validated: true }); assert.ok(e.getRecommendations().length); });
  test("reports diagnostics and supervisor readiness", async () => { const e = await buildEngine(); e.simulateCountryExpansion({ validated: true }); assert.equal(e.validateForSupervisorSync().valid, true); assert.notEqual(e.runDiagnostics().validation.decision, "fail"); assert.ok(GES_CAPABILITIES.includes("scenario_comparison")); });
});
