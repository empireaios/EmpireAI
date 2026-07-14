import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackMarketIntelligenceEngine } from "../../market-intelligence-engine/assembler.js";
import { buildFallbackCompetitorIntelligenceEngine } from "../../competitor-intelligence-engine/assembler.js";
import { buildFallbackOpportunityDiscoveryEngine } from "../../opportunity-discovery-engine/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleThreatDetectionEngine,
  buildFallbackThreatDetectionEngine,
  THREAT_DETECTION_PIPELINE,
  THREAT_DETECTION_PRINCIPLES,
  GOVERNED_THREAT_DOMAINS,
  THREAT_ANALYSIS_DOMAINS,
  PILLOW_THREAT_EVALUATIONS,
} from "../../threat-detection-engine/index.js";

describe("E4-04 Threat Detection Engine", () => {
  test("buildFallbackThreatDetectionEngine returns constitutional threat model", () => {
    const view = buildFallbackThreatDetectionEngine();
    assert.equal(view.engineVersion, "E4-04");
    assert.equal(view.threatDetectionPipeline.length, THREAT_DETECTION_PIPELINE.length);
    assert.deepEqual(view.threatPrinciples, [...THREAT_DETECTION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_THREAT_DOMAINS.length);
    assert.ok(view.threatDashboard.length >= 10);
    assert.ok(view.criticalThreats.length >= 1);
    assert.ok(view.emergingThreats.length >= 1);
    assert.ok(view.threatAnalysis.length, THREAT_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_THREAT_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.riskHeatmap.length >= 1);
    assert.ok(view.mitigationStatus.length >= 1);
    assert.equal(view.readyForE405, true);
    assert.ok(view.threatDashboard.every((t) => t.threatId && t.evidence.length >= 1));
  });

  test("assembleThreatDetectionEngine integrates E4-01 E4-02 E4-03 E3 E2 E1 P9-02", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const marketIntelligenceEngine = buildFallbackMarketIntelligenceEngine();
    const competitorIntelligenceEngine = buildFallbackCompetitorIntelligenceEngine();
    const opportunityDiscoveryEngine = buildFallbackOpportunityDiscoveryEngine();
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-04 Threat Detection Engine" },
    });

    const view = assembleThreatDetectionEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-04 Threat Detection Engine" },
      supervisor: { status: "monitoring threat detection" },
      ecc: { status: "threat response coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-04");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.competitorIntelligenceEngine.includes("E4-02"));
    assert.ok(view.integrations.opportunityDiscoveryEngine.includes("E4-03"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.threatTrends.length >= 1);
    assert.ok(view.businessImpact.length >= 1);
    assert.equal(view.readyForE405, true);
  });
});
