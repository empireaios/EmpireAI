import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleAiEvolutionArchitecture } from "../../ai-evolution-architecture/assembler.js";
import { assembleArchitectureEvolutionArchitecture } from "../../architecture-evolution-architecture/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import { assembleRepositoryEvolutionArchitecture } from "../../repository-evolution-architecture/assembler.js";
import { assembleGrandKingOperatingAccount } from "../../grand-king-operating-account/assembler.js";
import {
  assembleEmpireEvolutionArchitecture,
  buildFallbackEmpireEvolutionArchitecture,
  EMPIRE_EVOLUTION_PIPELINE,
  EMPIRE_PRINCIPLES,
  CONSTITUTIONAL_PHASES,
} from "../../empire-evolution-architecture/index.js";

describe("P9-05 Empire Evolution Architecture", () => {
  test("buildFallbackEmpireEvolutionArchitecture returns constitutional Empire model", () => {
    const view = buildFallbackEmpireEvolutionArchitecture();
    assert.equal(view.architectureVersion, "P9-05");
    assert.ok(view.evolutionPipeline.length === EMPIRE_EVOLUTION_PIPELINE.length);
    assert.deepEqual(view.empirePrinciples, [...EMPIRE_PRINCIPLES]);
    assert.equal(view.constitutionalPhases.length, CONSTITUTIONAL_PHASES.length);
    assert.equal(view.constitutionalExecutionComplete, true);
    assert.ok(view.roadmapItemsExecuted >= 63);
    assert.ok(view.currentRecommendations.length >= 1);
  });

  test("assembleEmpireEvolutionArchitecture consolidates full P9 stack", () => {
    const repositoryEvolution = assembleRepositoryEvolutionArchitecture({});
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({ repositoryEvolution });
    const architectureEvolution = assembleArchitectureEvolutionArchitecture({
      repositoryEvolution,
      knowledgeEvolution,
    });
    const aiEvolution = assembleAiEvolutionArchitecture({
      architectureEvolution,
      knowledgeEvolution,
    });
    const grandKing = assembleGrandKingOperatingAccount({
      founderShell: { grandKingSummary: "Grand King production account" },
    });

    const view = assembleEmpireEvolutionArchitecture({
      aiEvolution,
      architectureEvolution,
      knowledgeEvolution,
      repositoryEvolution,
      grandKing,
      vie: { visionAlignment: "aligned", approvalStatus: "conditional" },
      journey: { currentMission: "P9-05", currentJourney: "P9 Evolution" },
    });

    assert.equal(view.architectureVersion, "P9-05");
    assert.ok(view.empireHealthMetrics.length >= 12);
    assert.ok(view.continuousReviews.length >= 10);
    assert.equal(view.integrations.aiEvolution, `P9-04 · ${aiEvolution.aiHealth}`);
    assert.equal(view.integrations.grandKingAccount, `${grandKing.accountId} · ${grandKing.empireStatus}`);
    assert.equal(view.constitutionalExecutionComplete, true);
  });
});
