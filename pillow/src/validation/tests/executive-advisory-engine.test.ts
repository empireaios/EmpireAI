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
import { buildFallbackExecutiveInsightEngine } from "../../executive-insight-engine/assembler.js";
import { buildFallbackEnterprisePatternEngine } from "../../enterprise-pattern-engine/assembler.js";
import { buildFallbackExecutiveBenchmarkEngine } from "../../executive-benchmark-engine/assembler.js";
import { buildFallbackCrossBusinessIntelligence } from "../../cross-business-intelligence/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutiveAdvisoryEngine,
  buildFallbackExecutiveAdvisoryEngine,
  ADVISORY_PIPELINE,
  ADVISORY_PRINCIPLES,
  GOVERNED_ADVISORY_DOMAINS,
  EXECUTIVE_ANALYSIS_DOMAINS,
  PILLOW_ADVISORY_EVALUATIONS,
} from "../../executive-advisory-engine/index.js";

describe("E4-14 Executive Advisory Engine", () => {
  test("buildFallbackExecutiveAdvisoryEngine returns constitutional advisory model", () => {
    const view = buildFallbackExecutiveAdvisoryEngine();
    assert.equal(view.engineVersion, "E4-14");
    assert.equal(view.advisoryPipeline.length, ADVISORY_PIPELINE.length);
    assert.deepEqual(view.advisoryPrinciples, [...ADVISORY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ADVISORY_DOMAINS.length);
    assert.ok(view.topExecutiveRecommendations.length >= 10);
    assert.ok(view.immediateActions.length >= 1);
    assert.ok(view.strategicActions.length >= 1);
    assert.ok(view.executiveAnalysis.length >= EXECUTIVE_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length >= PILLOW_ADVISORY_EVALUATIONS.length);
    assert.ok(view.expectedOutcomes.length >= 1);
    assert.ok(view.executiveConfidence.length >= 1);
    assert.equal(view.readyForE415, true);
    assert.ok(view.topExecutiveRecommendations.every((r) => r.recommendationId && r.evidence.length >= 1));
  });

  test("assembleExecutiveAdvisoryEngine integrates E4-01 E4-13 E3 E2 E1 P9-02", () => {
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
    const executiveInsightEngine = buildFallbackExecutiveInsightEngine();
    const enterprisePatternEngine = buildFallbackEnterprisePatternEngine();
    const executiveBenchmarkEngine = buildFallbackExecutiveBenchmarkEngine();
    const crossBusinessIntelligence = buildFallbackCrossBusinessIntelligence();
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-14 Executive Advisory Engine" },
    });

    const view = assembleExecutiveAdvisoryEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      industryIntelligenceEngine,
      customerBehaviourIntelligence,
      innovationIntelligenceEngine,
      executiveKnowledgeGraph,
      executivePredictionEngine,
      executiveInsightEngine,
      enterprisePatternEngine,
      executiveBenchmarkEngine,
      crossBusinessIntelligence,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-14 Executive Advisory Engine" },
      supervisor: { status: "monitoring recommendation quality" },
      ecc: { status: "executive planning coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-14");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.crossBusinessIntelligence.includes("E4-13"));
    assert.ok(view.integrations.executiveInsightEngine.includes("E4-10"));
    assert.ok(view.integrations.executiveBenchmarkEngine.includes("E4-12"));
    assert.ok(view.integrations.executiveKnowledgeGraph.includes("E4-08"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.riskRecommendations.length >= 1);
    assert.ok(view.financialRecommendations.length >= 1);
    assert.equal(view.readyForE415, true);
  });
});
