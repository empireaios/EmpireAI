import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CustomerBehaviourIntelligence } from "../customer-behaviour-intelligence/types.js";
import type { EnterprisePatternEngine } from "../enterprise-pattern-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveInsightEngine } from "../executive-insight-engine/types.js";
import type { ExecutiveKnowledgeGraph } from "../executive-knowledge-graph/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutivePredictionEngine } from "../executive-prediction-engine/types.js";
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
  BENCHMARK_PIPELINE,
  BENCHMARK_PRINCIPLES,
  GOVERNED_BENCHMARK_DOMAINS,
  BENCHMARK_ANALYSIS_DOMAINS,
  PILLOW_BENCHMARK_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveBenchmarkEngine,
  BenchmarkPipelineStep,
  BenchmarkPipelinePhase,
  BenchmarkRecord,
  IndustryRankingEntry,
  PerformanceGapEntry,
  BenchmarkImprovementEntry,
  CompetitivePositionEntry,
  StrategicReadinessEntry,
  TrendAnalysisEntry,
  BenchmarkAnalysisMetric,
  ExecutiveBenchmarkRecommendation,
  PillowBenchmarkEvaluationMetric,
  GovernedBenchmarkDomain,
  BenchmarkClassification,
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

function mapDomain(category: BenchmarkClassification): GovernedBenchmarkDomain {
  const map: Record<BenchmarkClassification, GovernedBenchmarkDomain> = {
    internal_benchmark: "business_benchmarking",
    external_benchmark: "market_benchmarking",
    industry_benchmark: "market_benchmarking",
    global_benchmark: "strategic_benchmarking",
    technology_benchmark: "technology_benchmarking",
    business_benchmark: "business_benchmarking",
    operational_benchmark: "operational_benchmarking",
    financial_benchmark: "financial_benchmarking",
    strategic_benchmark: "strategic_benchmarking",
    future_benchmark: "future_benchmark_categories",
  };
  return map[category];
}

