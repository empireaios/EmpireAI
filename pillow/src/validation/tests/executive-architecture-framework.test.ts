import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleEmpireEvolutionArchitecture } from "../../empire-evolution-architecture/assembler.js";
import { assembleGrandKingOperatingAccount } from "../../grand-king-operating-account/assembler.js";
import {
  assembleExecutiveArchitectureFramework,
  buildFallbackExecutiveArchitectureFramework,
  EXECUTIVE_PLANNING_PIPELINE,
  EXECUTIVE_LAYERS,
  EXECUTIVE_PRINCIPLES,
  EXECUTIVE_GOVERNED_DOMAINS,
} from "../../executive-architecture-framework/index.js";

describe("E1-01 Executive Architecture Framework", () => {
  test("buildFallbackExecutiveArchitectureFramework returns constitutional executive model", () => {
    const view = buildFallbackExecutiveArchitectureFramework();
    assert.equal(view.architectureVersion, "E1-01");
    assert.ok(view.planningPipeline.length === EXECUTIVE_PLANNING_PIPELINE.length);
    assert.deepEqual(view.executivePrinciples, [...EXECUTIVE_PRINCIPLES]);
    assert.equal(view.executiveLayers.length, EXECUTIVE_LAYERS.length);
    assert.equal(view.governedDomains.length, EXECUTIVE_GOVERNED_DOMAINS.length);
    assert.equal(view.constitutionalFoundationComplete, true);
    assert.equal(view.readyForE102, true);
    assert.ok(view.currentObjectives.length >= 1);
    assert.ok(view.executiveRecommendations.length >= 1);
  });

  test("assembleExecutiveArchitectureFramework consolidates P9 foundation and executive stack", () => {
    const empireEvolution = assembleEmpireEvolutionArchitecture({
      grandKing: assembleGrandKingOperatingAccount({}),
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const grandKing = assembleGrandKingOperatingAccount({
      founderShell: { grandKingSummary: "Grand King executive reference" },
    });

    const view = assembleExecutiveArchitectureFramework({
      empireEvolution,
      grandKing,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
      journey: { currentMission: "E1-01", currentJourney: "E1 Executive Planning" },
    });

    assert.equal(view.architectureVersion, "E1-01");
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.executiveOwnership.length >= 6);
    assert.equal(view.integrations.empireEvolution, `P9-05 · ${empireEvolution.empireHealth}`);
    assert.equal(view.integrations.grandKingAccount, `${grandKing.accountId} · ${grandKing.empireStatus}`);
    assert.ok(view.executiveRisks.length >= 2);
    assert.ok(view.executiveOpportunities.length >= 2);
  });
});
