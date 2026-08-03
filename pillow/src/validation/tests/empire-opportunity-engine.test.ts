import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireOpportunityEngineConfiguration, createEmpireOpportunityEngine, EOP_CAPABILITIES, resetEmpireOpportunityEngineForTesting } from "../../empire-opportunity-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpireOpportunityEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize(); engine.connectEmpireOpportunityEngine(); return { engine, framework };
}
describe("X5-06 Empire Opportunity Engine", () => {
  beforeEach(resetEmpireOpportunityEngineForTesting);
  test("locks every opportunity safety flag", () => { const c = buildEmpireOpportunityEngineConfiguration(REPO_ROOT, { neverExposeCredentials: false as never, neverRecommendOpportunitiesUsingUnvalidatedIntelligence: false as never }); assert.equal(c.neverExposeCredentials, true); assert.equal(c.neverRecommendOpportunitiesUsingUnvalidatedIntelligence, true); assert.equal(c.preserveOpportunityTraceability, true); });
  test("initializes PILLOW-EOP-001 doctrine for X5-06", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().engineVersion, "PILLOW-EOP-001"); assert.equal(engine.getState().missionId, "X5-06"); });
  test("discovers business opportunities", async () => assert.notEqual((await buildEngine()).engine.discoverBusinessOpportunities({ validated: true }).validation.decision, "fail"));
  test("monitors emerging industries and market shifts", async () => { const { engine } = await buildEngine(); assert.equal(engine.monitorEmergingIndustries({ validated: true }).validation.decision, "pass"); assert.equal(engine.monitorMarketShifts({ validated: true }).validation.decision, "pass"); });
  test("monitors demand technology and competition", async () => { const { engine } = await buildEngine(); assert.equal(engine.monitorCustomerDemand({ validated: true }).validation.decision, "pass"); assert.equal(engine.monitorTechnologicalDevelopments({ validated: true }).validation.decision, "pass"); assert.equal(engine.monitorCompetitiveLandscapes({ validated: true }).validation.decision, "pass"); });
  test("detects profitable opportunities", async () => assert.equal((await buildEngine()).engine.detectProfitableBusinessOpportunities({ validated: true, estimatedBusinessValue: 100 }).validation.decision, "pass"));
  test("ranks opportunity potential", async () => { const { engine } = await buildEngine(); engine.discoverBusinessOpportunities({ validated: true, opportunityScore: 90 }); assert.equal(engine.rankOpportunityPotential().validation.decision, "pass"); });
  test("blocks recommendations from unvalidated intelligence", async () => { const { engine } = await buildEngine(); engine.discoverBusinessOpportunities({ opportunityScore: 90 }); assert.equal(engine.recommendStrategicOpportunities().recommendations.length, 0); });
  test("recommends only validated opportunities", async () => { const { engine } = await buildEngine(); engine.discoverBusinessOpportunities({ validated: true, opportunityScore: 90 }); assert.equal(engine.recommendStrategicOpportunities().recommendations.length, 1); });
  test("connects EIF and validates supervisor sync", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((record) => record.intelligenceModuleIdentifier === "empire-opportunity-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(EOP_CAPABILITIES.includes("opportunity_validation")); });
});
