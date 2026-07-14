import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CustomerBehaviourIntelligence } from "../customer-behaviour-intelligence/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { IndustryIntelligenceEngine } from "../industry-intelligence-engine/types.js";
import type { InnovationIntelligenceEngine } from "../innovation-intelligence-engine/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { MarketIntelligenceEngine } from "../market-intelligence-engine/types.js";
import type { OpportunityDiscoveryEngine } from "../opportunity-discovery-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { ThreatDetectionEngine } from "../threat-detection-engine/types.js";
import {
  KNOWLEDGE_GRAPH_PIPELINE,
  KNOWLEDGE_GRAPH_PRINCIPLES,
  GOVERNED_KNOWLEDGE_DOMAINS,
  KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS,
  PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveKnowledgeGraph,
  KnowledgeGraphPipelineStep,
  KnowledgeGraphPipelinePhase,
  KnowledgeEntityRecord,
  EntityRelationshipEntry,
  StrategicConnectionEntry,
  BusinessConnectionEntry,
  OpportunityNetworkEntry,
  RiskNetworkEntry,
  KnowledgeGapEntry,
  KnowledgeGraphAnalysisMetric,
  ExecutiveKnowledgeGraphRecommendation,
  PillowKnowledgeGraphEvaluationMetric,
  GovernedKnowledgeDomain,
  RelationshipClassification,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildPipeline(
  activePhase: KnowledgeGraphPipelinePhase = "continuous_learning",
): KnowledgeGraphPipelineStep[] {
  const activeIdx = KNOWLEDGE_GRAPH_PIPELINE.indexOf(activePhase);
  return KNOWLEDGE_GRAPH_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildKnowledgeNetwork(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): KnowledgeEntityRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets[0]?.marketName ?? "Global AI Enterprise";
  const topCompetitor = input.competitorIntelligenceEngine?.competitorLandscape[0]?.competitorName ?? "OpenAI";
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0]?.title ?? "Constitutional AI Platform";
  const topThreat = input.threatDetectionEngine?.criticalThreats[0]?.title ?? "Competitive Displacement";
  const topIndustry = input.industryIntelligenceEngine?.industryLandscape[0]?.industryName ?? "Enterprise AI";
  const topCustomer = input.customerBehaviourIntelligence?.customerSegments[0]?.customerSegment ?? "Enterprise AI Buyers";
  const topInnovation = input.innovationIntelligenceEngine?.innovationPipeline[0]?.title ?? "Constitutional AI Orchestration";

  const catalogue: Array<Omit<KnowledgeEntityRecord, "lastUpdated">> = [
    {
      entityId: "ekg-corporate-vision",
      entityName: "Corporate Vision Engine",
      entityType: "governance · strategy",
      domain: "strategies",
      relatedEntities: ["E4-01 Market Intelligence", "E4-07 Innovation Intelligence", "E1 Strategic Objectives"],
      relationshipType: "parent_relationship",
      relationshipStrength: 96,
      strategicImportance: "critical",
      businessImpact: "Constitutional north star · all executive knowledge aligned",
      financialImpact: "Enterprise value foundation",
      confidence: 95,
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "E1-02 corporate vision engine"],
    },
    {
      entityId: "ekg-market-intelligence",
      entityName: "Market Intelligence Engine",
      entityType: "market · E4-01",
      domain: "markets",
      relatedEntities: [topIndustry, topOpportunity, "E4-05 Industry Intelligence"],
      relationshipType: "strategic_relationship",
      relationshipStrength: 92,
      strategicImportance: "critical",
      businessImpact: `${input.marketIntelligenceEngine?.monitoredMarketCount ?? 12} markets monitored · global awareness`,
      financialImpact: "Market opportunity valuation",
      confidence: 93,
      evidence: ["E4-01 PILLOW-MIE-001", topMarket],
    },
    {
      entityId: "ekg-competitor-intelligence",
      entityName: "Competitor Intelligence Engine",
      entityType: "competitor · E4-02",
      domain: "competitors",
      relatedEntities: [topCompetitor, topThreat, "E4-04 Threat Detection"],
      relationshipType: "competitive_relationship",
      relationshipStrength: 90,
      strategicImportance: "critical",
      businessImpact: `${input.competitorIntelligenceEngine?.trackedCompetitorCount ?? 12} competitors tracked`,
      financialImpact: "Competitive revenue risk modeling",
      confidence: 91,
      evidence: ["E4-02 PILLOW-CIE-001", topCompetitor],
    },
    {
      entityId: "ekg-opportunity-discovery",
      entityName: "Opportunity Discovery Engine",
      entityType: "opportunity · E4-03",
      domain: "opportunities",
      relatedEntities: [topOpportunity, topCustomer, "E4-06 Customer Behaviour"],
      relationshipType: "strategic_relationship",
      relationshipStrength: 88,
      strategicImportance: "critical",
      businessImpact: `${input.opportunityDiscoveryEngine?.discoveredOpportunityCount ?? 12} opportunities discovered`,
      financialImpact: "Revenue growth pipeline",
      confidence: 90,
      evidence: ["E4-03 PILLOW-ODE-001", topOpportunity],
    },
    {
      entityId: "ekg-threat-detection",
      entityName: "Threat Detection Engine",
      entityType: "risk · E4-04",
      domain: "risks",
      relatedEntities: [topThreat, topCompetitor, "E4-02 Competitor Intelligence"],
      relationshipType: "dependency_relationship",
      relationshipStrength: 89,
      strategicImportance: "critical",
      businessImpact: `${input.threatDetectionEngine?.detectedThreatCount ?? 12} threats detected · early warning`,
      financialImpact: "Risk exposure quantification",
      confidence: 92,
      evidence: ["E4-04 PILLOW-TDE-001", topThreat],
    },
    {
      entityId: "ekg-industry-intelligence",
      entityName: "Industry Intelligence Engine",
      entityType: "industry · E4-05",
      domain: "industries",
      relatedEntities: [topIndustry, topMarket, "E4-01 Market Intelligence"],
      relationshipType: "parent_relationship",
      relationshipStrength: 87,
      strategicImportance: "high",
      businessImpact: `${input.industryIntelligenceEngine?.monitoredIndustryCount ?? 12} industries monitored`,
      financialImpact: "Industry opportunity sizing",
      confidence: 88,
      evidence: ["E4-05 PILLOW-IIE-001", topIndustry],
    },
    {
      entityId: "ekg-customer-behaviour",
      entityName: "Customer Behaviour Intelligence",
      entityType: "customer · E4-06",
      domain: "customers",
      relatedEntities: [topCustomer, topOpportunity, "E4-03 Opportunity Discovery"],
      relationshipType: "customer_relationship",
      relationshipStrength: 86,
      strategicImportance: "high",
      businessImpact: `${input.customerBehaviourIntelligence?.monitoredSegmentCount ?? 12} segments monitored`,
      financialImpact: "CLV · retention · purchase intent",
      confidence: 89,
      evidence: ["E4-06 PILLOW-CBI-001", topCustomer],
    },
    {
      entityId: "ekg-innovation-intelligence",
      entityName: "Innovation Intelligence Engine",
      entityType: "innovation · E4-07",
      domain: "innovations",
      relatedEntities: [topInnovation, "E4-05 Industry Intelligence", "E4-03 Opportunity Discovery"],
      relationshipType: "technology_relationship",
      relationshipStrength: 91,
      strategicImportance: "critical",
      businessImpact: `${input.innovationIntelligenceEngine?.discoveredInnovationCount ?? 12} innovations discovered`,
      financialImpact: "Innovation ROI modeling",
      confidence: 90,
      evidence: ["E4-07 PILLOW-INE-001", topInnovation],
    },
    {
      entityId: "ekg-financial-executive",
      entityName: "Financial Executive Certification",
      entityType: "financial · E3-16",
      domain: "financial_intelligence",
      relatedEntities: ["E4-03 Opportunity Discovery", "E4-06 Fintech CFO Segment", "E3 Capital Strategy"],
      relationshipType: "financial_relationship",
      relationshipStrength: 88,
      strategicImportance: "critical",
      businessImpact: "E3 Phase certified · AI CFO capabilities",
      financialImpact: "Capital strategy · financial governance",
      confidence: 94,
      evidence: ["E3-16 financial executive certified", "15 AI CFO capabilities"],
    },
    {
      entityId: "ekg-executive-decision",
      entityName: "Executive Decision Engine",
      entityType: "decision · E2",
      domain: "executive_decisions",
      relatedEntities: ["E4-04 Threat Detection", "E4-03 Opportunity Discovery", "E2-15 Autonomous Decision Monitor"],
      relationshipType: "operational_relationship",
      relationshipStrength: 85,
      strategicImportance: "high",
      businessImpact: "Constitutional decision governance",
      financialImpact: "Decision velocity · risk mitigation",
      confidence: 87,
      evidence: ["E2-16 executive decision certified", "Autonomous decision monitor"],
    },
    {
      entityId: "ekg-constitutional-platform",
      entityName: "Constitutional AI Enterprise Platform",
      entityType: "product · technology",
      domain: "technologies",
      relatedEntities: ["Pillow", "ECC", "Guardian", "VIE", "E4-07 Innovation"],
      relationshipType: "child_relationship",
      relationshipStrength: 95,
      strategicImportance: "critical",
      businessImpact: "Platform differentiation · constitutional moat",
      financialImpact: "$12M+ ARR potential",
      confidence: 93,
      evidence: ["E4-07 constitutional AI innovation", "Corporate vision alignment"],
    },
    {
      entityId: "ekg-future-knowledge",
      entityName: "Future Knowledge Domains",
      entityType: "future · emerging",
      domain: "future_knowledge_domains",
      relatedEntities: ["E4-07 Future Autonomous AI", "E4-04 Future Threats", "E4-05 Future Industries"],
      relationshipType: "future_relationship",
      relationshipStrength: 72,
      strategicImportance: "high",
      businessImpact: "Long-term knowledge evolution · emerging domains",
      financialImpact: "Future opportunity modeling",
      confidence: 78,
      evidence: ["E4-07 future innovation", "Knowledge evolution architecture"],
    },
  ];

  return catalogue.map((e) => ({ ...e, lastUpdated: nowIso() }));
}

