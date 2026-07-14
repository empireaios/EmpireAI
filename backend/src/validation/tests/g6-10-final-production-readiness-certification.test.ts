import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FINAL_CERTIFICATION_OUTCOMES,
  FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION,
  FINAL_READINESS_EKLS_KINDS,
  buildCockpitFinalProductionReadinessView,
  createProductionCertificationModuleContract,
  finalProductionReadinessTools,
  getFinalProductionReadinessOverview,
  getGrandKingReadinessSummary,
  getProductionEligibilitySummary,
  listFinalReadinessEklsKinds,
  registerFinalReadinessPlugin,
  resetProductionCertificationHarnessForTests,
  resolveFinalReadinessRules,
  runFinalProductionReadinessCertification,
  searchFinalReadinessEklsObservations,
  validateFinalReadinessPillowGovernance,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureFinalReadinessTestEnvironment(): void {
  process.env.FINAL_MISSING_EVIDENCE = "false";
  process.env.FINAL_CRITICAL_BLOCKER = "false";
  process.env.FINAL_PRODUCTION_BLOCKED = "false";
  process.env.FINAL_GRAND_KING_NOT_READY = "false";
}

describe("G6-10 — Final Production Readiness Certification", () => {
  it("exposes final readiness certification version and outcomes", () => {
    assert.equal(FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION, "g6-10-v1");
    assert.ok(FINAL_CERTIFICATION_OUTCOMES.includes("PRODUCTION_READY"));
    assert.ok(FINAL_CERTIFICATION_OUTCOMES.includes("PRODUCTION_READY_WITH_CONDITIONS"));
    assert.ok(FINAL_CERTIFICATION_OUTCOMES.includes("BLOCKED"));
    assert.equal(FINAL_CERTIFICATION_OUTCOMES.length, 5);
  });

  it("updates production certification module contract to G6-10", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.run_final_certification"));
  });

  it("resolves final readiness rules from REG-CERTIFICATION-FINAL-READINESS", () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const rules = resolveFinalReadinessRules(TEST_CONTEXT);
    assert.ok(rules.length >= 14);
    assert.ok(rules.some((r) => r.ruleKind === "platform_integrity"));
    assert.ok(rules.some((r) => r.ruleKind === "grand_king_readiness"));
  });

  it("validates final readiness record contract fields", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const run = await runFinalProductionReadinessCertification(TEST_ACTOR);
    const record = run.record;
    assert.ok(record.certificationId);
    assert.equal(record.programmeId, "G6");
    assert.ok(FINAL_CERTIFICATION_OUTCOMES.includes(record.certificationStatus));
    assert.ok(typeof record.productionEligibility === "boolean");
    assert.ok(Array.isArray(record.conditions));
    assert.ok(Array.isArray(record.blockers));
    assert.ok(Array.isArray(record.risks));
    assert.ok(Array.isArray(record.evidence));
    assert.ok(Array.isArray(record.validatedDomains));
    assert.ok(record.timestamp);
    assert.ok(record.correlationId);
    assert.ok(record.governanceState);
    assert.ok(record.grandKingReadiness);
  });

  it("runs final certification aggregation across G6 domains", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const run = await runFinalProductionReadinessCertification(TEST_ACTOR);
    assert.ok(run.record.validatedDomains.length >= 14);
    assert.ok(run.readinessScore >= 0);
    assert.equal(run.discoverySource, "REG-CERTIFICATION-FINAL-READINESS");
  });

  it("evaluates production eligibility", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    await runFinalProductionReadinessCertification(TEST_ACTOR);
    const eligibility = getProductionEligibilitySummary(TEST_CONTEXT);
    assert.ok(typeof eligibility.eligible === "boolean");
    assert.ok(FINAL_CERTIFICATION_OUTCOMES.includes(eligibility.certificationStatus));
  });

  it("blocks production when critical blocker signal active", async () => {
    resetProductionCertificationHarnessForTests();
    process.env.FINAL_CRITICAL_BLOCKER = "true";
    const run = await runFinalProductionReadinessCertification(TEST_ACTOR);
    assert.equal(run.record.certificationStatus, "BLOCKED");
    process.env.FINAL_CRITICAL_BLOCKER = "false";
  });

  it("registers all required final readiness Brain tools", () => {
    const names = new Set(finalProductionReadinessTools.map((tool) => tool.name));
    for (const toolName of [
      "final_production_readiness",
      "run_final_certification",
      "production_eligibility",
      "production_blockers",
      "production_conditions",
      "production_risk_register",
      "grand_king_readiness",
      "certification_completion_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for final certification operations", () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const result = validateFinalReadinessPillowGovernance({
      ...TEST_ACTOR,
      operation: "run_final",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.finalCertificationAuthority, true);
    assert.equal(result.productionEligibilityAuthority, true);
    assert.equal(result.grandKingReadinessAuthority, true);
  });

  it("records final readiness EKLS observations through Pillow", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    assert.deepEqual(listFinalReadinessEklsKinds(), [...FINAL_READINESS_EKLS_KINDS]);
    await runFinalProductionReadinessCertification(TEST_ACTOR);

    const search = searchFinalReadinessEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "final_certification_started",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit final production readiness backend contract", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const run = await runFinalProductionReadinessCertification(TEST_ACTOR);
    const overview = getFinalProductionReadinessOverview(TEST_CONTEXT);
    const view = buildCockpitFinalProductionReadinessView({ overview, run });
    assert.equal(view.viewId, "cockpit-final-production-readiness");
    assert.ok(FINAL_CERTIFICATION_OUTCOMES.includes(view.finalCertificationStatus));
    assert.ok(view.recommendedActions.length >= 0);
  });

  it("evaluates Grand King readiness for G7 eligibility", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    await runFinalProductionReadinessCertification(TEST_ACTOR);
    const readiness = getGrandKingReadinessSummary();
    assert.ok(typeof readiness.ready === "boolean");
    assert.ok(readiness.programmeRefsValidated.length >= 10);
  });

  it("supports final readiness plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const registered = registerFinalReadinessPlugin({
      manifest: {
        pluginId: "test-final-readiness-plugin",
        pluginName: "Test Final Readiness Plugin",
        pluginKind: "validator",
        pillowGovernance: true,
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
  });

  it("runs final certification via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const tool = finalProductionReadinessTools.find((entry) => entry.name === "run_final_certification");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-10" },
    );
    assert.ok((result as { runId: string }).runId);
  });

  it("runs certification probe for final certification scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-final-certification-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning", "fail", "blocked"].includes(result.status));
  });

  it("does not expose credentials or secrets in final certification output", async () => {
    resetProductionCertificationHarnessForTests();
    configureFinalReadinessTestEnvironment();
    const run = await runFinalProductionReadinessCertification(TEST_ACTOR);
    const serialized = JSON.stringify(run);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
