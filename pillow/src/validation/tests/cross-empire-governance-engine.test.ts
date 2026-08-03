import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildCrossEmpireGovernanceEngineConfiguration,
  CEG_CAPABILITIES,
  createCrossEmpireGovernanceEngine,
  resetCrossEmpireGovernanceEngineForTesting,
} from "../../cross-empire-governance-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createCrossEmpireGovernanceEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectCrossEmpireGovernanceEngine();
  return { engine, framework };
}

describe("X5-11 Cross-Empire Governance Engine", () => {
  beforeEach(resetCrossEmpireGovernanceEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildCrossEmpireGovernanceEngineConfiguration(REPO_ROOT, {
      neverBypassConstitutionalGovernance: false as never,
      neverApproveNonCompliantOperationsAutomatically: false as never,
    });
    assert.equal(c.neverBypassConstitutionalGovernance, true);
    assert.equal(c.neverApproveNonCompliantOperationsAutomatically, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-CEG-001 for X5-11", async () => {
    assert.equal((await buildEngine()).engine.getState().missionId, "X5-11");
    assert.equal((await buildEngine()).engine.getState().engineVersion, "PILLOW-CEG-001");
  });

  test("3 manages enterprise governance policies", async () => {
    const report = (await buildEngine()).engine.manageEnterpriseGovernancePolicies({
      validated: true,
      companyReference: "Alpha Holdings",
      governanceCategory: "enterprise policy",
    });
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.governanceRecords[0]?.governanceCategory.includes("policy") || report.governanceRecords[0]?.governanceCategory === "enterprise policy", true);
  });

  test("4 manages constitutional rules", async () => {
    const record = (await buildEngine()).engine.manageConstitutionalRules({
      validated: true,
      constitutionalRuleReference: "CONST-CORE-010",
    }).governanceRecords[0]!;
    assert.equal(record.constitutionalRuleReference, "CONST-CORE-010");
    assert.equal(record.neverBypassConstitutionalGovernance, true);
  });

  test("5 validates governance compliance", async () => {
    const report = (await buildEngine()).engine.validateGovernanceCompliance({
      validated: true,
      complianceScore: 90,
    });
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.governanceRecords[0]?.complianceStatus, "compliant");
  });

  test("6 detects violations and policy conflicts", async () => {
    const { engine } = await buildEngine();
    const violation = engine.detectGovernanceViolations({ validated: true, violationHint: true, complianceScore: 20 });
    assert.equal(violation.governanceRecords[0]?.complianceStatus, "non_compliant");
    const conflict = engine.detectPolicyConflicts({ validated: true, policyConflictHint: true });
    assert.ok(["moderate", "elevated", "critical"].includes(conflict.governanceRecords[0]?.riskLevel ?? ""));
  });

  test("7 evaluates risks and monitors consistency", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.evaluateGovernanceRisks({ validated: true, riskHint: "elevated" }).governanceRecords[0]?.riskLevel, "elevated");
    assert.equal(engine.monitorGovernanceConsistency({ validated: true }).validation.decision, "pass");
  });

  test("8 generates governance recommendations", async () => {
    const { engine } = await buildEngine();
    engine.detectGovernanceViolations({ validated: true, violationHint: true, complianceScore: 10 });
    assert.equal(engine.generateGovernanceRecommendations().recommendations.length, 1);
  });

  test("9 never approves non-compliant operations automatically", async () => {
    const record = (await buildEngine()).engine.detectGovernanceViolations({
      validated: true,
      violationHint: true,
      approveNonCompliant: true,
      complianceScore: 5,
    }).governanceRecords[0]!;
    assert.equal(record.approvedNonCompliantOperation, false);
    assert.equal(record.neverApproveNonCompliantOperationsAutomatically, true);
    assert.equal(record.neverBypassConstitutionalGovernance, true);
    assert.ok(record.governanceTraceId.startsWith("ceg-trace-"));
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getGovernanceRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "cross-empire-governance-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(CEG_CAPABILITIES.includes("governance_validation"));
  });
});