function buildEntityRelationships(entities: KnowledgeEntityRecord[]): EntityRelationshipEntry[] {
  const pairs: Array<{
    source: KnowledgeEntityRecord;
    targetName: string;
    type: RelationshipClassification;
    strength: number;
  }> = [
    { source: entities[0]!, targetName: "E4-01 Market Intelligence", type: "parent_relationship", strength: 96 },
    { source: entities[1]!, targetName: "E4-05 Industry Intelligence", type: "strategic_relationship", strength: 92 },
    { source: entities[2]!, targetName: "E4-04 Threat Detection", type: "competitive_relationship", strength: 90 },
    { source: entities[3]!, targetName: "E4-06 Customer Behaviour", type: "strategic_relationship", strength: 88 },
    { source: entities[4]!, targetName: "E4-02 Competitor Intelligence", type: "dependency_relationship", strength: 89 },
    { source: entities[5]!, targetName: "E4-01 Market Intelligence", type: "parent_relationship", strength: 87 },
    { source: entities[6]!, targetName: "E4-03 Opportunity Discovery", type: "customer_relationship", strength: 86 },
    { source: entities[7]!, targetName: "E4-05 Industry Intelligence", type: "technology_relationship", strength: 91 },
    { source: entities[8]!, targetName: "E4-03 Opportunity Discovery", type: "financial_relationship", strength: 88 },
    { source: entities[9]!, targetName: "E4-04 Threat Detection", type: "operational_relationship", strength: 85 },
    { source: entities[10]!, targetName: "E4-07 Innovation Intelligence", type: "child_relationship", strength: 95 },
    { source: entities[11]!, targetName: "E4-07 Future Autonomous AI", type: "future_relationship", strength: 72 },
  ];

  return pairs.map((p, i) => ({
    relationshipId: `rel-${i + 1}`,
    sourceEntityId: p.source.entityId,
    sourceEntityName: p.source.entityName,
    targetEntityId: `target-${p.targetName.toLowerCase().replace(/\s+/g, "-")}`,
    targetEntityName: p.targetName,
    relationshipType: p.type.replace(/_/g, " "),
    relationshipStrength: p.strength,
    status: "active",
  }));
}

