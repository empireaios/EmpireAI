import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  OPBK_CAPABILITIES,
  PLAYBOOK_CATEGORIES,
  buildOperationalPlaybookEngineConfiguration,
  createOperationalPlaybookEngine,
  resetOperationalPlaybookEngineForTesting,
} from "../../operational-playbook-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createOperationalPlaybookEngine(bootstrap);
  await engine.initialize();
  engine.connectOperationalPlaybookEngine();
  return engine;
}

describe("Q0-15 Operational Playbook Engine", () => {
  beforeEach(resetOperationalPlaybookEngineForTesting);

  test("1 locks mandatory operational-playbook-engine boundaries", () => {
    const c = buildOperationalPlaybookEngineConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkers: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkers, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-OPBK-001 for Q0-15", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-15");
    assert.equal(state.engineVersion, "PILLOW-OPBK-001");
    for (const category of PLAYBOOK_CATEGORIES) {
      assert.ok(state.configuration.supportedCategories.includes(category));
    }
  });

  test("3 registers and retrieves a playbook", async () => {
    const engine = await build();
    const registered = engine.registerPlaybook({
      validated: true,
      playbook: {
        playbookId: "opbk-test-commerce-001",
        version: "1.0.0",
        category: "commerce",
        name: "Commerce Order Intake",
        purpose: "Standardize commerce order intake",
        preconditions: ["order_received"],
        executionSteps: [
          { stepId: "s1", order: 1, action: "Validate order payload", requiredCapability: "process_coordination", requiredTool: "metrics_console" },
          { stepId: "s2", order: 2, action: "Prepare fulfillment handoff", requiredCapability: "handoff_management", requiredTool: "mission_planner" },
        ],
        requiredCapabilities: ["process_coordination", "handoff_management"],
        requiredTools: ["metrics_console", "mission_planner"],
        approvalRequirements: ["pillow_approval"],
        successCriteria: ["order_validated"],
        failureCriteria: ["invalid_order"],
        approved: true,
        active: true,
      },
    }).selectedPlaybook!;
    assert.equal(registered.playbookId, "opbk-test-commerce-001");
    assert.equal(registered.category, "commerce");

    const retrieved = engine.retrievePlaybook({
      playbookId: "opbk-test-commerce-001",
      validated: true,
    }).selectedPlaybook!;
    assert.equal(retrieved.name, "Commerce Order Intake");
  });

  test("4 validates playbook integrity", async () => {
    const report = (await build()).validatePlaybook({
      playbookId: "opbk-mktplace-listing-001",
      validated: true,
    });
    assert.ok(report.validation.decision === "pass" || report.validation.decision === "partial");
    assert.equal(report.selectedPlaybook?.playbookId, "opbk-mktplace-listing-001");
  });

  test("5 selects an appropriate playbook from intent", async () => {
    const report = (await build()).selectPlaybook({
      intent: "Launch marketplace listing with compliance checks",
      category: "marketplace",
      validated: true,
    });
    assert.ok(report.selectedPlaybook);
    assert.equal(report.selectedPlaybook!.category, "marketplace");
    assert.ok(report.workflow);
    assert.ok(report.workflow!.steps.length >= 1);
  });

  test("6 generates executable workflow and execution record", async () => {
    const report = (await build()).prepareWorkflow({
      playbookId: "opbk-mktg-campaign-001",
      intent: "Activate approved marketing campaign",
      validated: true,
    });
    const execution = report.executions[0]!;
    assert.ok(execution.executionId.startsWith("opbk-exec-"));
    assert.equal(execution.playbookId, "opbk-mktg-campaign-001");
    assert.ok(execution.workflow.steps.length >= 2);
    assert.equal(execution.workerTasksExecuted, false);
    assert.equal(execution.metadataVersion, "OPBK-001-v1");
  });

  test("7 tracks playbook execution progress without executing worker tasks", async () => {
    const engine = await build();
    const prepared = engine.prepareWorkflow({
      playbookId: "opbk-fin-close-001",
      intent: "Run finance close checklist",
      validated: true,
    }).executions[0]!;
    const tracked = engine.trackProgress({
      executionId: prepared.executionId,
      progressStepId: prepared.workflow.steps[0]!.stepId,
      progressStatus: "completed",
      validated: true,
    }).executions[0]!;
    assert.ok(tracked.completedStepIds.includes(prepared.workflow.steps[0]!.stepId));
    assert.equal(tracked.workerTasksExecuted, false);
    assert.equal(tracked.neverReplaceWorkforceOrchestrator, true);
  });

  test("8 rejects execute / replace workers / replace orchestrator / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = { playbookId: "opbk-biz-intake-001", validated: true as const };
    assert.equal(engine.prepareWorkflow({ ...base, executeWorkerTasks: true }).validation.decision, "fail");
    assert.equal(engine.prepareWorkflow({ ...base, replaceWorkers: true }).validation.decision, "fail");
    assert.equal(engine.prepareWorkflow({ ...base, replaceWorkforceOrchestrator: true }).validation.decision, "fail");
    assert.equal(engine.prepareWorkflow({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.prepareWorkflow({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 supports extensible playbook categories", async () => {
    const engine = createOperationalPlaybookEngine(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { supportedCategories: [...PLAYBOOK_CATEGORIES, "supply_chain"] } },
    );
    await engine.initialize();
    engine.connectOperationalPlaybookEngine();
    assert.ok(engine.getState().configuration.supportedCategories.includes("supply_chain"));
    assert.ok(OPBK_CAPABILITIES.includes("extensible_playbook_types"));
    const registered = engine.registerPlaybook({
      validated: true,
      playbook: {
        playbookId: "opbk-supply-001",
        category: "supply_chain",
        name: "Supply Chain Reorder",
        purpose: "Reorder inventory through approved SOP",
        executionSteps: [{ stepId: "s1", order: 1, action: "Prepare reorder workflow" }],
        approved: true,
        active: true,
      },
    }).selectedPlaybook!;
    assert.equal(registered.category, "supply_chain");
  });

  test("10 validates stored execution records", async () => {
    const engine = await build();
    engine.prepareWorkflow({
      playbookId: "opbk-ops-incident-001",
      intent: "Stabilize operations incident",
      validated: true,
    });
    const validation = engine.validateEngine({ validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.ok(engine.getExecutions().length >= 1);
    assert.equal(engine.getLatestExecution()?.neverOverrideGrandKing, true);
  });
});
