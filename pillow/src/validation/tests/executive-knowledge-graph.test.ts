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
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutiveKnowledgeGraph,
  buildFallbackExecutiveKnowledgeGraph,
  KNOWLEDGE_GRAPH_PIPELINE,
  KNOWLEDGE_GRAPH_PRINCIPLES,
  GOVERNED_KNOWLEDGE_DOMAINS,
  KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS,
  PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS,
} from "../../executive-knowledge-graph/index.js";

describe("E4-08 Executive Knowledge Graph", () => {
  test("buildFallbackExecutiveKnowledgeGraph returns constitutional knowledge model", () => {
    const view = buildFallbackExecutiveKnowledgeGraph();
    assert.equal(view.engineVersion, "E4-08");
    assert.equal(view.knowledgeGraphPipeline.length, KNOWLEDGE_GRAPH_PIPELINE.length);
    assert.deepEqual(view.knowledgeGraphPrinciples, [...KNOWLEDGE_GRAPH_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_KNOWLEDGE_DOMAINS.length);
    assert.ok(view.knowledgeNetwork.length >= 10);
    assert.ok(view.entityRelationships.length >= 1);
    assert.ok(view.strategicConnections.length >= 1);
    assert.ok(view.knowledgeGraphAnalysis.length, KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.knowledgeGaps.length >= 1);
    assert.equal(view.readyForE409, true);
    assert.ok(view.knowledgeNetwork.every((e) => e.entityId && e.evidence.length >= 1));
  });

  test("assembleExecutiveKnowledgeGraph integrates E4-01 E4-07 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-08 Executive Knowledge Graph" },
    });

    const view = assembleExecutiveKnowledgeGraph({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      industryIntelligenceEngine,
      customerBehaviourIntelligence,
      innovationIntelligenceEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-08 Executive Knowledge Graph" },
      supervisor: { status: "monitoring knowledge graph health" },
      ecc: { status: "knowledge synchronization coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-08");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.innovationIntelligenceEngine.includes("E4-07"));
    assert.ok(view.integrations.customerBehaviourIntelligence.includes("E4-06"));
    assert.ok(view.integrations.threatDetectionEngine.includes("E4-04"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.opportunityNetwork.length >= 1);
    assert.ok(view.riskNetwork.length >= 1);
    assert.equal(view.readyForE409, true);
  });
});
