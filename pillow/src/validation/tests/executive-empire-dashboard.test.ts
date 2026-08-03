import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { createEmpireIntelligenceFrameworkEngine, resetEmpireIntelligenceFrameworkForTesting } from "../../empire-intelligence-framework/index.js";
import { buildExecutiveEmpireDashboardConfiguration, createExecutiveEmpireDashboardEngine, resetExecutiveEmpireDashboardForTesting } from "../../executive-empire-dashboard/index.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine() { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const framework = createEmpireIntelligenceFrameworkEngine(bootstrap); await framework.initialize(); const engine = createExecutiveEmpireDashboardEngine(bootstrap, { empireIntelligenceFramework: framework }); await engine.initialize(); engine.connectExecutiveEmpireDashboard(); return { engine, framework }; }
describe("X5-10 Executive Empire Dashboard", () => {
  beforeEach(() => { resetEmpireIntelligenceFrameworkForTesting(); resetExecutiveEmpireDashboardForTesting(); });
  test("1 locks mandatory safety flags", () => { const c = buildExecutiveEmpireDashboardConfiguration(REPO_ROOT, { neverExposeCredentials: false as never }); assert.equal(c.neverExposeCredentials, true); assert.equal(c.structuralSignalsOnly, true); });
  test("2 initializes doctrine", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().missionId, "X5-10"); });
  test("3 registers with EIF", async () => { const { engine, framework } = await buildEngine(); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "executive-empire-dashboard")); });
  test("4 aggregates enterprise KPIs", async () => { const { engine } = await buildEngine(); assert.equal(engine.aggregateEnterpriseWideKpis().dashboardRecords[0]?.structuralSignalOnly, true); });
  test("5 displays portfolio and company performance", async () => { const { engine } = await buildEngine(); assert.equal(engine.displayPortfolioPerformance().dashboardRecords[0]?.activeWidgets[0], "portfolio_performance"); assert.equal(engine.displayCompanyPerformance().dashboardRecords[0]?.activeWidgets[0], "company_performance"); });
  test("6 displays capital and opportunity pipelines", async () => { const { engine } = await buildEngine(); assert.equal(engine.displayCapitalAllocationStatus().dashboardRecords[0]?.activeWidgets[0], "capital_allocation"); assert.equal(engine.displayOpportunityPipeline().dashboardRecords[0]?.activeWidgets[0], "opportunity_pipeline"); });
  test("7 displays innovation resilience and improvement", async () => { const { engine } = await buildEngine(); assert.equal(engine.displayInnovationPipeline().dashboardRecords[0]?.activeWidgets[0], "innovation_pipeline"); assert.equal(engine.displayEnterpriseResilience().dashboardRecords[0]?.activeWidgets[0], "enterprise_resilience"); assert.equal(engine.displaySelfImprovementProgress().dashboardRecords[0]?.activeWidgets[0], "self_improvement_progress"); });
  test("8 produces alerts and recommendations", async () => { const { engine } = await buildEngine(); assert.equal(engine.displayExecutiveAlerts({ alertHint: true }).dashboardRecords[0]?.executiveAlerts.length, 1); assert.ok(engine.displayStrategicRecommendations().recommendations.length >= 1); });
  test("9 refresh retains traceability", async () => { const { engine } = await buildEngine(); const record = engine.refreshDashboardSnapshot().dashboardRecords[0]!; assert.ok(record.dashboardTraceId.startsWith("eed-trace-")); assert.equal(record.neverExposeAuthenticationTokens, true); });
  test("10 provides diagnostics and supervisor snapshot", async () => { const { engine } = await buildEngine(); assert.notEqual(engine.runDiagnostics().validation.decision, "fail"); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(engine.getCockpitSnapshot().frameworkRegistered); });
});