function buildStrategicConnections(entities: KnowledgeEntityRecord[]): StrategicConnectionEntry[] {
  return entities
    .filter((e) => e.strategicImportance === "critical" || e.relationshipStrength >= 88)
    .map((e) => ({
      connectionId: `strategic-${e.entityId}`,
      entityId: e.entityId,
      entityName: e.entityName,
      connectedEntity: e.relatedEntities[0] ?? "Executive Network",
      strategicImportance: e.strategicImportance,
      relationshipStrength: e.relationshipStrength,
      status: "connected",
    }));
}

function buildBusinessConnections(entities: KnowledgeEntityRecord[]): BusinessConnectionEntry[] {
  return entities
    .slice(0, 8)
    .map((e) => ({
      connectionId: `business-${e.entityId}`,
      entityId: e.entityId,
      entityName: e.entityName,
      connectedEntity: e.relatedEntities[1] ?? e.relatedEntities[0] ?? "Business Network",
      businessImpact: e.businessImpact,
      relationshipStrength: e.relationshipStrength,
      status: "active",
    }));
}

function buildOpportunityNetwork(input: {
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
}): OpportunityNetworkEntry[] {
  const opportunities = input.opportunityDiscoveryEngine?.priorityOpportunities.slice(0, 4) ?? [];
  const innovations = input.innovationIntelligenceEngine?.strategicOpportunities.slice(0, 3) ?? [];

  const oppEntries = opportunities.map((o, i) => ({
    networkId: `opp-net-${i + 1}`,
    entityId: `ode-${o.opportunityId}`,
    entityName: o.title,
    connectedOpportunities: "E4-01 Markets · E4-06 Customers · E4-05 Industries",
    networkStrength: o.opportunityScore,
    strategicValue: o.strategicValue,
    status: "active" as const,
  }));

  const innEntries = innovations.map((inn, i) => ({
    networkId: `inn-net-${i + 1}`,
    entityId: inn.innovationId,
    entityName: inn.title,
    connectedOpportunities: "E4-07 Innovation · E4-03 Opportunities · E4-05 Industries",
    networkStrength: inn.adoptionReadiness,
    strategicValue: inn.strategicImpact,
    status: "priority" as const,
  }));

  return [...oppEntries, ...innEntries];
}

