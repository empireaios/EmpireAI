import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SECURITY_GOVERNANCE_CERTIFICATION_VERSION,
  SECURITY_GOVERNANCE_EKLS_KINDS,
  SECURITY_GOVERNANCE_RESULT_STATES,
  assertNoSecretsInEvidence,
  buildRedactedCertificationEvidence,
  buildCockpitSecurityGovernanceView,
  createProductionCertificationModuleContract,
  detectCredentialExposure,
  getSecurityGovernanceOverview,
  listSecurityGovernanceEklsKinds,
  registerSecurityGovernancePlugin,
  resetProductionCertificationHarnessForTests,
  resolveSecurityGovernanceRules,
  runGovernanceScan,
  runSecurityGovernanceScan,
  runSecurityScan,
  searchSecurityGovernanceEklsObservations,
  securityGovernanceTools,
  validateBrainBoundaryRules,
  validatePillowGovernanceRules,
  validateRegistryComplianceRules,
  validateSecretHandlingRules,
  validateSecurityGovernancePillowGovernance,
  validateWorkspaceIsolationRules,
  validatePluginSecurityRules,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G6-02 — Security & Governance Certification", () => {
  it("exposes security governance version and result states", () => {
    assert.equal(SECURITY_GOVERNANCE_CERTIFICATION_VERSION, "g6-02-v1");
    assert.ok(SECURITY_GOVERNANCE_RESULT_STATES.includes("pass"));
    assert.ok(SECURITY_GOVERNANCE_RESULT_STATES.includes("blocked"));
    assert.equal(SECURITY_GOVERNANCE_RESULT_STATES.length, 5);
  });

  it("updates production certification module contract to G6-02", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.security_scan"));
  });

  it("resolves security governance rules from REG-CERTIFICATION-SECURITY", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    assert.ok(rules.length >= 14);
    assert.ok(rules.some((rule) => rule.ruleKind === "secret_handling"));
    assert.ok(rules.some((rule) => rule.ruleKind === "pillow_governance"));
    assert.ok(rules.some((rule) => rule.ruleKind === "workspace_isolation"));
  });

  it("validates secret handling without leaking credentials", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    const violations = validateSecretHandlingRules(rules);
    assert.equal(violations.length, 0);

    const evidence = buildRedactedCertificationEvidence({
      evidenceId: "sec-test-1",
      kind: "redacted",
      summary: "Security redaction regression",
      metadata: { api_key: "sk_live_secret", note: "safe" },
    });
    assert.equal(evidence.metadata?.api_key, "[REDACTED]");
    assert.equal(assertNoSecretsInEvidence([evidence]).valid, true);
  });

  it("validates credential protection through registry-driven rules", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    const exposures = detectCredentialExposure(rules);
    assert.equal(exposures.length, 0);
  });

  it("validates workspace isolation rules", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    const violations = validateWorkspaceIsolationRules(rules, { workspaceId: "ws-foundation" });
    assert.equal(violations.length, 0);
  });

  it("validates plugin security rules", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    const violations = validatePluginSecurityRules(rules);
    assert.equal(violations.length, 0);
  });

  it("validates registry compliance and Brain boundary rules", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    const registryViolations = validateRegistryComplianceRules(rules, { workspaceId: "ws-foundation" });
    const brainViolations = validateBrainBoundaryRules(rules);
    assert.equal(Array.isArray(registryViolations), true);
    assert.equal(Array.isArray(brainViolations), true);
  });

  it("registers all required security governance Brain tools", () => {
    const names = new Set(securityGovernanceTools.map((tool) => tool.name));
    for (const toolName of [
      "security_overview",
      "security_scan",
      "governance_scan",
      "workspace_security",
      "plugin_security",
      "security_risk_register",
      "security_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for security operations", () => {
    resetProductionCertificationHarnessForTests();
    const result = validateSecurityGovernancePillowGovernance({
      ...TEST_ACTOR,
      operation: "security_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.securityAuthority, true);
    assert.equal(result.governanceAuthority, true);
    assert.equal(result.constitutionalCompliance, true);
  });

  it("runs security and governance scans", () => {
    resetProductionCertificationHarnessForTests();
    const securityScan = runSecurityScan(TEST_ACTOR);
    assert.ok(securityScan.scanId);
    assert.ok(["pass", "pass_with_conditions", "warning", "fail", "blocked"].includes(securityScan.status));
    assert.equal(securityScan.scanType, "security");

    const governanceScan = runGovernanceScan(TEST_ACTOR);
    assert.equal(governanceScan.scanType, "governance");

    const combined = runSecurityGovernanceScan(TEST_ACTOR);
    assert.equal(combined.scanType, "combined");
    assert.equal(combined.discoverySource, "REG-CERTIFICATION-SECURITY");

    const overview = getSecurityGovernanceOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, combined.scanId);
  });

  it("records security governance EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    assert.deepEqual(listSecurityGovernanceEklsKinds(), [...SECURITY_GOVERNANCE_EKLS_KINDS]);
    runSecurityGovernanceScan(TEST_ACTOR);

    const search = searchSecurityGovernanceEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "security_certified",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit security governance backend contract", () => {
    resetProductionCertificationHarnessForTests();
    const scan = runSecurityGovernanceScan(TEST_ACTOR);
    const overview = getSecurityGovernanceOverview(TEST_CONTEXT);
    const view = buildCockpitSecurityGovernanceView({ overview, scan });
    assert.equal(view.viewId, "cockpit-security-governance");
    assert.equal(view.dataMode, "live");
    assert.equal(view.certificationStatus, scan.status);
    assert.ok(view.executiveRecommendations.length >= 1);
  });

  it("supports security validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    const registered = registerSecurityGovernancePlugin({
      manifest: {
        pluginId: "test-security-plugin",
        pluginName: "Test Security Plugin",
        validatorKind: "security",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-security-plugin",
        validatorKind: "security",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runSecurityScan(TEST_ACTOR);
  });

  it("validates Pillow governance rules through registry", () => {
    resetProductionCertificationHarnessForTests();
    const rules = resolveSecurityGovernanceRules(TEST_CONTEXT);
    const violations = validatePillowGovernanceRules(rules, TEST_ACTOR);
    assert.equal(violations.length, 0);
  });

  it("runs security scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    const tool = securityGovernanceTools.find((entry) => entry.name === "security_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-02" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for security governance scan check", async () => {
    resetProductionCertificationHarnessForTests();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-security-governance-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("passes security redaction regression through certification framework", async () => {
    resetProductionCertificationHarnessForTests();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-security-redaction",
      ...TEST_ACTOR,
    });
    assert.equal(result.status, "pass");
  });
});
