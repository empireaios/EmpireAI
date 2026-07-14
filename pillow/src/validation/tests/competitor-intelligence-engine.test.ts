import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackMarketIntelligenceEngine } from "../../market-intelligence-engine/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleCompetitorIntelligenceEngine,
  buildFallbackCompetitorIntelligenceEngine,
  COMPETITOR_INTELLIGENCE_PIPELINE,
  COMPETITOR_PRINCIPLES,
  GOVERNED_COMPETITOR_DOMAINS,
  COMPETITOR_ANALYSIS_DOMAINS,
  PILLOW_COMPETITOR_EVALUATIONS,
} from "../../competitor-intelligence-engine/index.js";

describe("E4-02 Competitor Intelligence Engine", () => {
  test("buildFallbackCompetitorIntelligenceEngine returns constitutional competitor model", () => {
    const view = buildFallbackCompetitorIntelligenceEngine();
    assert.equal(view.engineVersion, "E4-02");
    assert.equal(view.competitorIntelligencePipeline.length, COMPETITOR_INTELLIGENCE_PIPELINE.length);
    assert.deepEqual(view.competitorPrinciples, [...COMPETITOR_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_COMPETITOR_DOMAINS.length);
    assert.ok(view.competitorLandscape.length >= 10);
    assert.ok(view.marketLeaders.length >= 1);
    assert.ok(view.competitiveThreats.length >= 1);
    assert.ok(view.competitorAnalysis.length, COMPETITOR_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_COMPETITOR_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE403, true);
    assert.ok(view.competitorLandscape.every((c) => c.competitorId && c.evidence.length >= 1));
  });

  test("assembleCompetitorIntelligenceEngine integrates E4-01 E3 E2 E1 P9-02", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const marketIntelligenceEngine = buildFallbackMarketIntelligenceEngine();
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-02 Competitor Intelligence Engine" },
    });

    const view = assembleCompetitorIntelligenceEngine({
      marketIntelligenceEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-02 Competitor Intelligence Engine" },
      supervisor: { status: "monitoring competitor intelligence" },
      ecc: { status: "competitive intelligence coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-02");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.strategicPosition.length >= 1);
    assert.ok(view.strengthComparisons.length >= 1);
    assert.ok(view.weaknessComparisons.length >= 1);
    assert.equal(view.readyForE403, true);
  });
});
