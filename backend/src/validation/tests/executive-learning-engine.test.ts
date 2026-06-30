import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  approveExecutiveLearning,
  buildReasoningBundleForWorkspace,
  getLearningReviewStats,
  listExecutiveKnowledgeBase,
  listPendingLearnings,
  observeExecutiveConversation,
  rejectExecutiveLearning,
  resetExecutiveLearningRepository,
} from "../../orchestration/executive-learning/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE = "ws-executive-learning";

const baseReasoning = {
  composedAt: new Date().toISOString(),
  pipeline: [
    "executive_briefing",
    "current_conversation",
    "executive_reasoning",
    "response",
  ] as const,
  briefingAnchor: "Supreme Directive: sustainable profit.",
  identity: {
    narrative: "Pillow",
    pillowRole: "Executive layer",
    empirePurpose: "Organizational intelligence",
    refreshedAt: new Date().toISOString(),
  },
  direction: {
    supremeDirective: "Profit",
    currentObjective: "V1",
    currentStrategicPriority: "Learning",
    currentBlockers: [],
    explicitlyDeferredWork: [],
    currentEmpirePhase: "pre-go-live",
    pendingGrandKingDecisions: [],
    refreshedAt: new Date().toISOString(),
    sourceArtifacts: [],
  },
  executiveContext: {
    sessionId: "sess-1",
    turnCount: 1,
    lastUserMessage: "Profit first always.",
    conversationSummary: "Profit first always.",
    updatedAt: new Date().toISOString(),
  },
  currentConversation: "Profit first always.",
  executiveReasoningNotes: ["Apply Supreme Directive."],
} satisfies import("@empireai/pillow").ExecutiveReasoningComposition;

describe("Executive Learning Engine — backend", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetExecutiveLearningRepository();
  });

  afterEach(() => {
    resetExecutiveLearningRepository();
    resetDatabaseInstance();
  });

  it("observes conversation and creates pending learnings", () => {
    const created = observeExecutiveConversation({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-1",
      userMessage: "Profit first. Cursor never autonomous.",
      assistantMessage: "Acknowledged.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 1,
      actor: "grand-king",
    });

    assert.ok(created.length >= 1);
    const pending = listPendingLearnings(WORKSPACE);
    assert.ok(pending.length >= 1);
    assert.ok(pending.every((item) => item.status !== "approved"));
  });

  it("requires Grand King approval before knowledge base promotion", () => {
    observeExecutiveConversation({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-2",
      userMessage: "One objective only — Builder Mode.",
      assistantMessage: "Understood.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 2,
    });

    const pending = listPendingLearnings(WORKSPACE).find((item) => item.category === "A");
    assert.ok(pending);

    const knowledgeBefore = listExecutiveKnowledgeBase(WORKSPACE);
    assert.equal(knowledgeBefore.length, 0);

    const knowledge = approveExecutiveLearning({
      learningId: pending!.learningId,
      workspaceId: WORKSPACE,
      actor: "grand-king",
    });
    assert.ok(knowledge);
    assert.equal(knowledge!.status, "approved");

    const knowledgeAfter = listExecutiveKnowledgeBase(WORKSPACE);
    assert.equal(knowledgeAfter.length, 1);
    assert.ok(!listPendingLearnings(WORKSPACE).some((item) => item.learningId === pending!.learningId));
  });

  it("rejects learnings without promoting to knowledge base", () => {
    observeExecutiveConversation({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-3",
      userMessage: "Truth over agreement.",
      assistantMessage: "Noted.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 3,
    });

    const pending = listPendingLearnings(WORKSPACE)[0]!;
    rejectExecutiveLearning({
      learningId: pending.learningId,
      workspaceId: WORKSPACE,
      actor: "grand-king",
      notes: "Not durable enough",
    });

    const stats = getLearningReviewStats(WORKSPACE);
    assert.ok(stats.rejected >= 1);
    assert.equal(listExecutiveKnowledgeBase(WORKSPACE).length, 0);
  });

  it("loads approved knowledge into reasoning bundle", () => {
    observeExecutiveConversation({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-4",
      userMessage: "Profit first.",
      assistantMessage: "Acknowledged.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 4,
    });

    const pending = listPendingLearnings(WORKSPACE)[0]!;
    approveExecutiveLearning({
      learningId: pending.learningId,
      workspaceId: WORKSPACE,
      actor: "grand-king",
    });

    const bundle = buildReasoningBundleForWorkspace({
      workspaceId: WORKSPACE,
      currentObjective: "Version 1",
      executiveConstitutionSummary: "Supreme Directive",
    });

    assert.ok(bundle.approvedExecutiveKnowledge.length >= 1);
    assert.equal(bundle.currentObjective, "Version 1");
  });
});
