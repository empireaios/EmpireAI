import type { StrategicRecommendationEngineConfiguration } from "./configuration.js";
import {
  APPROVAL_REQUIREMENTS,
  CATEGORY_LABELS,
  PRIORITY_LEVELS,
  REC_METADATA_VERSION,
  RECOMMENDATION_CATEGORIES,
} from "./paths.js";
import type {
  ApprovalRequirement,
  EmpireStateAnalysis,
  PriorityLevel,
  RecommendationPackage,
  StrategicRecommendationInput,
  ValidationStatus,
} from "./types.js";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type Blueprint = {
  category: string;
  title: string;
  summary: string;
  businessImpact: string;
  estimatedBenefit: string;
  estimatedCost: string;
  strategicValue: number;
  confidence: number;
  priority: PriorityLevel;
  approvalRequirement: ApprovalRequirement;
  dependencies: string[];
  trigger: (analysis: EmpireStateAnalysis, input: StrategicRecommendationInput) => boolean;
};

const BLUEPRINTS: Blueprint[] = [
  {
    category: "revenue_growth",
    title: "Accelerate monetization of high-signal growth corridors",
    summary: "Prioritize revenue capture where active businesses and market signals already indicate upside.",
    businessImpact: "Increases top-line contribution from under-monetized corridors",
    estimatedBenefit: "High revenue upside within 1–2 planning cycles",
    estimatedCost: "Moderate go-to-market and enablement spend",
    strategicValue: 86,
    confidence: 74,
    priority: "high",
    approvalRequirement: "pillow_approval",
    dependencies: ["opportunity-scanner", "business-state-manager"],
    trigger: (a, i) =>
      a.opportunitiesDetected.length > 0 ||
      (i.opportunityHints?.length ?? 0) > 0 ||
      a.dimensions.some((d) => d.dimensionId === "business_performance" && d.score < 75),
  },
  {
    category: "cost_reduction",
    title: "Compress low-yield operating spend without cutting growth capacity",
    summary: "Reallocate cost from low-yield activities into higher strategic-value execution paths.",
    businessImpact: "Improves margin while preserving strategic optionality",
    estimatedBenefit: "Medium margin recovery",
    estimatedCost: "Low redesign and governance overhead",
    strategicValue: 78,
    confidence: 72,
    priority: "medium",
    approvalRequirement: "pillow_approval",
    dependencies: ["execution-memory", "business-state-manager"],
    trigger: (a) =>
      a.dimensions.some((d) => d.dimensionId === "business_performance" && d.score < 70) ||
      a.bottlenecksDetected.some((b) => /manual|delay/i.test(b)),
  },
  {
    category: "business_expansion",
    title: "Stage controlled expansion into adjacent opportunity domains",
    summary: "Expand where opportunity and risk balance supports phased entry rather than full commitment.",
    businessImpact: "Diversifies portfolio growth beyond current core",
    estimatedBenefit: "High strategic option value",
    estimatedCost: "Medium capital and compliance readiness cost",
    strategicValue: 84,
    confidence: 68,
    priority: "high",
    approvalRequirement: "grand_king_approval",
    dependencies: ["decision-engine", "approval-router"],
    trigger: (a, i) =>
      a.opportunitiesDetected.some((o) => /expand|market|adjacent/i.test(o)) ||
      (i.activeBusinessHints?.some((h) => /expand|launch|scale/i.test(h)) ?? false),
  },
  {
    category: "product_improvement",
    title: "Close product gaps that suppress conversion and retention",
    summary: "Target product friction points linked to customer and performance signals.",
    businessImpact: "Improves conversion quality and retention durability",
    estimatedBenefit: "Medium-to-high retention lift",
    estimatedCost: "Medium product and engineering investment",
    strategicValue: 76,
    confidence: 70,
    priority: "medium",
    approvalRequirement: "pillow_approval",
    dependencies: ["opportunity-scanner"],
    trigger: (a, i) =>
      (i.businessPerformanceHints?.some((h) => /churn|conversion|product/i.test(h)) ?? false) ||
      a.overallHealthScore < 70,
  },
  {
    category: "workforce_optimization",
    title: "Rebalance workforce capacity against bottlenecked mission queues",
    summary: "Optimize category allocation and throughput where workforce friction is constraining delivery.",
    businessImpact: "Raises execution velocity without indiscriminate hiring",
    estimatedBenefit: "High throughput recovery",
    estimatedCost: "Low-to-medium redistribution cost",
    strategicValue: 81,
    confidence: 73,
    priority: "high",
    approvalRequirement: "pillow_approval",
    dependencies: ["executive-planner", "execution-memory"],
    trigger: (a) =>
      a.dimensions.some((d) => d.dimensionId === "workforce_performance" && d.score < 72) ||
      a.bottlenecksDetected.length > 0,
  },
  {
    category: "infrastructure_improvement",
    title: "Hardening platform capacity ahead of scale pressure",
    summary: "Address infrastructure fragility and capacity limits before growth initiatives amplify them.",
    businessImpact: "Protects reliability and scale readiness",
    estimatedBenefit: "High risk-adjusted continuity benefit",
    estimatedCost: "Medium platform investment",
    strategicValue: 80,
    confidence: 71,
    priority: "high",
    approvalRequirement: "pillow_approval",
    dependencies: ["business-state-manager"],
    trigger: (a) =>
      a.dimensions.some((d) => d.dimensionId === "infrastructure" && d.score < 70) ||
      a.risksDetected.some((r) => /infra|fragile|capacity|outage/i.test(r)),
  },
  {
    category: "security",
    title: "Elevate security posture for high-consequence operational paths",
    summary: "Prioritize security controls where risk signals indicate elevated exposure.",
    businessImpact: "Reduces downside from security and compliance incidents",
    estimatedBenefit: "Critical risk reduction",
    estimatedCost: "Medium control and audit investment",
    strategicValue: 88,
    confidence: 76,
    priority: "critical",
    approvalRequirement: "grand_king_approval",
    dependencies: ["approval-router", "decision-engine"],
    trigger: (a, i) =>
      a.risksDetected.some((r) => /security|vulnerab|compliance/i.test(r)) ||
      (i.riskHints?.some((h) => /security|breach|compliance/i.test(h)) ?? false),
  },
  {
    category: "customer_experience",
    title: "Remove customer friction in highest-volume journeys",
    summary: "Improve experience quality where bottlenecks and performance signals intersect customer paths.",
    businessImpact: "Improves satisfaction and lifetime value",
    estimatedBenefit: "Medium retention and advocacy lift",
    estimatedCost: "Low-to-medium experience redesign cost",
    strategicValue: 74,
    confidence: 69,
    priority: "medium",
    approvalRequirement: "pillow_approval",
    dependencies: ["opportunity-scanner"],
    trigger: (a, i) =>
      (i.bottleneckHints?.some((h) => /customer|support|experience/i.test(h)) ?? false) ||
      a.overallHealthScore < 68,
  },
  {
    category: "automation",
    title: "Automate recurring operational handoffs and approval lag paths",
    summary: "Convert repetitive manual bottlenecks into governed automation opportunities.",
    businessImpact: "Reduces cycle time and human oversight load",
    estimatedBenefit: "High operational leverage",
    estimatedCost: "Medium automation build cost",
    strategicValue: 85,
    confidence: 75,
    priority: "high",
    approvalRequirement: "pillow_approval",
    dependencies: ["approval-router", "execution-memory"],
    trigger: (a) =>
      a.bottlenecksDetected.some((b) => /manual|approval|handoff|queue/i.test(b)) ||
      a.dimensions.some((d) => d.dimensionId === "operational_bottlenecks" && d.score < 70),
  },
  {
    category: "risk_mitigation",
    title: "Contain strategic risks before they compound into execution failure",
    summary: "Sequence mitigation actions against the highest-confidence risk signals.",
    businessImpact: "Protects enterprise continuity and governance integrity",
    estimatedBenefit: "High downside protection",
    estimatedCost: "Medium mitigation and monitoring cost",
    strategicValue: 87,
    confidence: 77,
    priority: "critical",
    approvalRequirement: "grand_king_approval",
    dependencies: ["decision-engine", "approval-router"],
    trigger: (a) => a.risksDetected.length > 0,
  },
  {
    category: "operational_excellence",
    title: "Institutionalize bottleneck clearance and performance feedback loops",
    summary: "Raise baseline operating discipline using analysis findings and execution memory patterns.",
    businessImpact: "Improves predictable delivery quality across missions",
    estimatedBenefit: "Medium-to-high reliability lift",
    estimatedCost: "Low process and telemetry investment",
    strategicValue: 73,
    confidence: 72,
    priority: "medium",
    approvalRequirement: "none",
    dependencies: ["execution-memory", "business-state-manager"],
    trigger: () => true,
  },
];

