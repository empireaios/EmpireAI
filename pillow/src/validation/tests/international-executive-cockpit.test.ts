import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildInternationalExecutiveCockpitConfiguration, createInternationalExecutiveCockpit, IEC_CAPABILITIES, resetInternationalExecutiveCockpitForTesting } from "../../international-executive-cockpit/index.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine() { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const engine = createInternationalExecutiveCockpit(bootstrap, {}); await engine.initialize(); engine.connectInternationalExecutiveCockpit(); return engine; }
describe("X4-18 International Executive Cockpit", () => {
  beforeEach(resetInternationalExecutiveCockpitForTesting);
  test("locks cockpit safety flags", () => { const c = buildInternationalExecutiveCockpitConfiguration(REPO_ROOT, { neverExposeCredentials: false as never }); assert.equal(c.neverExposeCredentials, true); assert.equal(c.neverExposeRestrictedEnterpriseInformationToUnauthorizedUsers, true); assert.equal(c.structuralSignalsOnly, true); });
  test("initializes PILLOW-IEC-001 for X4-18", async () => { const e = await buildEngine(); assert.equal(e.getState().engineVersion, "PILLOW-IEC-001"); assert.equal(e.getState().missionId, "X4-18"); });
  test("aggregates worldwide executive KPIs", async () => assert.notEqual((await buildEngine()).displayWorldwideExecutiveKpis({ validated: true }).validation.decision, "fail"));
  test("displays regional performance", async () => assert.notEqual((await buildEngine()).displayRegionalPerformance({ region: "EMEA", validated: true }).validation.decision, "fail"));
  test("displays country expansion status", async () => assert.equal((await buildEngine()).displayCountryExpansionStatus({ country: "DE" }).cockpitRecord.structuralSignalOnly, true));
  test("displays global operational health", async () => assert.notEqual((await buildEngine()).displayGlobalOperationalHealth({ validated: true }).validation.decision, "fail"));
  test("displays worldwide risks", async () => assert.notEqual((await buildEngine()).displayWorldwideRisks({ validated: true }).validation.decision, "fail"));
  test("reports opportunities and recommendations", async () => { const e = await buildEngine(); e.displayStrategicOpportunities({ validated: true }); assert.ok(e.displayExecutiveRecommendations({ validated: true }).recommendations.length); });
  test("supports executive drill-down and refresh", async () => { const e = await buildEngine(); e.supportExecutiveDrillDown({ region: "APAC", country: "JP", validated: true }); assert.notEqual(e.refreshCockpitSnapshot({ validated: true }).validation.decision, "fail"); });
  test("reports diagnostics and supervisor readiness", async () => { const e = await buildEngine(); e.displayWorldwideExecutiveKpis({ validated: true }); assert.equal(e.validateForSupervisorSync().valid, true); assert.notEqual(e.runDiagnostics().validation.decision, "fail"); assert.ok(IEC_CAPABILITIES.includes("executive_drill_down")); });
});