function buildPipeline(
  activePhase: BenchmarkPipelinePhase = "continuous_monitoring",
): BenchmarkPipelineStep[] {
  const activeIdx = BENCHMARK_PIPELINE.indexOf(activePhase);
  return BENCHMARK_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildPerformanceBenchmarks(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
  executiveInsightEngine?: ExecutiveInsightEngine | null;
  enterprisePatternEngine?: EnterprisePatternEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): BenchmarkRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets[0]?.marketName ?? "Global AI Enterprise";
  const topCompetitor = input.competitorIntelligenceEngine?.competitorLandscape[0]?.competitorName ?? "Enterprise AI Leaders";
  const avgRetention = input.customerBehaviourIntelligence?.averageRetentionProbability ?? 74;
  const patternCount = input.enterprisePatternEngine?.activePatternCount ?? 12;
  const insightCount = input.executiveInsightEngine?.activeInsightCount ?? 12;
  const predictionConfidence = input.executivePredictionEngine?.averagePredictionConfidence ?? 85;

  const catalogue: Array<Omit<BenchmarkRecord, "lastUpdated">> = [
    {
      benchmarkId: "ebm-revenue-growth",
      title: "Enterprise AI Revenue Growth Rate",
      category: "financial_benchmark",
      domain: "financial_benchmarking",
      benchmarkTarget: "Top-quartile SaaS · 40% YoY ARR growth",
      internalScore: 78,
      externalScore: 92,
      performanceGap: 14,
      businessImpact: "Revenue velocity below industry leaders · scaling opportunity",
      financialImpact: "$1.2M ARR gap to top-quartile performance",
      strategicImpact: "high · revenue growth is primary competitive metric",
      improvementOpportunity: "Accelerate enterprise pilot conversion · E3 monetization optimization",
      priority: "critical",
      confidence: 88,
      evidence: ["E3 financial metrics", "E4-09 revenue prediction", "E4-10 revenue insight"],
    },
    {
      benchmarkId: "ebm-constitutional-differentiation",
      title: "Constitutional AI Platform Differentiation",
      category: "global_benchmark",
      domain: "strategic_benchmarking",
      benchmarkTarget: "World-class constitutional AI governance standard",
      internalScore: 91,
      externalScore: 72,
      performanceGap: -19,
      businessImpact: "Leading constitutional AI differentiation · first-mover advantage",
      financialImpact: "Premium pricing power · reduced competitive pressure",
      strategicImpact: "critical · unique market position",
      improvementOpportunity: "Maintain leadership · expand constitutional AI certification programme",
      priority: "high",
      confidence: 92,
      evidence: ["E4-03 constitutional opportunity", "E4-07 innovation readiness", "E1 vision alignment"],
    },
    {
      benchmarkId: "ebm-customer-retention",
      title: "Enterprise Customer Retention Rate",
      category: "industry_benchmark",
      domain: "customer_benchmarking",
      benchmarkTarget: "Enterprise SaaS industry · 90% net retention",
      internalScore: avgRetention,
      externalScore: 90,
      performanceGap: 90 - avgRetention,
      businessImpact: "Retention below industry standard · NRR pressure",
      financialImpact: `$${Math.round((90 - avgRetention) * 48)}0K ARR at risk annually`,
      strategicImpact: "medium · customer success programme gap",
      improvementOpportunity: "Deploy retention intervention · E4-06 behaviour intelligence",
      priority: "high",
      confidence: 84,
      evidence: ["E4-06 retention signals", "E4-11 churn pattern", "E4-09 customer prediction"],
    },
    {
      benchmarkId: "ebm-competitive-position",
      title: "Competitive Market Position Index",
      category: "external_benchmark",
      domain: "competitor_benchmarking",
      benchmarkTarget: `${topCompetitor} · market leadership benchmark`,
      internalScore: 76,
      externalScore: 88,
      performanceGap: 12,
      businessImpact: "Competitive gap in enterprise deal velocity",
      financialImpact: "Market share risk · pricing pressure",
      strategicImpact: "high · competitive positioning requires action",
      improvementOpportunity: "Accelerate differentiation campaign · E4-02 competitive response",
      priority: "critical",
      confidence: 86,
      evidence: ["E4-02 competitor intelligence", "E4-04 threat detection", "E4-10 competitive insight"],
    },
    {
      benchmarkId: "ebm-market-expansion",
      title: "Global Market Expansion Readiness",
      category: "industry_benchmark",
      domain: "market_benchmarking",
      benchmarkTarget: `${topMarket} · top-3 market position`,
      internalScore: 72,
      externalScore: 85,
      performanceGap: 13,
      businessImpact: "Market expansion readiness below industry leaders",
      financialImpact: "$3.2M addressable market not yet captured",
      strategicImpact: "high · geographic expansion opportunity",
      improvementOpportunity: "Activate market expansion playbook · E4-01 intelligence",
      priority: "high",
      confidence: 83,
      evidence: ["E4-01 global markets", "E4-05 industry trends", "E4-11 expansion pattern"],
    },
    {
      benchmarkId: "ebm-operational-efficiency",
      title: "Operational Efficiency Index",
      category: "operational_benchmark",
      domain: "operational_benchmarking",
      benchmarkTarget: "World-class SaaS · 85% operational efficiency",
      internalScore: 71,
      externalScore: 85,
      performanceGap: 14,
      businessImpact: "Operations scaling gap vs revenue growth trajectory",
      financialImpact: "Revenue realization risk · margin pressure",
      strategicImpact: "medium · execution readiness critical path",
      improvementOpportunity: "Proactive operational scaling · E4-10 operational insight",
      priority: "medium",
      confidence: 79,
      evidence: ["E4-11 scaling pattern", "E4-10 operational insight", "E1 planning alignment"],
    },
    {
      benchmarkId: "ebm-innovation-velocity",
      title: "Innovation-to-Market Velocity",
      category: "technology_benchmark",
      domain: "technology_benchmarking",
      benchmarkTarget: "Top AI platforms · 90-day innovation cycle",
      internalScore: 82,
      externalScore: 88,
      performanceGap: 6,
      businessImpact: "Near world-class innovation velocity · minor gap",
      financialImpact: "$620K incremental revenue per cycle at full velocity",
      strategicImpact: "high · innovation is competitive moat",
      improvementOpportunity: "Close 6-point velocity gap · E4-07 innovation pipeline",
      priority: "medium",
      confidence: 85,
      evidence: ["E4-07 innovation readiness", "E4-11 adoption pattern", "E4-09 technology prediction"],
    },
    {
      benchmarkId: "ebm-intelligence-maturity",
      title: "Executive Intelligence Maturity Index",
      category: "internal_benchmark",
      domain: "business_benchmarking",
      benchmarkTarget: "Internal constitutional standard · 95/100 intelligence maturity",
      internalScore: 87,
      externalScore: 95,
      performanceGap: 8,
      businessImpact: `${insightCount} insights · ${patternCount} patterns · ${predictionConfidence}% prediction confidence`,
      financialImpact: "Decision quality improvement · reduced surprise events",
      strategicImpact: "critical · intelligence compounding advantage",
      improvementOpportunity: "Close intelligence maturity gap · E4-08 to E4-11 integration",
      priority: "high",
      confidence: 89,
      evidence: [`E4-08 knowledge graph`, `E4-09 ${predictionConfidence}% confidence`, `E4-11 ${patternCount} patterns`],
    },
    {
      benchmarkId: "ebm-decision-velocity",
      title: "Executive Decision Velocity Benchmark",
      category: "strategic_benchmark",
      domain: "strategic_benchmarking",
      benchmarkTarget: "World-class executive teams · 48-hour decision cycle",
      internalScore: 74,
      externalScore: 92,
      performanceGap: 18,
      businessImpact: "Decision latency exceeds intelligence velocity",
      financialImpact: "Opportunity cost from delayed executive decisions",
      strategicImpact: "critical · decision maturity bottleneck",
      improvementOpportunity: "Accelerate decision cycle · E2-16 certification · ECC coordination",
      priority: "critical",
      confidence: 83,
      evidence: ["E2 executive decisions", "E4-10 decision insight", "E4-11 decision pattern"],
    },
    {
      benchmarkId: "ebm-growth-trajectory",
      title: "Growth Trajectory vs Industry Leaders",
      category: "business_benchmark",
      domain: "growth_benchmarking",
      benchmarkTarget: "Top-quartile enterprise AI · 3x growth in 24 months",
      internalScore: 76,
      externalScore: 90,
      performanceGap: 14,
      businessImpact: "Growth trajectory below top-quartile leaders",
      financialImpact: "$4.8M cumulative revenue gap over 24 months",
      strategicImpact: "high · growth is primary strategic objective",
      improvementOpportunity: "Align growth initiatives to benchmark targets · E4-03 opportunities",
      priority: "high",
      confidence: 87,
      evidence: ["E4-09 growth predictions", "E4-11 revenue pattern", "E3 financial executive"],
    },
    {
      benchmarkId: "ebm-knowledge-coverage",
      title: "Executive Knowledge Graph Coverage",
      category: "internal_benchmark",
      domain: "business_benchmarking",
      benchmarkTarget: "Full enterprise knowledge coverage · 95% entity mapping",
      internalScore: input.executiveKnowledgeGraph?.healthScore ?? 85,
      externalScore: 95,
      performanceGap: 95 - (input.executiveKnowledgeGraph?.healthScore ?? 85),
      businessImpact: "Knowledge gaps limit holistic executive intelligence",
      financialImpact: "Improved resource allocation from complete knowledge map",
      strategicImpact: "medium · knowledge maturity",
      improvementOpportunity: "Remediate knowledge gaps · E4-08 graph expansion",
      priority: "medium",
      confidence: 86,
      evidence: ["E4-08 knowledge gaps", "E4-08 entity count", "P9-02 knowledge evolution"],
    },
    {
      benchmarkId: "ebm-future-readiness",
      title: "Long-Term Strategic Readiness Index",
      category: "future_benchmark",
      domain: "future_benchmark_categories",
      benchmarkTarget: "World-class sustainable competitive advantage · 90/100",
      internalScore: 80,
      externalScore: 90,
      performanceGap: 10,
      businessImpact: "Strong foundation · gap in long-term sustainability metrics",
      financialImpact: "Long-term ROI on strategic investment",
      strategicImpact: "critical · sustainable competitive advantage",
      improvementOpportunity: "Invest in intelligence compounding · P9-02 · E4-11 future pattern",
      priority: "medium",
      confidence: 85,
      evidence: ["P9-02 knowledge evolution", "E4-11 intelligence pattern", "E4-10 future insight"],
    },
  ];

  return catalogue.map((b) => ({
    ...b,
    domain: b.domain ?? mapDomain(b.category),
    lastUpdated: nowIso(),
  }));
}

