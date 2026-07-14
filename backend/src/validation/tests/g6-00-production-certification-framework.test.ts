import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CERTIFICATION_DOMAINS,
  CERTIFICATION_EKLS_OBSERVATION_KINDS,
  CERTIFICATION_RESULT_STATES,
  PRODUCTION_CERTIFICATION_VERSION,
  assertNoSecretsInEvidence,
  buildRedactedCertificationEvidence,
  createCockpitCertificationRouteRegistration,
  createProductionCertificationModuleContract,
  deriveOverallCertificationStatus,
  getCertificationOverview,
  listCertificationEklsObservationKinds,
  listCertificationRegistryIds,
  productionCertificationTools,
  recordCertificationEklsObservation,
  resetProductionCertificationHarnessForTests,
  resolveCertificationRegistrySnapshot,
  runCertificationCheck,
  runFullCertification,
  scoreCertificationStatus,
  searchCertificationEklsObservations,
  validateCertificationPillowGovernance,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G6-00 — Production Certification Framework", () => {
  it("exposes certification result states and framework version", () => {
    assert.equal(PRODUCTION_CERTIFICATION_VERSION, "g6-00-v1");
    assert.ok(CERTIFICATION_RESULT_STATES.includes("pass"));
    assert.ok(CERTIFICATION_RESULT_STATES.includes("blocked"));
    assert.equal(CERTIFICATION_RESULT_STATES.length, 8);
  });

  it("registers production-certification Brain module contract", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.moduleId, "production-certification");
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.run_full"));
    assert.ok(contract.integratesWith.includes("pillow"));
    assert.ok(contract.integratesWith.includes("ekls"));
  });

  it("resolves certification registries dynamically without hardcoded gates", () => {
    resetProductionCertificationHarnessForTests();
    const ids = listCertificationRegistryIds();
    assert.equal(ids.length, 13);
    assert.ok(ids.includes("REG-CERTIFICATION-PERFORMANCE"));
    assert.ok(ids.includes("REG-CERTIFICATION-EXECUTIVE"));
    assert.ok(ids.includes("REG-CERTIFICATION-FAILURE-RECOVERY"));
    assert.ok(ids.includes("REG-CERTIFICATION-SIMULATION"));
    assert.ok(ids.includes("REG-CERTIFICATION-FINAL-READINESS"));
    assert.ok(ids.includes("REG-CERTIFICATION-DEPLOYMENT"));
    assert.ok(ids.includes("REG-CERTIFICATION-DOMAIN"));
    assert.ok(ids.includes("REG-CERTIFICATION-CHECK"));
    assert.ok(ids.includes("REG-CERTIFICATION-GATE"));
    assert.ok(ids.includes("REG-CERTIFICATION-INTEGRITY"));
    assert.ok(ids.includes("REG-CERTIFICATION-SECURITY"));

    const snapshot = resolveCertificationRegistrySnapshot(TEST_CONTEXT);
    assert.equal(snapshot.domains.length, CERTIFICATION_DOMAINS.length);
    assert.ok(snapshot.checks.length >= CERTIFICATION_DOMAINS.length);
    assert.equal(snapshot.gates.length, CERTIFICATION_DOMAINS.length);
  });

  it("registers all required Brain certification tools", () => {
    const names = new Set(productionCertificationTools.map((tool) => tool.name));
    for (const toolName of [
      "certification_overview",
      "run_certification_check",
      "run_certification_domain",
      "run_full_certification",
      "certification_status",
      "certification_blockers",
      "certification_risk_register",
      "certification_evidence",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
    assert.equal(
      productionCertificationTools.every((tool) => tool.module === "production-certification"),
      true,
    );
  });

  it("validates certification contract scoring", () => {
    assert.equal(scoreCertificationStatus("pass"), 100);
    assert.equal(scoreCertificationStatus("fail"), 0);
    assert.equal(
      deriveOverallCertificationStatus([
        {
          certificationId: "c1",
          domain: "security",
          checkId: "cert-check-security-redaction",
          checkName: "Security",
          scope: "domain:security",
          status: "pass",
          severity: "critical",
          evidence: [],
          blockers: [],
          risks: [],
          recommendations: [],
          owner: "pillow:governance",
          timestamp: new Date().toISOString(),
          correlationId: "corr-1",
          governanceState: "production_eligible",
          score: 100,
        },
        {
          certificationId: "c2",
          domain: "security",
          checkId: "cert-check-x",
          checkName: "X",
          scope: "domain:security",
          status: "blocked",
          severity: "critical",
          evidence: [],
          blockers: [],
          risks: [],
          recommendations: [],
          owner: "pillow:governance",
          timestamp: new Date().toISOString(),
          correlationId: "corr-1",
          governanceState: "production_blocked",
          score: 0,
        },
      ]),
      "blocked",
    );
  });

  it("redacts secrets from certification evidence", () => {
    const evidence = buildRedactedCertificationEvidence({
      evidenceId: "ev-redact-1",
      kind: "redacted",
      summary: "Redaction test",
      metadata: { api_key: "sk_live_secret_value", safe: "ok" },
    });
    assert.equal(evidence.metadata?.api_key, "[REDACTED]");
    assert.equal(evidence.metadata?.safe, "ok");
    const validation = assertNoSecretsInEvidence([evidence]);
    assert.equal(validation.valid, true);
  });

  it("passes Pillow governance for certification operations", () => {
    resetProductionCertificationHarnessForTests();
    const result = validateCertificationPillowGovernance({
      ...TEST_ACTOR,
      operation: "run_full",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.certificationAuthority, true);
    assert.equal(result.evidenceIntegrity, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("runs a single registry-defined certification check", async () => {
    resetProductionCertificationHarnessForTests();
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-security-redaction",
      ...TEST_ACTOR,
    });
    assert.equal(result.status, "pass");
    assert.equal(result.checkId, "cert-check-security-redaction");
    assert.ok(result.evidence.length >= 1);
  });

  it("records certification EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    assert.deepEqual(listCertificationEklsObservationKinds(), [
      ...CERTIFICATION_EKLS_OBSERVATION_KINDS,
    ]);

    const recorded = recordCertificationEklsObservation({
      ...TEST_ACTOR,
      runId: "run-ekls-test-001",
      kind: "certification_evidence_recorded",
      summary: "Evidence recorded for certification probe",
      pillowGovernance: true,
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);

    const search = searchCertificationEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      runId: "run-ekls-test-001",
      pillowGovernance: true,
    });
    assert.equal(search.length, 1);
  });

  it("runs full certification and produces overview", async () => {
    resetProductionCertificationHarnessForTests();
    const overviewBefore = getCertificationOverview(TEST_CONTEXT);
    assert.equal(overviewBefore.domainCount, CERTIFICATION_DOMAINS.length);

    const run = await runFullCertification(TEST_ACTOR);
    assert.ok(run.runId);
    assert.ok(run.overallScore >= 0);
    assert.ok(["pass", "pass_with_conditions", "warning", "fail", "blocked"].includes(run.overallStatus));

    const overviewAfter = getCertificationOverview(TEST_CONTEXT);
    assert.equal(overviewAfter.lastRunId, run.runId);
  });

  it("exposes Cockpit backend contract without UI implementation", () => {
    const route = createCockpitCertificationRouteRegistration();
    assert.equal(route.backendContractOnly, true);
    assert.equal(route.presentationDeferred, true);
    assert.equal(route.futureMission, "G6-01+");
  });
});
