import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { CompanyEntry } from "../models/company-entry.js";
import type { CrossBrandIntelligence } from "../models/cross-brand-intelligence.js";
import type { CrossLearningInsight } from "../models/cross-learning-insight.js";
import type { MultiCompanyReportCreateInput } from "../models/multi-company-report.js";
import type {
  MultiCompanySignal,
  MultiCompanySignalType,
} from "../models/multi-company-signal.js";
import type { PortfolioManagement } from "../models/portfolio-management.js";

export const MULTI_COMPANY_SIGNAL_WEIGHTS: Record<MultiCompanySignalType, number> = {
  company_coverage: 0.2,
  cross_learning: 0.22,
  cross_brand_synergy: 0.2,
  portfolio_health: 0.18,
  revenue_diversification: 0.18,
  multi_company_composite: 0.02,
};

export type MultiCompanyBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type MultiCompanyEntryInput = {
  companyName: string;
  brandName: string;
  niche: string;
  monthlyRevenue?: number;
  healthScore?: number;
  storeCount?: number;
};

export type MultiCompanyInput = {
  empireId: string;
  empireName: string;
  primaryBrand: MultiCompanyBrandInput;
  companies: MultiCompanyEntryInput[];
  currency?: string;
  portfolioIndex?: number;
};

export type MultiCompanyBreakdown = MultiCompanyReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: MultiCompanySignalType,
  score: number,
  detail: string,
): MultiCompanySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: MULTI_COMPANY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: MultiCompanyInput): number {
  const portfolioBoost = input.portfolioIndex ? Math.min(10, input.portfolioIndex / 10) : 5;
  return clampScore(input.primaryBrand.confidence * 0.45 + portfolioBoost + 22);
}

function resolveCurrency(input: MultiCompanyInput): string {
  return input.currency ?? "USD";
}

function buildCompanies(input: MultiCompanyInput): CompanyEntry[] {
  const score = baseScore(input);
  const currency = resolveCurrency(input);

  if (input.companies.length === 0) {
    return [
      {
        companyId: randomUUID(),
        companyName: input.empireName,
        brandName: input.primaryBrand.brandName,
        niche: input.primaryBrand.niche,
        status: "ACTIVE",
        monthlyRevenue: 28500,
        healthScore: clampScore(input.primaryBrand.confidence),
        storeCount: 1,
        currency,
        score: clampScore(score + 4),
      },
    ];
  }

  return input.companies.map((company, index) => ({
    companyId: randomUUID(),
    companyName: company.companyName,
    brandName: company.brandName,
    niche: company.niche,
    status: (index === 0 ? "GROWING" : index % 2 === 0 ? "ACTIVE" : "INCUBATING") as CompanyEntry["status"],
    monthlyRevenue: company.monthlyRevenue ?? 12000 + index * 8500,
    healthScore: company.healthScore ?? clampScore(70 + input.primaryBrand.confidence * 0.1 - index * 3),
    storeCount: company.storeCount ?? 1,
    currency,
    score: clampScore(score + (index === 0 ? 5 : 0)),
  }));
}

function buildCrossLearning(companies: CompanyEntry[]): CrossLearningInsight[] {
  const source = companies[0]?.companyName ?? "Primary Company";
  const targets = companies.slice(1).map((company) => company.companyName);

  const insights: CrossLearningInsight[] = [
    {
      insightId: randomUUID(),
      category: "MARKETING",
      sourceCompany: source,
      targetCompanies: targets.length > 0 ? targets : [source],
      insight: "UGC-style Meta creatives outperformed polished studio assets by 34% ROAS lift.",
      replicablePattern: "Deploy native UGC video formats before scaling paid spend",
      impactScore: 88,
      score: 86,
    },
    {
      insightId: randomUUID(),
      category: "PRODUCT",
      sourceCompany: source,
      targetCompanies: targets.length > 0 ? targets : [source],
      insight: "Bundle pricing increased AOV 22% across kitchen category stores.",
      replicablePattern: "Pair hero SKU with accessory at 15% bundle discount",
      impactScore: 82,
      score: 80,
    },
    {
      insightId: randomUUID(),
      category: "CONVERSION",
      sourceCompany: companies[1]?.companyName ?? source,
      targetCompanies: companies.filter((_, index) => index !== 1).map((company) => company.companyName),
      insight: "Trust badges above fold improved conversion 18% on mobile.",
      replicablePattern: "Move review stars and guarantee badge above hero CTA",
      impactScore: 76,
      score: 74,
    },
  ];

  return insights;
}

function buildCrossBrandIntelligence(
  input: MultiCompanyInput,
  companies: CompanyEntry[],
): CrossBrandIntelligence {
  const score = baseScore(input);
  const brandNames = companies.map((company) => company.brandName);
  const niches = [...new Set(companies.map((company) => company.niche))];

  return {
    intelligenceId: randomUUID(),
    sharedAudienceSegments: [
      input.primaryBrand.targetAudience,
      "Home improvement enthusiasts",
      "Online deal seekers",
    ],
    complementaryBrands: brandNames.length >= 2 ? brandNames.slice(0, 2) : brandNames,
    crossSellOpportunities: [
      `Cross-sell ${brandNames[0] ?? "Brand A"} customers to ${brandNames[1] ?? "Brand B"} accessories`,
      "Shared email list for complementary product launches",
    ],
    brandConflictRisks: niches.length === 1 && companies.length > 2
      ? ["Multiple brands in same niche may cannibalize ad audiences"]
      : [],
    portfolioSynergyScore: clampScore(65 + companies.length * 5 + input.primaryBrand.confidence * 0.1),
    score: clampScore(score + 3),
    summary: `${companies.length} brands analyzed — synergy score ${clampScore(65 + companies.length * 5)}/100 across ${niches.length} niches.`,
  };
}