function buildRiskNetwork(input: {
  threatDetectionEngine?: ThreatDetectionEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
}): RiskNetworkEntry[] {
  const threats = input.threatDetectionEngine?.criticalThreats.slice(0, 4) ?? [];
  const competitors = input.competitorIntelligenceEngine?.competitiveThreats.slice(0, 3) ?? [];

  const threatEntries = threats.map((t, i) => ({
    networkId: `risk-net-${i + 1}`,
    entityId: t.threatId,
    entityName: t.title,
    connectedRisks: "E4-02 Competitors · E4-04 Threats · E4-01 Markets",
    networkStrength: Math.round((t.probability + t.impact) / 2),
    severity: t.severity,
    status: "active" as const,
  }));

  const compEntries = competitors.map((c, i) => ({
    networkId: `comp-risk-${i + 1}`,
    entityId: c.threatId,
    entityName: c.title,
    connectedRisks: "E4-02 Competitor Intelligence · E4-04 Threat Detection",
    networkStrength: c.threatLevel,
    severity: c.severity,
    status: "monitoring" as const,
  }));

  return [...threatEntries, ...compEntries];
}

function buildKnowledgeGaps(): KnowledgeGapEntry[] {
  return [
    {
      gapId: "gap-regional-partnerships",
      domain: "businesses",
      gapDescription: "Regional partnership entity relationships incomplete",
      affectedEntities: "E4-01 APAC · E4-06 APAC Digital · E4-05 APAC Industry",
      priority: "high",
      remediation: "Expand partnership entity mapping · ECC coordination",
      status: "identified",
    },
    {
      gapId: "gap-supplier-network",
      domain: "products",
      gapDescription: "Supplier-product knowledge not yet linked to executive graph",
      affectedEntities: "Commerce · Products · Services",
      priority: "medium",
      remediation: "Future integration with commerce knowledge domains",
      status: "planned",
    },
    {
      gapId: "gap-prediction-layer",
      domain: "future_knowledge_domains",
      gapDescription: "Executive prediction relationships pending E4-09",
      affectedEntities: "E4-08 Knowledge Graph · Future Knowledge",
      priority: "high",
      remediation: "E4-09 Executive Prediction Engine integration",
      status: "ready",
    },
    {
      gapId: "gap-cross-domain-financial",
      domain: "financial_intelligence",
      gapDescription: "Cross-domain financial relationship density below target",
      affectedEntities: "E3 Financial · E4-03 Opportunities · E4-06 Customers",
      priority: "medium",
      remediation: "Strengthen E3-E4 financial relationship edges",
      status: "monitoring",
    },
  ];
}