let recommendationSequence = 0;

export class RecommendationGenerator {
  generate(
    input: StrategicRecommendationInput,
    analysis: EmpireStateAnalysis,
    configuration: StrategicRecommendationEngineConfiguration,
    validationStatus: ValidationStatus,
  ): RecommendationPackage[] {
    const categories = resolveCategories(input, configuration);
    const max = Math.min(
      configuration.maxRecommendations,
      input.maxRecommendations ?? configuration.maxRecommendations,
    );

    const matched = BLUEPRINTS.filter(
      (bp) => categories.includes(bp.category) && bp.trigger(analysis, input),
    );

    const packages = matched.slice(0, max).map((bp) => toPackage(bp, input, analysis, validationStatus));

    while (packages.length < configuration.minRecommendations) {
      const fallback = BLUEPRINTS[packages.length % BLUEPRINTS.length]!;
      if (!categories.includes(fallback.category) && !categories.includes("*")) {
        packages.push(
          toPackage(
            {
              ...fallback,
              category: categories[packages.length % categories.length] ?? "operational_excellence",
              title: `Structured strategic alternative ${packages.length + 1}`,
              priority: "informational",
              approvalRequirement: "none",
              strategicValue: 60,
              confidence: 55,
            },
            input,
            analysis,
            validationStatus,
          ),
        );
      } else {
        packages.push(toPackage(fallback, input, analysis, validationStatus));
      }
      if (packages.length >= max) break;
    }

    return packages;
  }
}

