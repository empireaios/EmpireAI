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
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleEnterprisePatternEngine,
  buildFallbackEnterprisePatternEngine,
  PATTERN_PIPELINE,
  PATTERN_PRINCIPLES,
  GOVERNED_PATTERN_DOMAINS,
  PATTERN_ANALYSIS_DOMAINS,
  PILLOW_PATTERN_EVALUATIONS,
} from "../../enterprise-pattern-engine/index.js";

describe("E4-11 Enterprise Pattern Engine", () => {
  test("buildFallbackEnterprisePatternEngine returns constitutional pattern model", () => {
    const view = buildFallbackEnterprisePatternEngine();
    assert.equal(view.engineVersion, "E4-11");
    assert.equal(view.patternPipeline.length, PATTERN_PIPELINE.length);
    assert.deepEqual(view.patternPrinciples, [...PATTERN_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_PATTERN_DOMAINS.length);
    assert.ok(view.patternCatalogue.length >= 10);
    assert.ok(view.recurringPatterns.length >= 1);
    assert.ok(view.emergingPatterns.length >= 1);
    assert.ok(view.patternAnalysis.length >= PATTERN_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length >= PILLOW_PATTERN_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.patternTrends.length >= 1);
    assert.equal(view.readyForE412, true);
    assert.ok(view.patternCatalogue.every((p) => p.patternId && p.evidence.length >= 1));
  });

  test("assembleEnterprisePatternEngine integrates E4-01 E4-10 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-11 Enterprise Pattern Engine" },
    });

    const view = assembleEnterprisePatternEngine({
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
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-11 Enterprise Pattern Engine" },
      supervisor: { status: "monitoring pattern detection health" },
      ecc: { status: "pattern distribution coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-11");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.executiveInsightEngine.includes("E4-10"));
    assert.ok(view.integrations.executivePredictionEngine.includes("E4-09"));
    assert.ok(view.integrations.executiveKnowledgeGraph.includes("E4-08"));
    assert.ok(view.integrations.threatDetectionEngine.includes("E4-04"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.riskPatterns.length >= 1);
    assert.ok(view.growthPatterns.length >= 1);
    assert.equal(view.readyForE412, true);
  });
});