function buildKnowledgeGraphAnalysis(entities: KnowledgeEntityRecord[], relationshipCount: number): KnowledgeGraphAnalysisMetric[] {
  const avgStrength = Math.round(
    entities.reduce((s, e) => s + e.relationshipStrength, 0) / Math.max(entities.length, 1),
  );
  const domainCoverage = new Set(entities.map((e) => e.domain)).size;

  const scores: Record<(typeof KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS)[number], number> = {
    knowledge_coverage: Math.round((domainCoverage / GOVERNED_KNOWLEDGE_DOMAINS.length) * 100),
    relationship_density: Math.min(100, Math.round((relationshipCount / Math.max(entities.length, 1)) * 25)),
    knowledge_gaps: 78,
    strategic_connections: avgStrength,
    business_connections: 86,
    financial_connections: 84,
    technology_connections: 88,
    opportunity_networks: 87,
    risk_networks: 85,
    long_term_knowledge_evolution: 82,
  };

  return KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS.map((domain) => {
    const score = scores[domain];
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 80 ? "strong" : score >= 65 ? "active" : "developing",
      summary: `${label(domain)} assessed at ${score}/100 across ${entities.length} entities · ${relationshipCount} relationships`,
    };
  });
}

function buildPillowEvaluations(input: {
  entityCount: number;
  relationshipCount: number;
  gapCount: number;
  avgStrength: number;
}): PillowKnowledgeGraphEvaluationMetric[] {
  const status = (score: number) =>
    score >= 85 ? "strong" : score >= 70 ? "active" : "developing";

  const evals: Record<(typeof PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS)[number], { score: number; summary: string }> = {
    knowledge_relationships: {
      score: input.avgStrength,
      summary: `${input.entityCount} entities · ${input.relationshipCount} relationships · connected intelligence active`,
    },
    strategic_connections: { score: 90, summary: "Critical strategic connections mapped across E4 executive engines" },
    knowledge_gaps: {
      score: input.gapCount <= 4 ? 82 : 68,
      summary: `${input.gapCount} knowledge gaps identified · remediation tracked`,
    },
    emerging_intelligence: { score: 86, summary: "Future knowledge domains · innovation · prediction pathways emerging" },
    executive_recommendations: { score: 91, summary: "Cross-domain executive recommendations generated from graph reasoning" },
  };

  return PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: status(evals[domain].score),
    summary: evals[domain].summary,
  }));
}

