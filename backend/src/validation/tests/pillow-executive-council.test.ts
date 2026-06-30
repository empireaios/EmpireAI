import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  decideExecutiveRecommendation,
  getCouncilDebate,
  resetPillowExecutiveCouncilRepository,
  runAndStoreExecutiveCouncil,
} from "../../orchestration/pillow-executive-council/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE = "ws-pillow-council";

describe("Pillow Executive Council — backend", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetPillowExecutiveCouncilRepository();
  });

  afterEach(() => {
    resetPillowExecutiveCouncilRepository();
    resetDatabaseInstance();
  });

  it("stores debate and returns single public recommendation", () => {
    const result = runAndStoreExecutiveCouncil({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-1",
      topic: "Launch commercial intelligence depth",
      proposalSummary: "Should we prioritize commercial intelligence after V1?",
      userMessage: "Should we prioritize commercial intelligence after V1?",
      currentObjective: "Version 1 completion",
      journeyPosition: "Layer 3",
      repositoryHealthScore: 88,
      subjectType: "strategy",
    });

    assert.ok(result.publicRecommendation.recommendationId);
    assert.equal(result.debate.opinions.length, 7);
    assert.equal(result.publicRecommendation.status, "awaiting_grand_king");
  });

  it("preserves dissent in debate detail endpoint data", () => {
    const result = runAndStoreExecutiveCouncil({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-2",
      topic: "Defer supplier expansion",
      proposalSummary: "Should we defer supplier intelligence until MS-A?",
      userMessage: "Should we defer supplier intelligence until MS-A?",
      currentObjective: "Version 1 completion",
      journeyPosition: null,
      repositoryHealthScore: 75,
      subjectType: "commercial",
    });

    const debate = getCouncilDebate(WORKSPACE, result.debate.debateId);
    assert.ok(debate);
    assert.ok(debate!.opinions.length >= 7);
  });

  it("requires Grand King decision before status changes — no Cursor dispatch", () => {
    const result = runAndStoreExecutiveCouncil({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-3",
      topic: "Implement council UI",
      proposalSummary: "Recommend implementing executive council in Pillow",
      userMessage: "What do you recommend for the executive council UI?",
      currentObjective: "Version 1 completion",
      journeyPosition: null,
      repositoryHealthScore: 92,
      subjectType: "engineering",
    });

    const decided = decideExecutiveRecommendation({
      workspaceId: WORKSPACE,
      recommendationId: result.publicRecommendation.recommendationId,
      outcome: "approved",
      actor: "grand-king",
    });

    assert.ok(decided);
    assert.equal(decided!.status, "approved");
    assert.equal(decided!.publicRecommendation.status, "approved");
  });

  it("supports reject and defer outcomes", () => {
    const result = runAndStoreExecutiveCouncil({
      workspaceId: WORKSPACE,
      sessionId: "sess-1",
      requestId: "req-4",
      topic: "Risky refactor",
      proposalSummary: "Should we refactor everything now?",
      userMessage: "Should we refactor everything now?",
      currentObjective: "Version 1 completion",
      journeyPosition: null,
      repositoryHealthScore: 60,
      subjectType: "engineering",
    });

    const rejected = decideExecutiveRecommendation({
      workspaceId: WORKSPACE,
      recommendationId: result.publicRecommendation.recommendationId,
      outcome: "rejected",
      actor: "grand-king",
    });
    assert.equal(rejected!.status, "rejected");
  });
});
