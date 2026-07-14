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
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutiveBenchmarkEngine,
  buildFallbackExecutiveBenchmarkEngine,
  BENCHMARK_PIPELINE,
  BENCHMARK_PRINCIPLES,
  GOVERNED_BENCHMARK_DOMAINS,
  BENCHMARK_ANALYSIS_DOMAINS,
  PILLOW_BENCHMARK_EVALUATIONS,
} from "../../executive-benchmark-engine/index.js";

describe("E4-12 Executive Benchmark Engine", () => {
  test("buildFallbackExecutiveBenchmarkEngine returns constitutional benchmark model", () => {
    const view = buildFallbackExecutiveBenchmarkEngine();
    assert.equal(view.engineVersion, "E4-12");
    assert.equal(view.benchmarkPipeline.length, BENCHMARK_PIPELINE.length);
    assert.deepEqual(view.benchmarkPrinciples, [...BENCHMARK_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_BENCHMARK_DOMAINS.length);
    assert.ok(view.performanceBenchmarks.length >= 10);
    assert.ok(view.industryRanking.length >= 1);
    assert.ok(view.performanceGaps.length >= 1);
    assert.ok(view.benchmarkAnalysis.length >= BENCHMARK_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length >= PILLOW_BENCHMARK_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.trendAnalysis.length >= 1);
    assert.equal(view.readyForE413, true);
    assert.ok(view.performanceBenchmarks.every((b) => b.benchmarkId && b.evidence.length >= 1));
  });

  test("assembleExecutiveBenchmarkEngine integrates E4-01 E4-11 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-12 Executive Benchmark Engine" },
    });

    const view = assembleExecutiveBenchmarkEngine({
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
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-12 Executive Benchmark Engine" },
      supervisor: { status: "monitoring benchmark accuracy" },
      ecc: { status: "benchmark review coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-12");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.enterprisePatternEngine.includes("E4-11"));
    assert.ok(view.integrations.executiveInsightEngine.includes("E4-10"));
    assert.ok(view.integrations.executivePredictionEngine.includes("E4-09"));
    assert.ok(view.integrations.executiveKnowledgeGraph.includes("E4-08"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.competitivePosition.length >= 1);
    assert.ok(view.improvementOpportunities.length >= 1);
    assert.equal(view.readyForE413, true);
  });
});