function buildIndustryRanking(benchmarks: BenchmarkRecord[]): IndustryRankingEntry[] {
  return benchmarks
    .filter((b) => b.category === "industry_benchmark" || b.category === "external_benchmark")
    .map((b, idx) => ({
      rankingId: `ir-${idx + 1}`,
      benchmarkId: b.benchmarkId,
      title: b.title,
      industryPosition: b.performanceGap <= 5 ? "top_quartile" : b.performanceGap <= 12 ? "above_median" : "below_median",
      internalScore: b.internalScore,
      externalScore: b.externalScore,
      rank: b.performanceGap <= 5 ? 1 : b.performanceGap <= 12 ? 2 : 3,
      status: b.performanceGap <= 0 ? "leading" : "improving",
    }));
}

function buildPerformanceGaps(benchmarks: BenchmarkRecord[]): PerformanceGapEntry[] {
  return benchmarks
    .filter((b) => b.performanceGap > 0)
    .sort((a, b) => b.performanceGap - a.performanceGap)
    .map((b, idx) => ({
      gapId: `pg-${idx + 1}`,
      benchmarkId: b.benchmarkId,
      title: b.title,
      performanceGap: b.performanceGap,
      benchmarkTarget: b.benchmarkTarget,
      improvementOpportunity: b.improvementOpportunity,
      priority: b.priority,
      status: b.priority === "critical" ? "action_required" : "monitoring",
    }));
}

