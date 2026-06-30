import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { parseCommandIntent } from "../../command/intent-parser.js";
import { buildExecutionPlan } from "../../command/plan-builder.js";
import { loadContextAwareness } from "../../command/context-awareness.js";
import { runPillowMasterAudit } from "../../master-audit/engine.js";
import {
  startPillow,
  requirePillowCommand,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-015 Grand King Command Interface", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Command Interface initializes with architecture contract", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.command.getState();
    assert.equal(state.engineVersion, "PILLOW-015");
    assert.equal(state.contractPath, "PILLOW_ARCHITECTURE_CONTRACT.md");
  });

  test("Natural language intents parsed correctly", () => {
    assert.equal(parseCommandIntent("What's next?").intent, "whats_next");
    assert.equal(parseCommandIntent("Recover Cursor").intent, "recover_cursor");
    assert.equal(parseCommandIntent("Pause autonomous work").intent, "pause_autonomous");
    assert.equal(parseCommandIntent("Generate Cursor mission").intent, "generate_cursor_mission");
    assert.equal(parseCommandIntent("Review Empire health").intent, "review_empire_health");
  });

  test("Repository context loaded automatically", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const awareness = loadContextAwareness(session);
    assert.ok(awareness.repositoryHealthScore >= 0);
    assert.ok(awareness.journeyPosition !== undefined);
  });

  test("Execution plan generated with modules and dependencies", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const awareness = loadContextAwareness(session);
    const plan = buildExecutionPlan(
      "whats_next",
      "mission_planning",
      awareness,
      session.planner,
    );
    assert.ok(plan.relevantModules.includes("mission_planner"));
    assert.ok(plan.steps.length > 0);
    assert.ok(plan.repositoryEvidence.length > 0);
  });

  test("processCommand coordinates Pillow modules", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const response = await requirePillowCommand().processCommand({
      command: "What's next?",
    });
    assert.equal(response.intent, "whats_next");
    assert.ok(response.message.length > 0);
    assert.equal(response.repositoryIntegrityPreserved, true);
    assert.ok(response.plan.relevantModules.length > 0);
  });

  test("Grand King priority enforced on command", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const cmd = requirePillowCommand();
    await cmd.processCommand({ command: "Review repository" });
    assert.equal(cmd.getState().grandKingPriorityActive, true);
    requirePillowCommand().processCommand({
      command: "Resume autonomous work",
      skipAutonomousPause: false,
    });
  });

  test("Pause and resume autonomous workflows", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    await session.command.processCommand({
      command: "Pause autonomous work",
      skipAutonomousPause: true,
    });
    assert.equal(session.orchestrator.getState().grandKingPriorityActive, true);
    await session.command.processCommand({ command: "Resume autonomous work" });
    assert.equal(session.orchestrator.getState().grandKingPriorityActive, false);
  });

  test("Journey unchanged after command processing", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    await requirePillowCommand().processCommand({ command: "What's next?" });
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("startPillow exposes GrandKingCommandInterface", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.command);
    assert.equal(requirePillowCommand(), session.command);
  });

  test("Orchestrator discovers Command Interface as ready", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const gk = session.orchestrator
      .getSubsystems()
      .find((s) => s.id === "grand_king_command_interface");
    assert.ok(gk);
    assert.equal(gk.missionId, "PILLOW-015");
    assert.equal(gk.health, "ready");
  });
});

describe("PILLOW Master Executive Audit", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Master audit verifies all PILLOW-002…015 modules", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const report = await runPillowMasterAudit(session);
    assert.equal(report.modules.length, 14);
    assert.ok(report.overallArchitectureScore >= 75);
    assert.ok(report.dependencyValidation.chain.includes("PILLOW-015"));
  });

  test("Master audit validates governance and repository health", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const report = await runPillowMasterAudit(session);
    assert.equal(report.governanceCompliance.executiveAuditChain, true);
    assert.equal(report.governanceCompliance.recoveryDoctrine, true);
    assert.ok(report.repositoryHealth.score >= 0);
    assert.ok(report.recommendation.length > 0);
  });

  test("Master audit produces integration recommendation", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const report = await runPillowMasterAudit(session);
    assert.ok([
      "approved_for_integration",
      "approved_with_recommendations",
      "conditionally_approved",
      "not_approved",
    ].includes(report.pillowV1IntegrationRecommendation));
  });
});
