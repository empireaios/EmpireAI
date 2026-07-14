import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PLATFORM_INTEGRITY_CERTIFICATION_VERSION,
  PLATFORM_INTEGRITY_EKLS_KINDS,
  PLATFORM_INTEGRITY_RESULT_STATES,
  buildCockpitPlatformIntegrityView,
  createProductionCertificationModuleContract,
  detectArchitecturalDrift,
  detectCircularDependencies,
  detectDuplicateOwnership,
  detectInvalidOwnership,
  detectMissingOwnership,
  getPlatformIntegrityOverview,
  listPlatformIntegrityEklsKinds,
  listPlatformIntegritySubsystems,
  platformIntegrityTools,
  recordPlatformIntegrityEklsObservation,
  registerPlatformIntegrityPlugin,
  resetProductionCertificationHarnessForTests,
  resolvePlatformIntegrityRules,
  runPlatformIntegrityScan,
  searchPlatformIntegrityEklsObservations,
  validateDependencyRules,
  validateOwnershipRules,
  validatePlatformIntegrityPillowGovernance,
  validateProgrammeIntegrity,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G6-01 — Platform Integrity Certification", () => {
  it("exposes platform integrity version and result states", () => {
    assert.equal(PLATFORM_INTEGRITY_CERTIFICATION_VERSION, "g6-01-v1");
    assert.ok(PLATFORM_INTEGRITY_RESULT_STATES.includes("pass"));
    assert.ok(PLATFORM_INTEGRITY_RESULT_STATES.includes("blocked"));
    assert.equal(PLATFORM_INTEGRITY_RESULT_STATES.length, 5);
  });

  it("updates production certification module contract for G6 programme integrity", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.platform_integrity_scan"));
  });

  it("resolves platform integrity rules from REG-CERTIFICATION-INTEGRITY", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolvePlatformIntegrityRules(TEST_CONTEXT);
    assert.ok(rules.length >= 15);
    assert.ok(rules.some((rule) => rule.ruleKind === "ownership"));
    assert.ok(rules.some((rule) => rule.ruleKind === "dependency"));
    assert.ok(rules.some((rule) => rule.ruleKind === "drift"));
    const subsystems = listPlatformIntegritySubsystems(TEST_CONTEXT);
    assert.ok(subsystems.includes("commerce"));
    assert.ok(subsystems.includes("brain"));
  });

  it("validates ownership rules without hardcoded programme lists", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolvePlatformIntegrityRules(TEST_CONTEXT);
    const { matrix } = validateOwnershipRules(rules);
    assert.ok(matrix.length >= 8);
    assert.equal(detectMissingOwnership(rules).length, 0);
    assert.equal(detectInvalidOwnership(rules).length, 0);
    assert.equal(detectDuplicateOwnership(rules).length, 0);
  });

  it("validates dependency rules and detects circular dependencies", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolvePlatformIntegrityRules(TEST_CONTEXT);
    const { matrix, violations } = validateDependencyRules(rules);
    assert.ok(matrix.length >= 1);
    const cycles = detectCircularDependencies(matrix);
    assert.equal(Array.isArray(cycles), true);
    assert.equal(Array.isArray(violations), true);
  });

  it("detects architectural drift through registry-driven rules", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolvePlatformIntegrityRules(TEST_CONTEXT);
    const drift = detectArchitecturalDrift(rules);
    assert.equal(Array.isArray(drift), true);
  });

  it("validates programme integrity for G2, G5, G6 registry rules", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolvePlatformIntegrityRules(TEST_CONTEXT);
    const programmes = validateProgrammeIntegrity(rules);
    const g2 = programmes.find((entry) => entry.programmeRef === "G2");
    const g5 = programmes.find((entry) => entry.programmeRef === "G5");
    const g6 = programmes.find((entry) => entry.programmeRef === "G6");
    assert.equal(g2?.status, "pass");
    assert.equal(g5?.status, "pass");
    assert.equal(g6?.status, "pass");
  });

  it("registers all required platform integrity Brain tools", () => {
    const names = new Set(platformIntegrityTools.map((tool) => tool.name));
    for (const toolName of [
      "platform_integrity_overview",
      "platform_integrity_scan",
      "ownership_matrix",
      "dependency_matrix",
      "architecture_drift_report",
      "platform_integrity_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for platform integrity operations", () => {
    resetProductionCertificationHarnessForTests();
    const result = validatePlatformIntegrityPillowGovernance({
      ...TEST_ACTOR,
      operation: "scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.certificationAuthority, true);
    assert.equal(result.ownershipAuthority, true);
    assert.equal(result.constitutionalCompliance, true);
  });

  it("runs platform integrity scan and produces matrices", () => {
    resetProductionCertificationHarnessForTests();
    const scan = runPlatformIntegrityScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["pass", "pass_with_conditions", "warning", "fail", "blocked"].includes(scan.status));
    assert.ok(scan.ownershipMatrix.length >= 8);
    assert.ok(scan.dependencyMatrix.length >= 1);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-INTEGRITY");

    const overview = getPlatformIntegrityOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
    assert.equal(overview.lastStatus, scan.status);
  });

  it("records platform integrity EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    assert.deepEqual(listPlatformIntegrityEklsKinds(), [...PLATFORM_INTEGRITY_EKLS_KINDS]);

    const scan = runPlatformIntegrityScan(TEST_ACTOR);
    void scan;

    const recorded = recordPlatformIntegrityEklsObservation({
      ...TEST_ACTOR,
      scanId: "scan-ekls-test-001",
      kind: "integrity_certified",
      summary: "Platform integrity certified in test",
      pillowGovernance: true,
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);

    const search = searchPlatformIntegrityEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "integrity_certified",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit platform integrity backend contract", () => {
    resetProductionCertificationHarnessForTests();
    const scan = runPlatformIntegrityScan(TEST_ACTOR);
    const overview = getPlatformIntegrityOverview(TEST_CONTEXT);
    const view = buildCockpitPlatformIntegrityView({ overview, scan });
    assert.equal(view.viewId, "cockpit-platform-integrity");
    assert.equal(view.dataMode, "live");
    assert.ok(view.architectureHealth.label.includes("Architecture health"));
    assert.equal(view.ownershipMatrix.length, scan.ownershipMatrix.length);
    assert.equal(view.dependencyMatrix.length, scan.dependencyMatrix.length);
    assert.equal(view.certificationStatus, scan.status);
    assert.equal(view.riskSummary.violationCount, scan.violations.length);
  });

  it("supports integrity validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    const registered = registerPlatformIntegrityPlugin({
      manifest: {
        pluginId: "test-integrity-plugin",
        pluginName: "Test Integrity Plugin",
        validatorKind: "integrity",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-integrity-plugin",
        validatorKind: "integrity",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);

    const scan = runPlatformIntegrityScan(TEST_ACTOR);
    assert.ok(scan.scanId);
  });

  it("runs platform integrity scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    const tool = platformIntegrityTools.find((entry) => entry.name === "platform_integrity_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      {
        workspaceId: TEST_ACTOR.workspaceId,
        actorId: TEST_ACTOR.actorId,
      },
      {
        workspaceId: TEST_ACTOR.workspaceId,
        agentId: "test-agent",
        correlationId: "corr-g6-01",
      },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for platform integrity scan check", async () => {
    resetProductionCertificationHarnessForTests();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-platform-integrity-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });
});