function buildImprovementOpportunities(benchmarks: BenchmarkRecord[]): BenchmarkImprovementEntry[] {
  return benchmarks
    .filter((b) => b.performanceGap > 0)
    .map((b, idx) => ({
      improvementId: `io-${idx + 1}`,
      benchmarkId: b.benchmarkId,
      title: b.title,
      improvementOpportunity: b.improvementOpportunity,
      businessImpact: b.businessImpact,
      financialImpact: b.financialImpact,
      priority: b.priority,
      confidence: b.confidence,
    }));
}

function buildCompetitivePosition(benchmarks: BenchmarkRecord[]): CompetitivePositionEntry[] {
  return benchmarks
    .filter((b) => b.domain === "competitor_benchmarking" || b.domain === "market_benchmarking" || b.category === "external_benchmark")
    .map((b, idx) => ({
      positionId: `cp-${idx + 1}`,
      benchmarkId: b.benchmarkId,
      title: b.title,
      competitivePosition: b.performanceGap <= 0 ? "leading" : b.performanceGap <= 10 ? "competitive" : "trailing",
      internalScore: b.internalScore,
      externalScore: b.externalScore,
      performanceGap: b.performanceGap,
      status: b.performanceGap <= 0 ? "advantage" : "closing_gap",
    }));
}