export function resetRecommendationSequenceForTesting() {
  recommendationSequence = 0;
}

function resolveCategories(
  input: StrategicRecommendationInput,
  configuration: StrategicRecommendationEngineConfiguration,
): string[] {
  const hints = (input.categoryHints ?? [])
    .map((c) => c.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
  return Array.from(new Set([...configuration.recommendationCategories, ...hints]));
}

function toPackage(
  bp: Blueprint,
  input: StrategicRecommendationInput,
  analysis: EmpireStateAnalysis,
  validationStatus: ValidationStatus,
): RecommendationPackage {
  recommendationSequence += 1;
  const healthAdj = Math.round((analysis.overallHealthScore - 70) / 5);
  const confidenceScore = clamp(bp.confidence + healthAdj + ((input.evidenceHints?.length ?? 0) > 0 ? 4 : 0));
  const strategicValue = clamp(bp.strategicValue + (analysis.risksDetected.length > 2 ? 2 : 0));
  const priority = normalizePriority(bp.priority, analysis);
  const approvalRequirement = normalizeApproval(bp.approvalRequirement, priority);
  const categoryLabel =
    bp.category in CATEGORY_LABELS
      ? CATEGORY_LABELS[bp.category as keyof typeof CATEGORY_LABELS]
      : bp.category
          .split("_")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ");

  const rationale =
    `Recommended under ${categoryLabel} because empire analysis (${analysis.overallHealthScore}/100) ` +
    `shows relevant signals across opportunities=${analysis.opportunitiesDetected.length}, ` +
    `risks=${analysis.risksDetected.length}, bottlenecks=${analysis.bottlenecksDetected.length}. ` +
    `Priority ${priority} reflects strategic value ${strategicValue} and confidence ${confidenceScore}.`;

  return {
    recommendationId: `rec-pkg-${Date.now()}-${recommendationSequence}`,
    timestamp: new Date().toISOString(),
    executiveCategory: bp.category,
    recommendationTitle: bp.title,
    executiveSummary: bp.summary,
    businessImpact: bp.businessImpact,
    strategicValue,
    estimatedBenefit: bp.estimatedBenefit,
    estimatedCost: bp.estimatedCost,
    riskAssessment: buildRisks(input, analysis, bp.category),
    confidenceScore,
    supportingEvidence: [
      ...(input.evidenceHints ?? []).map((e) => e.trim()).filter(Boolean),
      `structural://empire-analysis/${analysis.analysisId}`,
      `overall_health=${analysis.overallHealthScore}`,
      `category=${bp.category}`,
      ...analysis.dimensions.slice(0, 2).flatMap((d) => d.findings.slice(0, 1)),
    ],
    dependencies: [...bp.dependencies],
    approvalRequirement,
    priority,
    metadataVersion: REC_METADATA_VERSION,
    recommendationTraceId: `rec-trace-${Date.now()}-${recommendationSequence}`,
    rationale,
    rankScore: 0,
    validationStatus,
    neverExecuteRecommendations: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    recommendationExecuted: false,
    workersAssigned: false,
    actionsApproved: false,
    pillowOverridden: false,
    grandKingOverridden: false,
    preserveRecommendationTraceability: true,
    preserveAuditability: true,
    preserveRecommendationIntegrity: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function buildRisks(input: StrategicRecommendationInput, analysis: EmpireStateAnalysis, category: string): string[] {
  return Array.from(
    new Set([
      ...(input.riskHints ?? []),
      ...analysis.risksDetected.slice(0, 2),
      `Recommendation in ${category} may underperform if supporting evidence is incomplete`,
      "Recommendation does not constitute approval or execution authority",
    ]),
  );
}

function normalizePriority(priority: PriorityLevel, analysis: EmpireStateAnalysis): PriorityLevel {
  if (analysis.risksDetected.some((r) => /security|critical|breach/i.test(r)) && priority !== "critical") {
    return priority === "informational" ? "medium" : priority === "low" ? "medium" : "high";
  }
  if (!(PRIORITY_LEVELS as readonly string[]).includes(priority)) return "medium";
  return priority;
}

function normalizeApproval(requirement: ApprovalRequirement, priority: PriorityLevel): ApprovalRequirement {
  if (priority === "critical" && requirement === "none") return "grand_king_approval";
  if (priority === "high" && requirement === "none") return "pillow_approval";
  if (!(APPROVAL_REQUIREMENTS as readonly string[]).includes(requirement)) return "pillow_approval";
  return requirement;
}

/** Exported for tests/extensions — confirms default category coverage. */
export function listBuiltinCategories() {
  return [...RECOMMENDATION_CATEGORIES];
}
