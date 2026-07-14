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
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleCrossBusinessIntelligence,
  buildFallbackCrossBusinessIntelligence,
  CROSS_BUSINESS_PIPELINE,
  CROSS_BUSINESS_PRINCIPLES,
  GOVERNED_CROSS_BUSINESS_DOMAINS,
  CROSS_BUSINESS_ANALYSIS_DOMAINS,
  PILLOW_CROSS_BUSINESS_EVALUATIONS,
} from "../../cross-business-intelligence/index.js";

describe("E4-13 Cross-Business Intelligence", () => {
  test("buildFallbackCrossBusinessIntelligence returns constitutional cross-business model", () => {
    const view = buildFallbackCrossBusinessIntelligence();
    assert.equal(view.engineVersion, "E4-13");
    assert.equal(view.crossBusinessPipeline.length, CROSS_BUSINESS_PIPELINE.length);
    assert.deepEqual(view.crossBusinessPrinciples, [...CROSS_BUSINESS_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CROSS_BUSINESS_DOMAINS.length);
    assert.ok(view.businessRelationships.length >= 10);
    assert.ok(view.enterpriseSynergies.length >= 1);
    assert.ok(view.knowledgeSharing.length >= 1);
    assert.ok(view.crossBusinessAnalysis.length >= CROSS_BUSINESS_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length >= PILLOW_CROSS_BUSINESS_EVALUATIONS.length);
    assert.ok(view.strategicRecommendations.length >= 1);
    assert.ok(view.executiveIntelligence.length >= 1);
    assert.equal(view.readyForE414, true);
    assert.ok(view.businessRelationships.every((r) => r.relationshipId && r.evidence.length >= 1));
  });

  test("assembleCrossBusinessIntelligence integrates E4-01 E4-12 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-13 Cross-Business Intelligence" },
    });

    const view = assembleCrossBusinessIntelligence({
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
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-13 Cross-Business Intelligence" },
      supervisor: { status: "monitoring cross-business intelligence health" },
      ecc: { status: "cross-business planning coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-13");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.executiveBenchmarkEngine.includes("E4-12"));
    assert.ok(view.integrations.enterprisePatternEngine.includes("E4-11"));
    assert.ok(view.integrations.executiveKnowledgeGraph.includes("E4-08"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.crossBusinessOpportunities.length >= 1);
    assert.ok(view.crossBusinessRisks.length >= 1);
    assert.equal(view.readyForE414, true);
  });
});