function buildRecommendations(entities: KnowledgeEntityRecord[]): ExecutiveKnowledgeGraphRecommendation[] {
  return [
    {
      id: "ekg-rec-1",
      title: "Strengthen E4 engine cross-relationship density",
      category: "graph_enrichment",
      why: `${entities.length} entities connected · opportunity to increase relationship density across E4-01 to E4-07`,
      what: "Map additional cross-domain edges · financial · competitive · customer · innovation",
      how: "E4 engines integration · knowledge correlation · continuous learning pipeline",
      confidencePercent: 93,
    },
    {
      id: "ekg-rec-2",
      title: "Close regional partnership knowledge gap",
      category: "gap_remediation",
      why: "Regional partnership entity relationships incomplete across APAC domains",
      what: "Expand partnership entity mapping · APAC market-customer-industry linkage",
      how: "E4-01 APAC · E4-05 industry · E4-06 customer · ECC coordination",
      confidencePercent: 86,
    },
    {
      id: "ekg-rec-3",
      title: "Prepare knowledge graph for E4-09 prediction layer",
      category: "prediction_readiness",
      why: "Executive prediction relationships pending · graph ready for prediction integration",
      what: "Prediction entity schema · temporal relationship edges · forecast correlation",
      how: "E4-09 Executive Prediction Engine · knowledge integration pipeline",
      confidencePercent: 88,
    },
    {
      id: "ekg-rec-4",
      title: "Activate constitutional platform as graph hub",
      category: "strategic_hub",
      why: "Constitutional AI Platform shows highest relationship strength (95) as central knowledge hub",
      what: "Position platform entity as primary graph connector · Pillow · ECC · Guardian · VIE",
      how: "E4-07 innovation · corporate vision · constitutional governance",
      confidencePercent: 94,
    },
  ];
}

