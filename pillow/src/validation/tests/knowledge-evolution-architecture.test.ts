import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleRepositoryEvolutionArchitecture } from "../../repository-evolution-architecture/assembler.js";
import {
  assembleKnowledgeEvolutionArchitecture,
  buildFallbackKnowledgeEvolutionArchitecture,
  KNOWLEDGE_EVOLUTION_PIPELINE,
  KNOWLEDGE_PRINCIPLES,
  KNOWLEDGE_CLASSIFICATIONS,
  KNOWLEDGE_GOVERNANCE_FIELDS,
} from "../../knowledge-evolution-architecture/index.js";

describe("P9-02 Knowledge Evolution Architecture", () => {
  test("buildFallbackKnowledgeEvolutionArchitecture returns constitutional knowledge model", () => {
    const view = buildFallbackKnowledgeEvolutionArchitecture();
    assert.equal(view.architectureVersion, "P9-02");
    assert.ok(view.evolutionPipeline.length === KNOWLEDGE_EVOLUTION_PIPELINE.length);
    assert.deepEqual(view.knowledgePrinciples, [...KNOWLEDGE_PRINCIPLES]);
    assert.deepEqual(view.knowledgeClassifications, [...KNOWLEDGE_CLASSIFICATIONS]);
    assert.deepEqual(view.knowledgeGovernance, [...KNOWLEDGE_GOVERNANCE_FIELDS]);
    assert.ok(view.recommendations.length >= 1);
  });

  test("assembleKnowledgeEvolutionArchitecture consolidates journey and repository evolution", () => {
    const repositoryEvolution = assembleRepositoryEvolutionArchitecture({
      repositoryHealth: { score: 82, issues: [], indicators: {
        totalEntities: 50, missingOwnerReferences: 0, brokenDependencyChains: 0,
        duplicateOwnership: 0, orphanedArtifacts: 0, architectureDriftSignals: 1,
        missingJourneyReferences: 0, missingDocumentation: 1,
      }},
    });

    const view = assembleKnowledgeEvolutionArchitecture({
      repositoryEvolution,
      graphSummary: { nodeCount: 120, edgeCount: 240, dependencyCount: 80, byClassification: {} },
      journey: {
        currentMission: "P9-02",
        lessonsLearned: ["Constitutional knowledge must be traceable to evidence"],
        evidence: ["Builder validated repository evolution integration"],
        repositoryChanges: ["Added knowledge-evolution-architecture module"],
        timeline: ["10:00 · Mission: P9-02 started"],
      },
    });

    assert.equal(view.architectureVersion, "P9-02");
    assert.ok(view.recentKnowledge.length >= 2);
    assert.ok(view.knowledgeCategories.some((c) => c.count > 0));
    assert.equal(view.integrations.repositoryEvolution, "P9-01 · 82/100 · stable");
    assert.ok(view.knowledgeGaps.length >= 0);
  });
});
