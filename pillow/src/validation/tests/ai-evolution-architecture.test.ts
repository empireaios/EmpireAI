import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleArchitectureEvolutionArchitecture } from "../../architecture-evolution-architecture/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import { assembleRepositoryEvolutionArchitecture } from "../../repository-evolution-architecture/assembler.js";
import { buildFallbackCommercialIntelligenceArchitecture } from "../../commercial-intelligence/assembler.js";
import {
  assembleAiEvolutionArchitecture,
  buildFallbackAiEvolutionArchitecture,
  AI_EVOLUTION_PIPELINE,
  AI_EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
  AI_GOVERNANCE_FIELDS,
} from "../../ai-evolution-architecture/index.js";

describe("P9-04 AI Evolution Architecture", () => {
  test("buildFallbackAiEvolutionArchitecture returns constitutional AI model", () => {
    const view = buildFallbackAiEvolutionArchitecture();
    assert.equal(view.architectureVersion, "P9-04");
    assert.ok(view.evolutionPipeline.length === AI_EVOLUTION_PIPELINE.length);
    assert.deepEqual(view.aiEvolutionPrinciples, [...AI_EVOLUTION_PRINCIPLES]);
    assert.deepEqual(view.governedDomains, [...GOVERNED_DOMAINS]);
    assert.deepEqual(view.aiGovernance, [...AI_GOVERNANCE_FIELDS]);
    assert.ok(view.intelligenceQuality.length >= 9);
    assert.ok(view.recommendations.length >= 1);
  });

  test("assembleAiEvolutionArchitecture consolidates P9 evolution layers", () => {
    const repositoryEvolution = assembleRepositoryEvolutionArchitecture({
      repositoryHealth: { score: 80, issues: [], indicators: {
        totalEntities: 50, missingOwnerReferences: 0, brokenDependencyChains: 0,
        duplicateOwnership: 0, orphanedArtifacts: 0, architectureDriftSignals: 0,
        missingJourneyReferences: 0, missingDocumentation: 0,
      }},
    });

    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({ repositoryEvolution });
    const architectureEvolution = assembleArchitectureEvolutionArchitecture({
      repositoryEvolution,
      knowledgeEvolution,
    });
    const commercialIntelligence = buildFallbackCommercialIntelligenceArchitecture();

    const view = assembleAiEvolutionArchitecture({
      architectureEvolution,
      knowledgeEvolution,
      commercialIntelligence,
      journey: { currentMission: "P9-04", timeline: ["07:30 · Mission: P9-04 started"] },
    });

    assert.equal(view.architectureVersion, "P9-04");
    assert.ok(view.healthScore >= 45);
    assert.equal(view.integrations.knowledgeEvolution, `P9-02 · ${knowledgeEvolution.knowledgeHealth}`);
    assert.equal(view.integrations.architectureEvolution, `P9-03 · ${architectureEvolution.architectureHealth}`);
    assert.ok(view.commercialIntelligence.includes("products"));
  });
});