export function assembleExecutiveKnowledgeGraph(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveKnowledgeGraph {
  const knowledgeNetwork = buildKnowledgeNetwork(input);
  const entityRelationships = buildEntityRelationships(knowledgeNetwork);
  const strategicConnections = buildStrategicConnections(knowledgeNetwork);
  const businessConnections = buildBusinessConnections(knowledgeNetwork);
  const opportunityNetwork = buildOpportunityNetwork(input);
  const riskNetwork = buildRiskNetwork(input);
  const knowledgeGaps = buildKnowledgeGaps();
  const knowledgeGraphAnalysis = buildKnowledgeGraphAnalysis(knowledgeNetwork, entityRelationships.length);

  const avgStrength = Math.round(
    knowledgeNetwork.reduce((s, e) => s + e.relationshipStrength, 0) / Math.max(knowledgeNetwork.length, 1),
  );

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.innovationIntelligenceEngine?.healthScore ?? 85,
    avgStrength,
    knowledgeGaps.length <= 4 ? 88 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    entityCount: knowledgeNetwork.length,
    relationshipCount: entityRelationships.length,
    gapCount: knowledgeGaps.length,
    avgStrength,
  });
  const recommendedActions = buildRecommendations(knowledgeNetwork);

  const pillowAdvisory = [
    "Executive Knowledge Graph — constitutional enterprise knowledge network active",
    `${knowledgeNetwork.length} entities · ${entityRelationships.length} relationships · ${strategicConnections.length} strategic connections`,
    "Every executive capability contributes knowledge · every relationship discoverable",
    `E4-01 to E4-07 engines integrated · E3 E2 E1 programmes connected`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting knowledge graph integrity")}`,
    "ECC coordinates knowledge synchronization · Supervisor monitors relationship integrity",
    "VIE validates knowledge alignment · vision · strategic · constitutional",
    "Grand King possesses a living executive intelligence network",
  ];

  return {
    engineVersion: "E4-08",
    computedAt: nowIso(),
    engineSummary:
      "Executive Knowledge Graph continuously connects people, businesses, markets, competitors, customers, technologies, strategies, risks, opportunities and executive decisions into one unified executive knowledge network. Every executive capability contributes knowledge. Every relationship becomes discoverable. The Grand King possesses a living executive intelligence network.",
    engineHealth: healthLabel(clampedHealth),
    knowledgeGraphHealth: avgStrength >= 85 ? "strong" : avgStrength >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    entityCount: knowledgeNetwork.length,
    relationshipCount: entityRelationships.length,
    strategicConnectionCount: strategicConnections.length,
    knowledgeGapCount: knowledgeGaps.length,
    averageRelationshipStrength: avgStrength,
    knowledgeNetwork,
    entityRelationships,
    strategicConnections,
    businessConnections,
    opportunityNetwork,
    riskNetwork,
    knowledgeGaps,
    knowledgeGraphAnalysis,
    knowledgeGraphPipeline: buildPipeline("continuous_learning"),
    recommendedActions,
    pillowEvaluations,
    knowledgeGraphPrinciples: [...KNOWLEDGE_GRAPH_PRINCIPLES],
    governedDomains: [...GOVERNED_KNOWLEDGE_DOMAINS],
    pillowAdvisory,
    integrations: {
      marketIntelligenceEngine: input.marketIntelligenceEngine
        ? `E4-01 · ${input.marketIntelligenceEngine.engineHealth} · ${input.marketIntelligenceEngine.monitoredMarketCount} markets`
        : "E4-01 · standby",
      competitorIntelligenceEngine: input.competitorIntelligenceEngine
        ? `E4-02 · ${input.competitorIntelligenceEngine.engineHealth} · ${input.competitorIntelligenceEngine.trackedCompetitorCount} competitors`
        : "E4-02 · standby",
      opportunityDiscoveryEngine: input.opportunityDiscoveryEngine
        ? `E4-03 · ${input.opportunityDiscoveryEngine.engineHealth} · ${input.opportunityDiscoveryEngine.discoveredOpportunityCount} opportunities`
        : "E4-03 · standby",
      threatDetectionEngine: input.threatDetectionEngine
        ? `E4-04 · ${input.threatDetectionEngine.engineHealth} · ${input.threatDetectionEngine.detectedThreatCount} threats`
        : "E4-04 · standby",
      industryIntelligenceEngine: input.industryIntelligenceEngine
        ? `E4-05 · ${input.industryIntelligenceEngine.engineHealth} · ${input.industryIntelligenceEngine.monitoredIndustryCount} industries`
        : "E4-05 · standby",
      customerBehaviourIntelligence: input.customerBehaviourIntelligence
        ? `E4-06 · ${input.customerBehaviourIntelligence.engineHealth} · ${input.customerBehaviourIntelligence.monitoredSegmentCount} segments`
        : "E4-06 · standby",
      innovationIntelligenceEngine: input.innovationIntelligenceEngine
        ? `E4-07 · ${input.innovationIntelligenceEngine.engineHealth} · ${input.innovationIntelligenceEngine.discoveredInnovationCount} innovations`
        : "E4-07 · standby",
      financialExecutiveCertification: input.financialExecutiveCertification?.programmeCertified
        ? "E3-16 · Phase E3 certified"
        : "E3 · integrated",
      executiveDecisionCertification: input.executiveDecisionCertification?.programmeCertified
        ? "E2-16 · certified"
        : "E2 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      knowledgeEvolution: input.knowledgeEvolution
        ? `P9-02 · ${input.knowledgeEvolution.knowledgeHealth} · ${input.knowledgeEvolution.recentKnowledge.length} knowledge items`
        : "P9-02 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "knowledge graph protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-08 Executive Knowledge Graph"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring knowledge graph health"),
      eccStatus: String(input.ecc?.status ?? "knowledge synchronization coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE409: true,
  };
}

export function buildFallbackExecutiveKnowledgeGraph(): ExecutiveKnowledgeGraph {
  return assembleExecutiveKnowledgeGraph({});
}