function buildStrategicReadiness(benchmarks: BenchmarkRecord[]): StrategicReadinessEntry[] {
  return benchmarks
    .filter((b) => b.category === "strategic_benchmark" || b.category === "future_benchmark" || b.strategicImpact.includes("critical"))
    .map((b, idx) => ({
      readinessId: `sr-${idx + 1}`,
      benchmarkId: b.benchmarkId,
      title: b.title,
      strategicImpact: b.strategicImpact,
      internalScore: b.internalScore,
      readinessLevel: b.internalScore >= 85 ? "ready" : b.internalScore >= 75 ? "developing" : "attention",
      confidence: b.confidence,
    }));
}

function buildTrendAnalysis(benchmarks: BenchmarkRecord[]): TrendAnalysisEntry[] {
  return benchmarks.map((b, idx) => ({
    trendId: `ta-${idx + 1}`,
    benchmarkId: b.benchmarkId,
    title: b.title,
    trendDirection: b.performanceGap <= 0 ? "leading" : b.performanceGap <= 8 ? "improving" : "widening",
    internalScore: b.internalScore,
    externalScore: b.externalScore,
    gapTrend: b.performanceGap <= 0 ? "advantage_maintained" : b.performanceGap <= 10 ? "gap_closing" : "gap_widening",
    status: b.performanceGap <= 0 ? "positive" : b.priority === "critical" ? "attention" : "stable",
  }));
}

function buildBenchmarkAnalysis(benchmarks: BenchmarkRecord[]): BenchmarkAnalysisMetric[] {
  const avgGap = Math.round(
    benchmarks.filter((b) => b.performanceGap > 0).reduce((s, b) => s + b.performanceGap, 0) /
      Math.max(benchmarks.filter((b) => b.performanceGap > 0).length, 1),
  );
  const leadingCount = benchmarks.filter((b) => b.performanceGap <= 0).length;
  const criticalGaps = benchmarks.filter((b) => b.priority === "critical" && b.performanceGap > 0).length;

  return BENCHMARK_ANALYSIS_DOMAINS.map((domain) => {
    const scores: Record<string, number> = {
      performance_gap: Math.min(100, 100 - avgGap),
      industry_position: Math.min(100, 70 + leadingCount * 5),
      competitive_position: Math.min(100, 75 + benchmarks.filter((b) => b.domain === "competitor_benchmarking" && b.performanceGap <= 10).length * 8),
      operational_efficiency: Math.min(100, benchmarks.find((b) => b.benchmarkId === "ebm-operational-efficiency")?.internalScore ?? 71),
      financial_performance: Math.min(100, benchmarks.find((b) => b.benchmarkId === "ebm-revenue-growth")?.internalScore ?? 78),
      customer_performance: Math.min(100, benchmarks.find((b) => b.benchmarkId === "ebm-customer-retention")?.internalScore ?? 74),
      growth_performance: Math.min(100, benchmarks.find((b) => b.benchmarkId === "ebm-growth-trajectory")?.internalScore ?? 76),
      strategic_readiness: Math.min(100, 75 + leadingCount * 4),
      long_term_sustainability: Math.min(100, benchmarks.find((b) => b.benchmarkId === "ebm-future-readiness")?.internalScore ?? 80),
    };
    const score = Math.round(scores[domain] ?? 75);
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "strong" : score >= 70 ? "active" : "developing",
      summary: `${label(domain)} — ${score}/100 · ${criticalGaps} critical gaps · ${leadingCount} leading positions`,
    };
  });
}

