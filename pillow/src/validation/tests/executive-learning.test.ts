import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyLearningCandidate,
  createExecutiveLearningEngine,
  extractLearningCandidates,
  formatExecutiveLearningForLlm,
  buildExecutiveLearningReasoningBundle,
  meetsConfirmationThreshold,
} from "../../learning/index.js";
import type { ExecutiveReasoningComposition } from "../../bootstrap/types.js";

const baseReasoning: ExecutiveReasoningComposition = {
  composedAt: new Date().toISOString(),
  pipeline: ["executive_briefing", "current_conversation", "executive_reasoning", "response"],
  briefingAnchor: "Supreme Directive: sustainable profit.",
  identity: {
    narrative: "Pillow executive intelligence",
    pillowRole: "Pillow Executive Intelligence",
    empirePurpose: "Transform conversations into organizational intelligence",
    refreshedAt: new Date().toISOString(),
  },
  direction: {
    supremeDirective: "Sustainable long-term profit",
    currentObjective: "Version 1 completion",
    currentStrategicPriority: "Executive Learning Engine",
    currentBlockers: [],
    explicitlyDeferredWork: [],
    currentEmpirePhase: "pre-go-live",
    pendingGrandKingDecisions: [],
    refreshedAt: new Date().toISOString(),
    sourceArtifacts: [],
  },
  executiveContext: {
    sessionId: "sess-1",
    turnCount: 2,
    lastUserMessage: "I always prefer ROI over engineering elegance.",
    conversationSummary: "I always prefer ROI over engineering elegance.",
    updatedAt: new Date().toISOString(),
  },
  currentConversation: "I always prefer ROI over engineering elegance.",
  executiveReasoningNotes: ["Apply Supreme Directive before responding."],
};

describe("Executive Learning Engine — pillow", () => {
  it("extracts learning candidates from executive conversation", () => {
    const candidates = extractLearningCandidates({
      workspaceId: "ws-test",
      sessionId: "sess-1",
      requestId: "req-1",
      userMessage: "I always prefer ROI over engineering elegance. Profit first.",
      assistantMessage: "Understood — ROI and profit-first discipline noted.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 2,
    });

    assert.ok(candidates.length >= 2);
    assert.ok(candidates.some((item) => /roi|profit/i.test(item.title)));
  });

  it("classifies category A principles as requiring Grand King approval", () => {
    const candidates = extractLearningCandidates({
      workspaceId: "ws-test",
      sessionId: "sess-1",
      requestId: "req-1",
      userMessage: "Cursor never autonomous. One objective only.",
      assistantMessage: "Acknowledged.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 1,
    });

    const principle = candidates.find((item) => item.category === "A");
    assert.ok(principle);
    const classification = classifyLearningCandidate(principle!);
    assert.equal(classification.requiresGrandKingApproval, true);
  });

  it("runs full pipeline without auto-promoting to knowledge", () => {
    const engine = createExecutiveLearningEngine();
    const result = engine.runPipeline({
      workspaceId: "ws-test",
      sessionId: "sess-1",
      requestId: "req-1",
      userMessage: "Truth over agreement — tell me when I am wrong.",
      assistantMessage: "I will prioritize truthful counsel.",
      executiveReasoning: baseReasoning,
      conversationTurnCount: 3,
    });

    assert.deepEqual(result.pipelineStages.at(-1), "pending_executive_learning");
    assert.ok(result.candidates.every((item) => item.requiresGrandKingApproval || item.category !== "A"));
    assert.ok(result.candidates.length > 0);
  });

  it("formats approved knowledge for reasoning integration only", () => {
    const bundle = buildExecutiveLearningReasoningBundle({
      currentObjective: "Version 1 completion",
      executiveConstitutionSummary: "Supreme Directive: profit.",
      approvedKnowledge: [
        {
          learningId: "k-1",
          workspaceId: "ws-test",
          title: "Profit first",
          category: "A",
          description: "Grand King prioritises profit.",
          source: "conversation",
          confidence: 0.95,
          discoveredAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: "grand-king",
          status: "approved",
          supersededBy: null,
          reasoningAreas: ["decision_principles"],
          affectedReasoningAreas: ["decision_principles"],
        },
      ],
      pendingSessionContext: [],
    });

    const formatted = formatExecutiveLearningForLlm(bundle);
    assert.match(formatted, /NOT chat memory/);
    assert.match(formatted, /Profit first/);
    assert.match(formatted, /Only APPROVED Executive Knowledge/);
  });

  it("enforces confirmation threshold for category A", () => {
    assert.equal(meetsConfirmationThreshold(0.85, "A"), true);
    assert.equal(meetsConfirmationThreshold(0.5, "A"), false);
  });
});
