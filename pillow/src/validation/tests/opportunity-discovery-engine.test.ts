import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackMarketIntelligenceEngine } from "../../market-intelligence-engine/assembler.js";
import { buildFallbackCompetitorIntelligenceEngine } from "../../competitor-intelligence-engine/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleOpportunityDiscoveryEngine,
  buildFallbackOpportunityDiscoveryEngine,
  OPPORTUNITY_DISCOVERY_PIPELINE,
  OPPORTUNITY_PRINCIPLES,
  GOVERNED_OPPORTUNITY_DOMAINS,
  OPPORTUNITY_ANALYSIS_DOMAINS,
  PILLOW_OPPORTUNITY_EVALUATIONS,
} from "../../opportunity-discovery-engine/index.js";

describe("E4-03 Opportunity Discovery Engine", () => {
  test("buildFallbackOpportunityDiscoveryEngine returns constitutional opportunity model", () => {
    const view = buildFallbackOpportunityDiscoveryEngine();
    assert.equal(view.engineVersion, "E4-03");
    assert.equal(view.opportunityDiscoveryPipeline.length, OPPORTUNITY_DISCOVERY_PIPELINE.length);
    assert.deepEqual(view.opportunityPrinciples, [...OPPORTUNITY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_OPPORTUNITY_DOMAINS.length);
    assert.ok(view.opportunityPipeline.length >= 10);
    assert.ok(view.priorityOpportunities.length >= 1);
    assert.ok(view.revenuePotential.length >= 1);
    assert.ok(view.opportunityAnalysis.length, OPPORTUNITY_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_OPPORTUNITY_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE404, true);
    assert.ok(view.opportunityPipeline.every((o) => o.opportunityId && o.evidence.length >= 1));
  });

  test("assembleOpportunityDiscoveryEngine integrates E4-01 E4-02 E3 E2 E1 P9-02", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const marketIntelligenceEngine = buildFallbackMarketIntelligenceEngine();
    const competitorIntelligenceEngine = buildFallbackCompetitorIntelligenceEngine();
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-03 Opportunity Discovery Engine" },
    });

    const view = assembleOpportunityDiscoveryEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-03 Opportunity Discovery Engine" },
      supervisor: { status: "monitoring opportunity discovery" },
      ecc: { status: "opportunity prioritization" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-03");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.competitorIntelligenceEngine.includes("E4-02"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.opportunityTrends.length >= 1);
    assert.ok(view.strategicValue.length >= 1);
    assert.equal(view.readyForE404, true);
  });
});