function buildPortfolioManagement(
  input: MultiCompanyInput,
  companies: CompanyEntry[],
): PortfolioManagement {
  const currency = resolveCurrency(input);
  const totalRevenue = companies.reduce((total, company) => total + company.monthlyRevenue, 0);
  const averageHealth = average(companies.map((company) => company.healthScore));
  const sorted = [...companies].sort((left, right) => right.monthlyRevenue - left.monthlyRevenue);
  const topPerformer = sorted[0]?.companyName ?? companies[0]!.companyName;
  const underperformer = sorted[sorted.length - 1]?.companyName ?? companies[0]!.companyName;
  const activeCompanies = companies.filter(
    (company) => company.status === "ACTIVE" || company.status === "GROWING",
  ).length;

  const allocation: Record<string, number> = {};
  for (const company of companies) {
    allocation[company.companyName] =
      totalRevenue > 0
        ? Math.round((company.monthlyRevenue / totalRevenue) * 1000) / 10
        : Math.round(100 / companies.length);
  }

  const recommendedPriority: PortfolioManagement["recommendedPriority"] =
    averageHealth >= 80 ? "SCALE" : averageHealth >= 65 ? "OPTIMIZE" : "INCUBATE";

  return {
    portfolioId: randomUUID(),
    totalCompanies: companies.length,
    activeCompanies,
    totalMonthlyRevenue: Math.round(totalRevenue * 100) / 100,
    averageHealthScore: Math.round(averageHealth * 10) / 10,
    topPerformer,
    underperformer,
    recommendedPriority,
    capitalAllocationPercent: allocation,
    currency,
    score: clampScore(baseScore(input) + (companies.length >= 2 ? 4 : 0)),
    summary: `Portfolio of ${companies.length} companies — ${currency} ${totalRevenue.toLocaleString()} combined monthly revenue, ${recommendedPriority} priority.`,
  };
}

function buildSignals(
  companies: CompanyEntry[],
  crossLearning: CrossLearningInsight[],
  crossBrand: CrossBrandIntelligence,
  portfolio: PortfolioManagement,
  confidence: number,
): MultiCompanySignal[] {
  const revenueValues = companies.map((company) => company.monthlyRevenue);
  const maxRevenue = Math.max(...revenueValues);
  const diversificationScore = maxRevenue > 0
    ? clampScore(100 - (maxRevenue / revenueValues.reduce((a, b) => a + b, 0)) * 100)
    : 50;

  return [
    buildSignal(
      "company_coverage",
      clampScore(50 + companies.length * 8),
      `${companies.length} companies in portfolio — unlimited supported`,
    ),
    buildSignal(
      "cross_learning",
      average(crossLearning.map((item) => item.score)),
      `${crossLearning.length} cross-company learning insights`,
    ),
    buildSignal(
      "cross_brand_synergy",
      crossBrand.score,
      crossBrand.summary,
    ),
    buildSignal(
      "portfolio_health",
      portfolio.score,
      portfolio.summary,
    ),
    buildSignal(
      "revenue_diversification",
      diversificationScore,
      `Revenue spread across ${companies.length} companies`,
    ),
    buildSignal(
      "multi_company_composite",
      confidence,
      `Multi-company intelligence confidence ${confidence}`,
    ),
  ];
}

function computeConfidence(signals: MultiCompanySignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "multi_company_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "multi_company_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  portfolio: PortfolioManagement,
  crossBrand: CrossBrandIntelligence,
  companies: CompanyEntry[],
): number {
  return clampScore(
    average([portfolio.score, crossBrand.score, average(companies.map((c) => c.score))]),
  );
}

/** Generates multi-company intelligence report — intelligence only, no auto-merge. */
export function generateMultiCompanyIntelligence(
  input: MultiCompanyInput,
): MultiCompanyBreakdown {
  const companies = buildCompanies(input);
  const crossLearning = buildCrossLearning(companies);
  const crossBrand = buildCrossBrandIntelligence(input, companies);
  const portfolio = buildPortfolioManagement(input, companies);

  const provisionalSignals = buildSignals(companies, crossLearning, crossBrand, portfolio, 0);
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(companies, crossLearning, crossBrand, portfolio, confidence);
  const overallScore = computeOverallScore(portfolio, crossBrand, companies);

  return {
    empireId: input.empireId,
    reportName: `${input.empireName} Multi-Company Intelligence`,
    companies,
    crossLearning,
    crossBrand,
    portfolio,
    unlimitedCompaniesSupported: true,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoMergeEnabled: false,
  };
}

export const multiCompanyIntelligenceScoring = {
  generateMultiCompanyIntelligence,
  computeConfidence,
  computeOverallScore,
  MULTI_COMPANY_SIGNAL_WEIGHTS,
};
