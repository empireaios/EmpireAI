import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleEmpireEvolutionArchitecture } from "../../empire-evolution-architecture/assembler.js";
import { assembleGrandKingOperatingAccount } from "../../grand-king-operating-account/assembler.js";
import {
  assembleCorporateVisionEngine,
  buildFallbackCorporateVisionEngine,
  VISION_SYNC_PIPELINE,
  VISION_STRUCTURE,
  VISION_PRINCIPLES,
  VISION_GOVERNED_DOMAINS,
  CANONICAL_VISION_WHY,
} from "../../corporate-vision-engine/index.js";

describe("E1-02 Corporate Vision Engine", () => {
  test("buildFallbackCorporateVisionEngine returns constitutional vision model", () => {
    const view = buildFallbackCorporateVisionEngine();
    assert.equal(view.architectureVersion, "E1-02");
    assert.ok(view.visionSyncPipeline.length === VISION_SYNC_PIPELINE.length);
    assert.deepEqual(view.visionPrinciples, [...VISION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, VISION_GOVERNED_DOMAINS.length);
    assert.equal(view.visionStructure.length, VISION_STRUCTURE.length);
    assert.ok(view.visionWhy.includes("manufacture") || view.visionWhy === CANONICAL_VISION_WHY);
    assert.equal(view.readyForE103, true);
    assert.ok(view.recentVisionAdditions.length >= 1);
    assert.ok(view.visionRecommendations.length >= 1);
    assert.equal(view.visionSyncRequired, true);
  });

  test("assembleCorporateVisionEngine consolidates E1-01 foundation and VIE", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({
      empireEvolution: assembleEmpireEvolutionArchitecture({}),
      grandKing: assembleGrandKingOperatingAccount({}),
    });

    const view = assembleCorporateVisionEngine({
      executiveArchitecture,
      grandKing: assembleGrandKingOperatingAccount({}),
      vie: { visionAlignment: "aligned", approvalStatus: "validated", currentDrift: [] },
      visionSync: { success: true, missionContext: { why: "WHY test", what: "WHAT test", how: "HOW test" } },
      journey: { currentJourney: "E1 Executive Planning" },
    });

    assert.equal(view.architectureVersion, "E1-02");
    assert.equal(view.visionWhy, "WHY test");
    assert.equal(view.visionSyncRequired, false);
    assert.equal(view.eccVisionGate, "passed · ECC may proceed to executive execution");
    assert.equal(view.integrations.executiveArchitecture, `E1-01 · ${executiveArchitecture.executiveHealth}`);
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.visionAccumulations.length >= 5);
  });
});
