import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { CroAreaAnalysis, CroAreaStatus } from "../models/cro-area-analysis.js";
import {
  CRO_AREA_LABELS,
  CRO_AREA_TYPES,
  type CroAreaType,
} from "../models/cro-area-types.js";
import type { CroPriorityImprovement } from "../models/cro-priority-improvement.js";
import type { CroReportCreateInput } from "../models/cro-report.js";
import type { CroSignal, CroSignalType } from "../models/cro-signal.js";

export const CRO_SIGNAL_WEIGHTS: Record<CroSignalType, number> = {
  headline_clarity: 0.14,
  cta_effectiveness: 0.14,
  pricing_perception: 0.12,
  trust_credibility: 0.12,
  social_proof: 0.12,
  layout_usability: 0.12,
  offer_strength: 0.12,
  urgency_balance: 0.1,
  cro_composite: 0.02,
};

export type CroIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type CroIntelligenceOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  averageOrderValue?: number;
};

export type CroIntelligenceInput = {
  brand: CroIntelligenceBrandInput;
  offer: CroIntelligenceOfferInput;
  storeId: string;
  storeSlug?: string;
};

export type CroIntelligenceBreakdown = CroReportCreateInput;

type AreaDefinition = {
  areaType: CroAreaType;
  benchmarkScore: number;
  scoreModifier: (input: CroIntelligenceInput) => number;
  findings: (input: CroIntelligenceInput, score: number) => string[];
  strengths: (input: CroIntelligenceInput, score: number) => string[];
  weaknesses: (input: CroIntelligenceInput, score: number) => string[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(signalType: CroSignalType, score: number, detail: string): CroSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CRO_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function resolveStatus(score: number): CroAreaStatus {
  if (score >= 75) return "STRONG";
  if (score >= 55) return "ADEQUATE";
  return "NEEDS_IMPROVEMENT";
}

function baseScore(input: CroIntelligenceInput): number {
  const benefitBoost = Math.min(10, input.offer.keyBenefits.length * 2);
  return clampScore(input.brand.confidence * 0.52 + benefitBoost + 20);
}

function liftLabel(min: number, max: number): string {
  return `+${min.toFixed(1)}%–${max.toFixed(1)}% conversion lift`;
}

const AREA_DEFINITIONS: AreaDefinition[] = [
  {
    areaType: "HEADLINES",
    benchmarkScore: 62,
    scoreModifier: (input) => (input.offer.headline.length > 20 ? 6 : -4),
    findings: (input, score) => [
      `Hero headline "${input.offer.headline.slice(0, 40)}${input.offer.headline.length > 40 ? "…" : ""}" scores ${score}/100 for clarity and benefit alignment.`,
      `Value proposition density: ${input.offer.valueProposition.length} characters — ${input.offer.valueProposition.length > 60 ? "adequate" : "could expand"}.`,
    ],
    strengths: (input) =>
      input.offer.headline.length > 15
        ? ["Headline communicates a clear product category", "Benefit-oriented language present"]
        : ["Headline is concise"],
    weaknesses: (input, score) =>
      score < 70
        ? ["Headline lacks specificity for high-intent shoppers", "No quantified outcome in hero copy"]
        : ["Minor headline A/B testing opportunity remains"],
  },
  {
    areaType: "BUTTONS",
    benchmarkScore: 58,
    scoreModifier: (input) => (input.offer.callToAction.length > 8 ? 5 : -3),
    findings: (input, score) => [
      `Primary CTA "${input.offer.callToAction}" scores ${score}/100 for action clarity and contrast potential.`,
      "Secondary CTAs and sticky mobile button placement not yet optimized.",
    ],
    strengths: (input) => [
      `CTA uses action verb: "${input.offer.callToAction.split(" ")[0]}"`,
      "Single primary action reduces decision paralysis",
    ],
    weaknesses: (_, score) =>
      score < 65
        ? ["Button contrast and size may underperform on mobile", "No secondary micro-commitment CTA"]
        : ["Consider testing button copy variants"],
  },
  {
    areaType: "PRICING",
    benchmarkScore: 55,
    scoreModifier: (input) => (input.offer.averageOrderValue && input.offer.averageOrderValue < 60 ? 4 : 0),
    findings: (input, score) => [
      `Price presentation scores ${score}/100 — AOV anchor $${(input.offer.averageOrderValue ?? 49.99).toFixed(2)}.`,
      "Anchoring, comparison, and installment messaging not fully leveraged.",
    ],
    strengths: () => ["Price point accessible for impulse purchase range", "Single-SKU focus simplifies decision"],
    weaknesses: (_, score) =>
      score < 65
        ? ["No strikethrough anchor or bundle savings shown", "Shipping cost not integrated into price display"]
        : ["Test price framing with installment options"],
  },
  {
    areaType: "TRUST",
    benchmarkScore: 60,
    scoreModifier: (input) => (input.brand.positioning.length > 25 ? 5 : 0),
    findings: (input, score) => [
      `Trust signal coverage scores ${score}/100 for ${input.brand.brandName}.`,
      "Guarantee badges, secure checkout icons, and policy links need prominence review.",
    ],
    strengths: (input) => [
      `Brand positioning "${input.brand.positioning.slice(0, 50)}…" supports credibility`,
      "Professional brand name builds initial trust",
    ],
    weaknesses: () => [
      "Money-back guarantee not above the fold",
      "SSL and payment security badges below checkout fold",
    ],
  },
  {
    areaType: "TESTIMONIALS",
    benchmarkScore: 52,
    scoreModifier: (input) => Math.min(6, input.offer.keyBenefits.length),
    findings: (_, score) => [
      `Social proof density scores ${score}/100 — testimonial count and specificity below category benchmark.`,
      "Review stars, UGC photos, and named customer quotes underrepresented.",
    ],
    strengths: () => ["Product category supports authentic review generation", "Benefit claims align with review themes"],
    weaknesses: () => [
      "No photo testimonials near primary CTA",
      "Review count not displayed on product hero",
      "Missing segment-specific testimonials (e.g. first-time buyers)",
    ],
  },
  {
    areaType: "LAYOUT",
    benchmarkScore: 58,
    scoreModifier: (input) => (input.offer.keyBenefits.length >= 3 ? 4 : -2),
    findings: (input, score) => [
      `Page layout usability scores ${score}/100 with ${input.offer.keyBenefits.length} benefit blocks mapped.`,
      "Visual hierarchy, whitespace, and mobile scroll depth need optimization.",
    ],
    strengths: (input) => [
      `${input.offer.keyBenefits.length} benefit sections provide scannable content`,
      "Single-column mobile flow feasible with current structure",
    ],
    weaknesses: () => [
      "Above-the-fold CTA competes with navigation elements",
      "Benefit icons lack consistent visual weight",
      "FAQ section buried below fold",
    ],
  },
  {
    areaType: "OFFER",
    benchmarkScore: 64,
    scoreModifier: (input) => Math.min(8, input.offer.keyBenefits.length * 2),
    findings: (input, score) => [
      `Offer "${input.offer.offerTitle}" scores ${score}/100 for perceived value and differentiation.`,
      `${input.offer.keyBenefits.length} key benefits mapped — ${input.offer.keyBenefits.length >= 3 ? "solid" : "thin"} value stack.`,
    ],
    strengths: (input) => input.offer.keyBenefits.slice(0, 2).map((benefit) => `Strong benefit: ${benefit.slice(0, 60)}`),
    weaknesses: (_, score) =>
      score < 70
        ? ["No bonus item or free-shipping threshold offer", "Offer stack lacks risk-reversal layer"]
        : ["Test bundle offer against single-SKU conversion"],
  },
  {
    areaType: "URGENCY",
    benchmarkScore: 48,
    scoreModifier: () => -2,
    findings: (_, score) => [
      `Urgency and scarcity messaging scores ${score}/100 — ethical urgency underutilized.`,
      "Stock indicators, limited-time framing, and cart timers not deployed.",
    ],
    strengths: () => ["Category supports authentic inventory-based urgency", "No false scarcity detected"],
    weaknesses: () => [
      "No low-stock indicator on product page",
      "Limited-time offer deadline not visible",
      "Cart expiration reminder not configured",
    ],
  },
];

function buildAnalysis(definition: AreaDefinition, input: CroIntelligenceInput): CroAreaAnalysis {
  const score = clampScore(baseScore(input) + definition.scoreModifier(input));

  return {
    analysisId: randomUUID(),
    areaType: definition.areaType,
    displayName: CRO_AREA_LABELS[definition.areaType],
    score,
    benchmarkScore: definition.benchmarkScore,
    status: resolveStatus(score),
    findings: definition.findings(input, score),
    strengths: definition.strengths(input, score),
    weaknesses: definition.weaknesses(input, score),
  };
}

function buildAllAnalyses(input: CroIntelligenceInput): CroAreaAnalysis[] {
  return AREA_DEFINITIONS.map((definition) => buildAnalysis(definition, input));
}

function buildPriorityImprovements(
  analyses: CroAreaAnalysis[],
  input: CroIntelligenceInput,
): CroPriorityImprovement[] {
  const brandName = input.brand.brandName;
  const improvements: CroPriorityImprovement[] = [];

  const add = (
    areaType: CroAreaType,
    priority: CroPriorityImprovement["priority"],
    title: string,
    description: string,
    liftMin: number,
    liftMax: number,
    confidence: number,
    rationale: string,
  ) => {
    improvements.push({
      improvementId: randomUUID(),
      areaType,
      priority,
      title,
      description,
      expectedLiftMin: liftMin,
      expectedLiftMax: liftMax,
      expectedLiftLabel: liftLabel(liftMin, liftMax),
      confidence: clampScore(confidence),
      rationale,
    });
  };

  const byType = new Map(analyses.map((analysis) => [analysis.areaType, analysis]));

  for (const analysis of analyses) {
    if (analysis.score >= 75) continue;

    switch (analysis.areaType) {
      case "HEADLINES":
        add(
          "HEADLINES",
          "HIGH",
          "Rewrite hero headline with quantified outcome",
          `Replace generic headline with a specific result statement for ${brandName} (e.g. "Save 2 hours daily with…").`,
          4.5,
          9.0,
          78,
          "Headline clarity is the highest-leverage above-the-fold element for cold traffic.",
        );
        break;
      case "BUTTONS":
        add(
          "BUTTONS",
          "HIGH",
          "Increase primary CTA size and contrast on mobile",
          "Enlarge button to 48px min height, use high-contrast brand color, add sticky mobile CTA bar.",
          3.0,
          7.5,
          72,
          "Mobile CTA visibility directly correlates with add-to-cart rate.",
        );
        break;
      case "PRICING":
        add(
          "PRICING",
          "HIGH",
          "Add price anchoring with compare-at value",
          "Display strikethrough MSRP and per-day cost breakdown to reframe price perception.",
          2.5,
          6.0,
          70,
          "Anchoring shifts price perception from cost to value.",
        );
        break;
      case "TRUST":
        add(
          "TRUST",
          "MEDIUM",
          "Move guarantee badge above the fold",
          "Place 30-day money-back guarantee and secure checkout icons directly under hero CTA.",
          2.0,
          5.0,
          68,
          "Trust signals near CTA reduce purchase anxiety at decision point.",
        );
        break;
      case "TESTIMONIALS":
        add(
          "TESTIMONIALS",
          "HIGH",
          "Add photo testimonials with star ratings near CTA",
          "Display 3 named reviews with photos and 5-star ratings between hero and benefits section.",
          3.5,
          8.0,
          75,
          "Social proof at decision point is among the highest-ROI CRO changes.",
        );
        break;
      case "LAYOUT":
        add(
          "LAYOUT",
          "MEDIUM",
          "Restructure above-the-fold hierarchy",
          "Reorder: headline → benefit bullets → CTA → trust strip → hero image for faster scan path.",
          2.0,
          5.5,
          65,
          "F-pattern scanning behavior favors text-first hierarchy on landing pages.",
        );
        break;
      case "OFFER":
        add(
          "OFFER",
          "HIGH",
          "Stack offer with free-shipping threshold",
          `Add "Free shipping on orders over $${Math.ceil((input.offer.averageOrderValue ?? 49.99) * 0.8)}" banner above CTA.`,
          3.0,
          7.0,
          74,
          "Shipping cost surprise is a top-3 checkout abandonment driver.",
        );
        break;
      case "URGENCY":
        add(
          "URGENCY",
          "MEDIUM",
          "Deploy ethical low-stock indicator",
          "Show real inventory count when stock falls below 20 units — no fabricated scarcity.",
          1.5,
          4.0,
          62,
          "Authentic scarcity nudges hesitant buyers without damaging trust.",
        );
        break;
    }
  }

  const lowest = [...analyses].sort((left, right) => left.score - right.score)[0];
  if (lowest && lowest.score < 60) {
    add(
      lowest.areaType,
      "HIGH",
      `Priority: ${lowest.displayName} optimization`,
      `${lowest.displayName} scores ${lowest.score}/100 — address "${lowest.weaknesses[0] ?? "top weakness"}" first.`,
      4.0,
      10.0,
      80,
      `Lowest-scoring CRO dimension (${lowest.displayName}) offers the largest marginal conversion gain.`,
    );
  }

  const headlines = byType.get("HEADLINES")!;
  const buttons = byType.get("BUTTONS")!;
  if (headlines.score < 70 && buttons.score < 70) {
    add(
      "HEADLINES",
      "HIGH",
      "Run headline + CTA A/B test as single experiment",
      "Test 2 headline variants paired with matching CTA copy to isolate message-market fit.",
      5.0,
      12.0,
      76,
      "Combined headline-CTA tests avoid confounding variables and accelerate learning.",
    );
  }

  return improvements.sort((left, right) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const priorityDiff = priorityOrder[left.priority] - priorityOrder[right.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return right.expectedLiftMax - left.expectedLiftMax;
  });
}

function buildSignals(analyses: CroAreaAnalysis[], confidence: number): CroSignal[] {
  const byType = new Map(analyses.map((analysis) => [analysis.areaType, analysis]));

  const signalMap: Record<CroSignalType, CroAreaType | null> = {
    headline_clarity: "HEADLINES",
    cta_effectiveness: "BUTTONS",
    pricing_perception: "PRICING",
    trust_credibility: "TRUST",
    social_proof: "TESTIMONIALS",
    layout_usability: "LAYOUT",
    offer_strength: "OFFER",
    urgency_balance: "URGENCY",
    cro_composite: null,
  };

  const signals: CroSignal[] = [];

  for (const [signalType, areaType] of Object.entries(signalMap) as [CroSignalType, CroAreaType | null][]) {
    if (signalType === "cro_composite") {
      signals.push(buildSignal("cro_composite", confidence, `CRO report confidence ${confidence}`));
      continue;
    }
    const analysis = byType.get(areaType!)!;
    signals.push(
      buildSignal(
        signalType,
        analysis.score,
        `${analysis.displayName} analysis ${analysis.score}/100`,
      ),
    );
  }

  return signals;
}

function computeConfidence(signals: CroSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "cro_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "cro_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeAggregateLift(improvements: CroPriorityImprovement[]): {
  min: number;
  max: number;
} {
  const highPriority = improvements.filter((entry) => entry.priority === "HIGH");
  const pool = highPriority.length > 0 ? highPriority : improvements;

  const min = clampScore(pool.reduce((total, entry) => total + entry.expectedLiftMin, 0) * 0.35);
  const max = clampScore(pool.reduce((total, entry) => total + entry.expectedLiftMax, 0) * 0.35);

  return { min: Math.min(min, 35), max: Math.min(max, 45) };
}

function computeOverallScore(analyses: CroAreaAnalysis[]): number {
  return clampScore(average(analyses.map((analysis) => analysis.score)));
}

/** Generates a complete CRO recommendations report — intelligence only, no deployment. */
export function generateCroReport(input: CroIntelligenceInput): CroIntelligenceBreakdown {
  const analyses = buildAllAnalyses(input);

  for (const areaType of CRO_AREA_TYPES) {
    const found = analyses.find((analysis) => analysis.areaType === areaType);
    if (!found) {
      throw new Error(`Missing required CRO analysis area: ${areaType}`);
    }
  }

  const priorityImprovements = buildPriorityImprovements(analyses, input);
  const provisionalSignals = buildSignals(analyses, 0);
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(analyses, confidence);
  const overallScore = computeOverallScore(analyses);
  const aggregateLift = computeAggregateLift(priorityImprovements);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} CRO Report`,
    analyses,
    priorityImprovements,
    overallScore,
    aggregateExpectedLiftMin: aggregateLift.min,
    aggregateExpectedLiftMax: aggregateLift.max,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoApplyEnabled: false,
  };
}

export const croIntelligenceScoring = {
  generateCroReport,
  computeConfidence,
  computeOverallScore,
  computeAggregateLift,
  CRO_SIGNAL_WEIGHTS,
};
