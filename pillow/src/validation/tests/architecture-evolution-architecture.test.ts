import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleRepositoryEvolutionArchitecture } from "../../repository-evolution-architecture/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleArchitectureEvolutionArchitecture,
  buildFallbackArchitectureEvolutionArchitecture,
  ARCHITECTURE_EVOLUTION_PIPELINE,
  ARCHITECTURE_PRINCIPLES,
  GOVERNED_DOMAINS,
  ARCHITECTURE_GOVERNANCE_FIELDS,
} from "../../architecture-evolution-architecture/index.js";

describe("P9-03 Architecture Evolution Architecture", () => {
  test("buildFallbackArchitectureEvolutionArchitecture returns constitutional architecture model", () => {
    const view = buildFallbackArchitectureEvolutionArchitecture();
    assert.equal(view.architectureVersion, "P9-03");
    assert.ok(view.evolutionPipeline.length === ARCHITECTURE_EVOLUTION_PIPELINE.length);
    assert.deepEqual(view.architecturePrinciples, [...ARCHITECTURE_PRINCIPLES]);
    assert.deepEqual(view.governedDomains, [...GOVERNED_DOMAINS]);
    assert.deepEqual(view.architectureGovernance, [...ARCHITECTURE_GOVERNANCE_FIELDS]);
    assert.ok(view.recommendations.length >= 1);
  });

  test("assembleArchitectureEvolutionArchitecture consolidates P9 layers", () => {
    const repositoryEvolution = assembleRepositoryEvolutionArchitecture({
      repositoryHealth: {
        score: 78,
        issues: [{ code: "ARCHITECTURE_DRIFT", severity: "warning", message: "Boundary drift", recommendation: "Review" }],
        indicators: {
          totalEntities: 80, missingOwnerReferences: 0, brokenDependencyChains: 0,
          duplicateOwnership: 1, orphanedArtifacts: 0, architectureDriftSignals: 2,
          missingJourneyReferences: 0, missingDocumentation: 1,
        },
      },
    });

    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({ repositoryEvolution });

    const view = assembleArchitectureEvolutionArchitecture({
      repositoryEvolution,
      knowledgeEvolution,
      vie: { currentDrift: ["Repository boundary drift detected"], visionAlignment: "aligned" },
      journey: { currentMission: "P9-03", timeline: ["07:00 · Mission: P9-03 started"] },
    });

    assert.equal(view.architectureVersion, "P9-03");
    assert.ok(view.driftSignals.length >= 1);
    assert.ok(view.architectureReviews.length >= 8);
    assert.equal(view.integrations.repositoryEvolution, "P9-01 · 78/100 · stable");
    assert.equal(view.integrations.knowledgeEvolution, `P9-02 · ${knowledgeEvolution.knowledgeHealth}`);
  });
});
