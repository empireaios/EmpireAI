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
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutivePredictionEngine,
  buildFallbackExecutivePredictionEngine,
  PREDICTION_PIPELINE,
  PREDICTION_PRINCIPLES,
  GOVERNED_PREDICTION_DOMAINS,
  PREDICTION_ANALYSIS_DOMAINS,
  PILLOW_PREDICTION_EVALUATIONS,
} from "../../executive-prediction-engine/index.js";

describe("E4-09 Executive Prediction Engine", () => {
  test("buildFallbackExecutivePredictionEngine returns constitutional prediction model", () => {
    const view = buildFallbackExecutivePredictionEngine();
    assert.equal(view.engineVersion, "E4-09");
    assert.equal(view.predictionPipeline.length, PREDICTION_PIPELINE.length);
    assert.deepEqual(view.predictionPrinciples, [...PREDICTION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_PREDICTION_DOMAINS.length);
    assert.ok(view.predictionDashboard.length >= 10);
    assert.ok(view.probabilityScores.length >= 1);
    assert.ok(view.strategicForecasts.length >= 1);
    assert.ok(view.predictionAnalysis.length >= PREDICTION_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length >= PILLOW_PREDICTION_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.futureOutlook.length >= 1);
    assert.equal(view.readyForE410, true);
    assert.ok(view.predictionDashboard.every((p) => p.predictionId && p.evidence.length >= 1));
  });

  test("assembleExecutivePredictionEngine integrates E4-01 E4-08 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-09 Executive Prediction Engine" },
    });

    const view = assembleExecutivePredictionEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      industryIntelligenceEngine,
      customerBehaviourIntelligence,
      innovationIntelligenceEngine,
      executiveKnowledgeGraph,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-09 Executive Prediction Engine" },
      supervisor: { status: "monitoring prediction accuracy" },
      ecc: { status: "prediction distribution coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-09");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.executiveKnowledgeGraph.includes("E4-08"));
    assert.ok(view.integrations.innovationIntelligenceEngine.includes("E4-07"));
    assert.ok(view.integrations.threatDetectionEngine.includes("E4-04"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.emergingRisks.length >= 1);
    assert.ok(view.emergingOpportunities.length >= 1);
    assert.equal(view.readyForE410, true);
  });
});