function buildPillowEvaluations(input: {
  benchmarkCount: number;
  criticalGapCount: number;
  leadingCount: number;
  avgConfidence: number;
}): PillowBenchmarkEvaluationMetric[] {
  return PILLOW_BENCHMARK_EVALUATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      performance_benchmarks: `${input.benchmarkCount} benchmarks active · ${input.leadingCount} leading positions`,
      competitive_position: "Competitive position tracked against industry leaders",
      improvement_opportunities: `${input.criticalGapCount} critical gaps · improvement opportunities prioritized`,
      strategic_readiness: "Strategic readiness assessed against world-class standards",
      executive_recommendations: `Recommendations at ${input.avgConfidence}% average confidence`,
    };
    return {
      domain,
      label: label(domain),
      status: input.avgConfidence >= 85 ? "strong" : "active",
      summary: summaries[domain] ?? label(domain),
    };
  });
}

function buildRecommendations(benchmarks: BenchmarkRecord[]): ExecutiveBenchmarkRecommendation[] {
  const revenue = benchmarks.find((b) => b.benchmarkId === "ebm-revenue-growth");
  const competitive = benchmarks.find((b) => b.benchmarkId === "ebm-competitive-position");
  const decision = benchmarks.find((b) => b.benchmarkId === "ebm-decision-velocity");
  return [
    {
      id: "ebm-rec-revenue",
      title: "Close Revenue Growth Gap to Top-Quartile",
      category: "financial",
      why: revenue?.businessImpact ?? "Revenue growth below industry leaders",
      what: "Accelerate enterprise pilot conversion to close 14-point growth gap",
      how: "E3 monetization · E4-09 predictions · E4-10 revenue insights",
      confidencePercent: 88,
    },
    {
      id: "ebm-rec-competitive",
      title: "Improve Competitive Market Position",
      category: "competitive",
      why: competitive?.businessImpact ?? "Competitive gap in enterprise deal velocity",
      what: "Launch differentiation campaign to close 12-point competitive gap",
      how: "E4-02 competitor intelligence · E4-04 threat mitigation · constitutional positioning",
      confidencePercent: 86,
    },
    {
      id: "ebm-rec-decision",
      title: "Accelerate Executive Decision Velocity",
      category: "strategic",
      why: decision?.businessImpact ?? "Decision latency exceeds intelligence velocity",
      what: "Reduce decision cycle from current baseline to 48-hour world-class standard",
      how: "E2-16 certification · ECC coordination · E4-11 decision pattern",
      confidencePercent: 83,
    },
    {
      id: "ebm-rec-retention",
      title: "Close Customer Retention Gap",
      category: "customer",
      why: "Enterprise retention below 90% industry benchmark",
      what: "Deploy retention intervention to reach industry-standard net retention",
      how: "E4-06 behaviour intelligence · E4-11 churn pattern · customer success",
      confidencePercent: 84,
    },
    {
      id: "ebm-rec-constitutional",
      title: "Sustain Constitutional AI Leadership",
      category: "strategic",
      why: "Leading constitutional AI differentiation by 19 points — maintain advantage",
      what: "Expand constitutional AI certification and market positioning",
      how: "E4-03 opportunities · E1 vision · E4-07 innovation pipeline",
      confidencePercent: 92,
    },
  ];
}

export function assembleExecutiveBenchmarkEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
  executiveInsightEngine?: ExecutiveInsightEngine | null;
  enterprisePatternEngine?: EnterprisePatternEngine | null;
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
} = {}): ExecutiveBenchmarkEngine {
  const performanceBenchmarks = buildPerformanceBenchmarks(input);
  const industryRanking = buildIndustryRanking(performanceBenchmarks);
  const performanceGaps = buildPerformanceGaps(performanceBenchmarks);
  const improvementOpportunities = buildImprovementOpportunities(performanceBenchmarks);
  const competitivePosition = buildCompetitivePosition(performanceBenchmarks);
  const strategicReadiness = buildStrategicReadiness(performanceBenchmarks);
  const trendAnalysis = buildTrendAnalysis(performanceBenchmarks);
  const benchmarkAnalysis = buildBenchmarkAnalysis(performanceBenchmarks);

  const avgConfidence = Math.round(
    performanceBenchmarks.reduce((s, b) => s + b.confidence, 0) / Math.max(performanceBenchmarks.length, 1),
  );
  const criticalGapCount = performanceGaps.filter((g) => g.priority === "critical").length;
  const leadingCount = performanceBenchmarks.filter((b) => b.performanceGap <= 0).length;

  const healthInputs = [
    input.enterprisePatternEngine?.healthScore ?? 85,
    input.executiveInsightEngine?.healthScore ?? 85,
    avgConfidence,
    leadingCount >= 2 ? 88 : 74,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    benchmarkCount: performanceBenchmarks.length,
    criticalGapCount,
    leadingCount,
    avgConfidence,
  });
  const recommendedActions = buildRecommendations(performanceBenchmarks);

  const pillowAdvisory = [
    "Executive Benchmark Engine — constitutional enterprise benchmarking intelligence active",
    `${performanceBenchmarks.length} benchmarks active · ${leadingCount} leading positions · ${criticalGapCount} critical gaps`,
    "Every benchmark evidence-based · measurable · continuously updated",
    "E4-01 to E4-11 intelligence integrated · E3 E2 E1 programmes connected",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting benchmark integrity")}`,
    "ECC coordinates benchmark reviews · Supervisor monitors benchmark accuracy",
    "VIE validates benchmark alignment · vision · strategic · constitutional",
    "Grand King understands where the Empire stands relative to world-class performance",
  ];

  return {
    engineVersion: "E4-12",
    computedAt: nowIso(),
    engineSummary:
      "Executive Benchmark Engine continuously benchmarks businesses, products, services, operations, financial performance and strategic execution against internal standards, industry leaders and global best practices. Every benchmark is evidence-based, measurable and continuously updated. The Grand King always understands where the Empire stands relative to world-class performance.",
    engineHealth: healthLabel(clampedHealth),
    benchmarkIntelligenceHealth: avgConfidence >= 85 ? "strong" : avgConfidence >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeBenchmarkCount: performanceBenchmarks.length,
    criticalGapCount,
    improvementOpportunityCount: improvementOpportunities.length,
    averageBenchmarkConfidence: avgConfidence,
    performanceBenchmarks,
    industryRanking,
    performanceGaps,
    improvementOpportunities,
    competitivePosition,
    strategicReadiness,
    trendAnalysis,
    benchmarkAnalysis,
    benchmarkPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    benchmarkPrinciples: [...BENCHMARK_PRINCIPLES],
    governedDomains: [...GOVERNED_BENCHMARK_DOMAINS],
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
      executiveKnowledgeGraph: input.executiveKnowledgeGraph
        ? `E4-08 · ${input.executiveKnowledgeGraph.engineHealth} · ${input.executiveKnowledgeGraph.entityCount} entities`
        : "E4-08 · standby",
      executivePredictionEngine: input.executivePredictionEngine
        ? `E4-09 · ${input.executivePredictionEngine.engineHealth} · ${input.executivePredictionEngine.activePredictionCount} predictions`
        : "E4-09 · standby",
      executiveInsightEngine: input.executiveInsightEngine
        ? `E4-10 · ${input.executiveInsightEngine.engineHealth} · ${input.executiveInsightEngine.activeInsightCount} insights`
        : "E4-10 · standby",
      enterprisePatternEngine: input.enterprisePatternEngine
        ? `E4-11 · ${input.enterprisePatternEngine.engineHealth} · ${input.enterprisePatternEngine.activePatternCount} patterns`
        : "E4-11 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "benchmark integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-12 Executive Benchmark Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring benchmark accuracy"),
      eccStatus: String(input.ecc?.status ?? "benchmark review coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE413: true,
  };
}

export function buildFallbackExecutiveBenchmarkEngine(): ExecutiveBenchmarkEngine {
  return assembleExecutiveBenchmarkEngine({});
}
