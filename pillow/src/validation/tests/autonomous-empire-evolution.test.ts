import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AEE_CAPABILITIES,
  buildAutonomousEmpireEvolutionConfiguration,
  createAutonomousEmpireEvolution,
  resetAutonomousEmpireEvolutionForTesting,
} from "../../autonomous-empire-evolution/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createAutonomousEmpireEvolution(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectAutonomousEmpireEvolution();
  return { engine, framework };
}

describe("X5-17 Autonomous Empire Evolution", () => {
  beforeEach(resetAutonomousEmpireEvolutionForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildAutonomousEmpireEvolutionConfiguration(REPO_ROOT, {
      neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: false as never,
      neverBypassConstitutionalGovernance: false as never,
    });
    assert.equal(c.neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically, true);
    assert.equal(c.neverBypassConstitutionalGovernance, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-AEE-001 for X5-17", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-17");
    assert.equal(state.engineVersion, "PILLOW-AEE-001");
  });

  test("3 evaluates structures workflows and business models", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.evaluateEnterpriseStructures({ validated: true, targetComponent: "org-structure" }).validation.decision, "pass");
    assert.equal(engine.evaluateEnterpriseWorkflows({ validated: true }).validation.decision, "pass");
    assert.equal(engine.evaluateBusinessModels({ validated: true }).validation.decision, "pass");
  });

  test("4 detects structural workflow and business model opportunities", async () => {
    const { engine } = await buildEngine();
    assert.ok(engine.detectStructuralImprovementOpportunities({ validated: true }).evolutionRecords[0]?.evolutionCategory.includes("structural"));
    assert.ok(engine.detectWorkflowImprovementOpportunities({ validated: true }).evolutionRecords[0]?.evolutionCategory.includes("workflow"));
    assert.ok(engine.detectBusinessModelEvolutionOpportunities({ validated: true }).evolutionRecords[0]?.evolutionCategory.includes("business"));
  });

  test("5 simulates proposed evolutions", async () => {
    const record = (await buildEngine()).engine.simulateProposedEvolutions({
      validated: true,
      expectedImprovement: 25,
      currentState: "v1",
      proposedState: "v2",
    }).evolutionRecords[0]!;
    assert.equal(record.expectedImprovement, 25);
    assert.equal(record.currentState, "v1");
    assert.equal(record.proposedState, "v2");
  });

  test("6 ranks priorities and generates recommendations", async () => {
    const { engine } = await buildEngine();
    engine.rankEvolutionPriorities({ validated: true, priorityScore: 80 });
    assert.equal(engine.generateEvolutionRecommendations().recommendations.length, 1);
  });

  test("7 tracks evolution outcomes", async () => {
    assert.equal((await buildEngine()).engine.trackEvolutionOutcomes({ validated: true }).validation.decision, "pass");
  });

  test("8 never auto-modifies architecture or bypasses governance", async () => {
    const report = (await buildEngine()).engine.evaluateEnterpriseStructures({
      validated: true,
      approvedForArchitectureModification: true,
      bypassConstitutionalGovernance: true,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.evolutionRecords[0]?.approvedForArchitectureModification, false);
    assert.equal(report.evolutionRecords[0]?.neverBypassConstitutionalGovernance, true);
    assert.equal(report.evolutionRecords[0]?.neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically, true);
  });

  test("9 preserves evolution traceability", async () => {
    const record = (await buildEngine()).engine.evaluateEnterpriseWorkflows({ validated: true }).evolutionRecords[0]!;
    assert.ok(record.evolutionTraceId.startsWith("aee-trace-"));
    assert.equal(record.preserveEvolutionTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getEvolutionRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "autonomous-empire-evolution"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(AEE_CAPABILITIES.includes("evolution_validation"));
  });
});
