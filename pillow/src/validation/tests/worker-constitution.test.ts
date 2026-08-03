import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CONSTITUTIONAL_RULES,
  CONSTITUTION_VERSION,
  WCT_CAPABILITIES,
  buildWorkerConstitutionConfiguration,
  createWorkerConstitution,
  resetWorkerConstitutionForTesting,
} from "../../worker-constitution/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerConstitution>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerConstitution(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerConstitution();
  return engine;
}

const exampleWorker = {
  workerId: "wcr-wkr-strategy-01",
  workerName: "Strategy Analyst",
  department: "strategy",
  missionId: "Q1-01",
  lifecycleStage: "active" as const,
  governedByPillow: true,
  followsExecutiveInstructions: true,
  neverBypassesPillow: true,
  withinAuthority: true,
  reportsAllWork: true,
  preservesAuditHistory: true,
  preservesTraceability: true,
  followsQualityStandard: true,
  followsSelfCritiqueProtocol: true,
  participatesPeerReviewWhenRequired: true,
  usesApprovedToolsOnly: true,
  escalatesBeyondAuthority: true,
  remainsCertifiable: true,
  validated: true,
};

describe("Q1-01 Worker Constitution", () => {
  beforeEach(resetWorkerConstitutionForTesting);

  test("1 locks mandatory worker-constitution boundaries", () => {
    const c = buildWorkerConstitutionConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkerQualityStandard: false as never,
      neverReplaceGovernance: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkerQualityStandard, true);
    assert.equal(c.neverReplaceGovernance, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WCT-001 for Q1-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-01");
    assert.equal(state.engineVersion, "PILLOW-WCT-001");
    assert.equal(state.health.constitutionVersion, CONSTITUTION_VERSION);
    for (const rule of CONSTITUTIONAL_RULES) {
      assert.ok(state.configuration.constitutionalRules.includes(rule));
    }
  });

  test("3 creates Worker Constitution definition", async () => {
    const report = (await build()).defineConstitution({ validated: true });
    assert.equal(report.action, "define_constitution");
    assert.ok(report.constitution);
    assert.equal(report.constitution!.constitutionVersion, CONSTITUTION_VERSION);
    assert.ok(report.constitution!.workerIdentity);
    assert.ok(report.constitution!.workerPurpose);
    assert.ok(report.constitution!.workerResponsibilities.length > 0);
    assert.ok(report.constitution!.constitutionalRules.length >= CONSTITUTIONAL_RULES.length);
  });

  test("4 example worker inherits the constitution", async () => {
    const report = (await build()).inheritWorker(exampleWorker);
    assert.equal(report.inheritanceRecords.length, 1);
    const record = report.inheritanceRecords[0]!;
    assert.equal(record.inherited, true);
    assert.equal(record.workerId, "wcr-wkr-strategy-01");
    assert.equal(record.constitutionVersion, CONSTITUTION_VERSION);
    assert.equal(record.complianceDecision, "compliant");
    assert.ok(record.inheritanceId.startsWith("wct-inh-"));
    assert.equal(record.rulesFailed.length, 0);
  });

  test("5 validates constitutional compliance and detects violations", async () => {
    const engine = await build();
    const ok = engine.validateCompliance(exampleWorker);
    assert.equal(ok.complianceDecision, "compliant");

    const bad = engine.validateCompliance({
      ...exampleWorker,
      workerId: "wcr-wkr-rogue-99",
      neverBypassesPillow: false,
      withinAuthority: false,
      reportsAllWork: false,
      followsQualityStandard: false,
      followsSelfCritiqueProtocol: false,
      usesApprovedToolsOnly: false,
      remainsCertifiable: false,
      violatedRules: [
        "never_bypass_pillow",
        "never_execute_outside_authority",
        "report_all_work",
        "follow_worker_quality_standard",
        "follow_worker_self_critique_protocol",
        "use_approved_tools_only",
        "remain_certifiable",
      ],
    });
    assert.equal(bad.complianceDecision, "non_compliant");
    assert.ok(bad.rulesFailed.includes("never_bypass_pillow"));
    assert.ok(bad.rulesFailed.includes("follow_worker_quality_standard"));
  });

  test("6 produces machine-readable constitution output", async () => {
    const report = (await build()).produceConstitution({ validated: true });
    const constitution = report.constitution!;
    assert.ok(constitution.constitutionVersion);
    assert.ok(constitution.workerIdentity);
    assert.ok(constitution.workerPurpose);
    assert.ok(Array.isArray(constitution.workerResponsibilities));
    assert.ok(Array.isArray(constitution.workerAuthority));
    assert.ok(Array.isArray(constitution.workerRestrictions));
    assert.ok(Array.isArray(constitution.workerObligations));
    assert.ok(Array.isArray(constitution.communicationStandards));
    assert.ok(Array.isArray(constitution.reportingStandards));
    assert.ok(Array.isArray(constitution.qualityStandards));
    assert.ok(Array.isArray(constitution.governanceStandards));
    assert.ok(Array.isArray(constitution.escalationStandards));
    assert.ok(Array.isArray(constitution.auditStandards));
    assert.ok(Array.isArray(constitution.traceabilityStandards));
    assert.equal(constitution.metadataVersion, "WCT-001-v1");
  });

  test("7 rejects execute / WQS / governance / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.inheritWorker({ ...exampleWorker, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateCompliance({
        ...exampleWorker,
        replaceWorkerQualityStandard: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.defineConstitution({ validated: true, replaceGovernance: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceConstitution({ validated: true, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.inheritWorker({ ...exampleWorker, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(WCT_CAPABILITIES.includes("inherit_constitution_to_worker"));
  });

  test("8 supports extensible constitutional rules", async () => {
    const engine = await build({
      configuration: {
        constitutionalRules: [...CONSTITUTIONAL_RULES, "department_specific_ethics"],
      },
    });
    assert.ok(
      engine.getState().configuration.constitutionalRules.includes("department_specific_ethics"),
    );
  });

  test("9 getConstitution returns authoritative machine-readable definition", async () => {
    const engine = await build();
    engine.defineConstitution({ validated: true });
    const constitution = engine.getConstitution()!;
    assert.equal(constitution.neverOverridePillow, true);
    assert.equal(constitution.neverExecuteWorkerTasks, true);
    assert.ok(constitution.constitutionalRules.includes("governed_by_pillow"));
  });

  test("10 validates inheritance records remain governed and non-executing", async () => {
    const engine = await build();
    engine.inheritWorker(exampleWorker);
    const validation = engine.validateWorkerConstitution({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const record = engine.getLatestRecord()!;
    assert.equal(record.inherited, true);
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.workerQualityStandardReplaced, false);
    assert.equal(record.governanceReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "WCT-001-v1");
  });
});
