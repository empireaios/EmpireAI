import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackMarketIntelligenceEngine } from "../../market-intelligence-engine/assembler.js";
import { buildFallbackCompetitorIntelligenceEngine } from "../../competitor-intelligence-engine/assembler.js";
import { buildFallbackOpportunityDiscoveryEngine } from "../../opportunity-discovery-engine/assembler.js";
import { buildFallbackThreatDetectionEngine } from "../../threat-detection-engine/assembler.js";
import { buildFallbackIndustryIntelligenceEngine } from "../../industry-intelligence-engine/assembler.js";
import { buildFallbackCustomerBehaviourIntelligence } from "../../customer-behaviour-intelligence/assembler.js";
import { buildFallbackInnovationIntelligenceEngine } from "../../innovation-intelligence-engine/assembler.js";
import { buildFallbackExecutiveKnowledgeGraph } from "../../executive-knowledge-graph/assembler.js";
import { buildFallbackExecutivePredictionEngine } from "../../executive-prediction-engine/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutiveInsightEngine,
  buildFallbackExecutiveInsightEngine,
  INSIGHT_PIPELINE,
  INSIGHT_PRINCIPLES,
  GOVERNED_INSIGHT_DOMAINS,
  INSIGHT_ANALYSIS_DOMAINS,
  PILLOW_INSIGHT_EVALUATIONS,
} from "../../executive-insight-engine/index.js";

describe("E4-10 Executive Insight Engine", () => {
  test("buildFallbackExecutiveInsightEngine returns constitutional insight model", () => {
    const view = buildFallbackExecutiveInsightEngine();
    assert.equal(view.engineVersion, "E4-10");
    assert.equal(view.insightPipeline.length, INSIGHT_PIPELINE.length);
    assert.deepEqual(view.insightPrinciples, [...INSIGHT_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_INSIGHT_DOMAINS.length);
    assert.ok(view.executiveInsights.length >= 10);
    assert.ok(view.topPriorities.length >= 1);
    assert.ok(view.strategicFindings.length >= 1);
    assert.ok(view.insightAnalysis.length >= INSIGHT_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length >= PILLOW_INSIGHT_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.confidenceLevels.length >= 1);
    assert.equal(view.readyForE411, true);
    assert.ok(view.executiveInsights.every((i) => i.insightId && i.evidence.length >= 1));
  });

  test("assembleExecutiveInsightEngine integrates E4-01 E4-09 E3 E2 E1 P9-02", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const marketIntelligenceEngine = buildFallbackMarketIntelligenceEngine();
    const competitorIntelligenceEngine = buildFallbackCompetitorIntelligenceEngine();
    const opportunityDiscoveryEngine = buildFallbackOpportunityDiscoveryEngine();
    const threatDetectionEngine = buildFallbackThreatDetectionEngine();
    const industryIntelligenceEngine = buildFallbackIndustryIntelligenceEngine();
    const customerBehaviourIntelligence = buildFallbackCustomerBehaviourIntelligence();
    const innovationIntelligenceEngine = buildFallbackInnovationIntelligenceEngine();
    const executiveKnowledgeGraph = buildFallbackExecutiveKnowledgeGraph();
    const executivePredictionEngine = buildFallbackExecutivePredictionEngine();
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-10 Executive Insight Engine" },
    });

    const view = assembleExecutiveInsightEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      industryIntelligenceEngine,
      customerBehaviourIntelligence,
      innovationIntelligenceEngine,
      executiveKnowledgeGraph,
      executivePredictionEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-10 Executive Insight Engine" },
      supervisor: { status: "monitoring insight accuracy" },
      ecc: { status: "insight distribution coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-10");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.executivePredictionEngine.includes("E4-09"));
    assert.ok(view.integrations.executiveKnowledgeGraph.includes("E4-08"));
    assert.ok(view.integrations.threatDetectionEngine.includes("E4-04"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.criticalRisks.length >= 1);
    assert.ok(view.criticalOpportunities.length >= 1);
    assert.equal(view.readyForE411, true);
  });
});
