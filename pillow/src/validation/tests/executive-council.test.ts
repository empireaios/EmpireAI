import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  runPillowExecutiveCouncil,
  runExecutiveDebate,
  shouldRunExecutiveCouncil,
  PILLOW_EXECUTIVE_PERSONAS,
  COUNCIL_DEBATE_EXECUTIVES,
  formatCeoRecommendationForLlm,
} from "../../executive-perspectives/index.js";

describe("Pillow Executive Perspectives", () => {
  it("defines seven permanent executive perspectives with no separate CEO entity", () => {
    assert.equal(PILLOW_EXECUTIVE_PERSONAS.length, 7);
    assert.equal(COUNCIL_DEBATE_EXECUTIVES.length, 7);
    assert.ok(PILLOW_EXECUTIVE_PERSONAS.every((p) => "id" in p && !("role" in p)));
    assert.ok(PILLOW_EXECUTIVE_PERSONAS.some((p) => p.id === "REPOSITORY"));
    assert.ok(PILLOW_EXECUTIVE_PERSONAS.some((p) => p.id === "STRATEGY"));
  });

  it("runs internal debate with perspective opinions", () => {
    const opinions = runExecutiveDebate({
      topic: "Implement REAL-002B live credentials",
      proposalSummary: "Should we prioritize live Amazon credentials this sprint?",
      userMessage: "Should we prioritize live Amazon credentials this sprint?",
      currentObjective: "Version 1 completion",
      journeyPosition: "REAL-002B",
      repositoryHealthScore: 85,
      subjectType: "commercial",
    });

    assert.equal(opinions.length, 7);
    assert.ok(opinions.every((o) => o.title && o.recommendation && o.reasoning));
    assert.ok(opinions.every((o) => o.challengesAssumptions.length > 0));
    assert.ok(opinions.every((o) => o.perspectiveId));
  });

  it("produces exactly one Pillow synthesis recommendation with dissent preserved", () => {
    const result = runPillowExecutiveCouncil({
      topic: "Refactor Pillow learning pipeline",
      proposalSummary: "Should we refactor the executive learning engine now?",
      userMessage: "Should we refactor the executive learning engine now?",
      currentObjective: "Version 1 completion",
      journeyPosition: null,
      repositoryHealthScore: 90,
      subjectType: "engineering",
    });

    assert.ok(result.publicRecommendation.recommendation);
    assert.equal(result.publicRecommendation.status, "awaiting_grand_king");
    assert.equal(result.publicRecommendation.synthesizedBy, "pillow");
    assert.ok(result.publicRecommendation.evidence.length > 0);
    assert.ok(result.publicRecommendation.assumptions.length > 0);
    assert.ok(result.publicRecommendation.alternatives.length > 0);
    assert.ok(result.debate.opinions.length === 7);
    assert.ok(Array.isArray(result.debate.dissents));
    assert.equal(result.debate.confidentiality, "internal_only");
    assert.match(
      formatCeoRecommendationForLlm(result.publicRecommendation),
      /Do not expose individual Executive Perspectives/,
    );
  });

  it("detects proposal-worthy messages for internal perspectives debate", () => {
    assert.equal(shouldRunExecutiveCouncil("hi"), false);
    assert.equal(shouldRunExecutiveCouncil("Should we implement the next PEI mission?"), true);
  });
});
