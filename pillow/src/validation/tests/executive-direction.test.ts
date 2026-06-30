import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { shouldRefreshExecutiveDirection } from "../../bootstrap/executive-direction.js";
import { formatExecutiveReasoningForLlm } from "../../bootstrap/executive-reasoning-context.js";
import {
  buildPillowContext,
  composeExecutiveReasoning,
  refreshExecutiveDirection,
  requireExecutiveDirectionContext,
  resetPillowSession,
  startPillow,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Executive Direction Context (Bootstrap extension)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Executive Briefing distinguishes Identity, Direction, and Context", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const briefing = session.executiveDirection.getBriefing();

    assert.ok(briefing.identity.pillowRole.length > 0);
    assert.ok(briefing.identity.empirePurpose.length > 0);
    assert.equal(briefing.direction.currentObjective, "Finish EmpireAI Version 1");
    assert.ok(briefing.direction.currentStrategicPriority.length > 0);
    assert.ok(Array.isArray(briefing.direction.currentBlockers));
    assert.ok(Array.isArray(briefing.direction.explicitlyDeferredWork));
    assert.ok(briefing.direction.currentEmpirePhase.length > 0);
    assert.ok(
      briefing.narrative.includes("continuous strategic anchor"),
      "Briefing narrative must declare continuous anchor role",
    );

    const executiveContext = session.executiveDirection.getExecutiveContext();
    assert.equal(executiveContext.turnCount, 0);
    assert.equal(executiveContext.lastUserMessage, null);
  });

  test("composeReasoningCycle follows Executive Briefing → Conversation → Reasoning → Response", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const composition = composeExecutiveReasoning("What is the current strategic priority?");

    assert.deepEqual(composition.pipeline, [
      "executive_briefing",
      "current_conversation",
      "executive_reasoning",
      "response",
    ]);
    assert.ok(composition.briefingAnchor.includes("PILLOW EXECUTIVE BRIEFING"));
    assert.equal(composition.currentConversation, "What is the current strategic priority?");
    assert.equal(composition.executiveContext.turnCount, 1);
    assert.equal(
      composition.executiveContext.lastUserMessage,
      "What is the current strategic priority?",
    );
    assert.ok(composition.executiveReasoningNotes.length >= 3);

    const llmAnchor = formatExecutiveReasoningForLlm(composition);
    assert.ok(llmAnchor.includes("[1] EXECUTIVE BRIEFING"));
    assert.ok(llmAnchor.includes("[2] EXECUTIVE CONTEXT"));
    assert.ok(llmAnchor.includes("[3] CURRENT CONVERSATION"));
    assert.ok(llmAnchor.includes("[4] EXECUTIVE REASONING"));
  });

  test("buildPillowContext attaches executive reasoning when userMessage present", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const context = await buildPillowContext({ userMessage: "Summarize blockers" });

    assert.ok(context.executiveReasoning);
    assert.equal(context.executiveReasoning?.currentConversation, "Summarize blockers");
  });

  test("refreshExecutiveDirection updates direction from authoritative repository state", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const before = requireExecutiveDirectionContext().getBriefing().refreshedAt;

    await refreshExecutiveDirection("test:manual-refresh");

    const after = requireExecutiveDirectionContext().getBriefing();
    assert.ok(after.narrative.includes("Trigger: test:manual-refresh"));
    assert.ok(after.direction.sourceArtifacts.includes("JOURNEY.md"));
    assert.ok(after.refreshedAt >= before);
  });

  test("shouldRefreshExecutiveDirection triggers on authoritative repository changes", () => {
    assert.equal(shouldRefreshExecutiveDirection({ type: "JourneyUpdated", paths: [] }), true);
    assert.equal(
      shouldRefreshExecutiveDirection({ type: "SynchronizationCompleted", paths: [] }),
      true,
    );
    assert.equal(
      shouldRefreshExecutiveDirection({
        type: "RepositoryUpdated",
        paths: ["JOURNEY.md"],
      }),
      true,
    );
    assert.equal(
      shouldRefreshExecutiveDirection({
        type: "RepositoryUpdated",
        paths: ["pillow/src/session.ts"],
      }),
      false,
    );
  });
});
