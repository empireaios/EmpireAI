import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireIntelligenceFrameworkConfiguration, createEmpireIntelligenceFrameworkEngine, FRAMEWORK_CAPABILITIES, resetEmpireIntelligenceFrameworkForTesting } from "../../empire-intelligence-framework/index.js";
import type { IntelligenceModuleDefinition } from "../../empire-intelligence-framework/index.js";
import { appendEifLog, getEifLogs } from "../../empire-intelligence-framework/eif-logging.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const definition: IntelligenceModuleDefinition = { intelligenceModuleIdentifier:"intelligence-template-alpha", moduleVersion:"1.0.0", moduleType:"template", supportedCapabilities:["empire_intelligence_module_registration","empire_intelligence_event_routing"] };
async function build() { const bootstrap=await runBootstrap({repositoryRoot:REPO_ROOT,skipHeavyScans:true}); const engine=createEmpireIntelligenceFrameworkEngine(bootstrap); await engine.initialize(); return engine; }
describe("X5-01 Empire Intelligence Framework", () => {
  beforeEach(() => resetEmpireIntelligenceFrameworkForTesting());
  test("locks safety flags", () => { const c=buildEmpireIntelligenceFrameworkConfiguration(REPO_ROOT,{neverExposeCredentials:false as never}); assert.equal(c.neverExposeCredentials,true); assert.equal(c.neverBypassValidation,true); assert.equal(c.preserveModuleIsolation,true); });
  test("initializes with governance doc", async () => { const e=await build(); assert.equal(e.getState().missionId,"X5-01"); });
  test("declares framework capabilities", () => assert.ok(FRAMEWORK_CAPABILITIES.includes("empire_intelligence_module_registration")));
  test("registers machine-readable framework records", async () => { const r=(await build()).registerEmpireIntelligenceModule({definition}); assert.equal(r.records[0]?.frameworkId.startsWith("eif-"),true); assert.equal(r.records[0]?.metadataVersion,"EIF-001-v1"); });
  test("rejects incomplete registration", async () => { const r=(await build()).registerEmpireIntelligenceModule({definition:{...definition,intelligenceModuleIdentifier:""}}); assert.equal(r.validation.decision,"fail"); });
  test("manages lifecycle", async () => { const e=await build(); e.registerEmpireIntelligenceModule({definition}); e.manageEnterpriseIntelligenceLifecycle(definition.intelligenceModuleIdentifier,"start"); assert.equal(e.getFrameworkRecords()[0]?.operationalState,"active"); });
  test("routes active structural events", async () => { const e=await build(); e.registerEmpireIntelligenceModule({definition}); e.manageEnterpriseIntelligenceLifecycle(definition.intelligenceModuleIdentifier,"start"); assert.notEqual(e.routeIntelligenceEvents({intelligenceModuleIdentifier:definition.intelligenceModuleIdentifier,topic:"intelligence.ready"}).validation.decision,"fail"); });
  test("provides standardized interfaces", async () => { const e=await build(); assert.equal(e.provideStandardizedIntelligenceInterfaces().structuralSignalsOnly,true); });
  test("redacts sensitive log details", async () => { await build(); appendEifLog({event:"test",level:"info",details:"token=secret-value"}); assert.ok(getEifLogs().some((l)=>l.details.includes("[redacted]"))); });
  test("reports diagnostics and supervisor readiness", async () => { const e=await build(); e.registerEmpireIntelligenceModule({definition}); assert.ok(e.validateForSupervisorSync().valid); assert.equal(e.runDiagnostics().validation.decision,"pass"); });
});
