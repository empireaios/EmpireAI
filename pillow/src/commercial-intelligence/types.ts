/** PILLOW-CIN-001 — Commercial Intelligence Architecture types (P8-05). */

import type {
  INTELLIGENCE_PIPELINE,
  INTELLIGENCE_PRINCIPLES,
  INTELLIGENCE_CAPABILITIES,
  INSIGHT_CLASSIFICATIONS,
  RECOMMENDATION_DOMAINS,
} from "./paths.js";

export type CommercialIntelligenceArchitectureVersion = "P8-05";

export type IntelligencePipelinePhase = (typeof INTELLIGENCE_PIPELINE)[number];
export type IntelligencePrinciple = (typeof INTELLIGENCE_PRINCIPLES)[number];
export type IntelligenceCapability = (typeof INTELLIGENCE_CAPABILITIES)[number];
export type InsightClassification = (typeof INSIGHT_CLASSIFICATIONS)[number];
export type RecommendationDomain = (typeof RECOMMENDATION_DOMAINS)[number];

export type CommercialInsight = {
  id: string;
  classification: InsightClassification;
  title: string;
  why: string;
  what: string;
  how: string;
  proof: string;
  confidencePercent: number;
  confidenceLabel: string;
  businessImpact: string;
  domain: string;
};

export type WinningProductInsight = {
  productId: string;
  name: string;
  score: number;
  marginPercent: number;
  rationale: string;
};

export type IntelligencePipelineView = {
  phase: IntelligencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CommercialIntelligencePillowAnalysis = {
  commercialTrends: string[];
  businessOpportunities: string[];
  revenueGrowth: string[];
  competitivePosition: string[];
  automationOpportunities: string[];
  strategicRecommendations: string[];
};

export type CommercialIntelligenceArchitecture = {
  architectureVersion: CommercialIntelligenceArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  businessHealth: string;
  revenueTrends: string[];
  profitTrends: string[];
  growthTrends: string[];
  winningProducts: WinningProductInsight[];
  currentOpportunities: CommercialInsight[];
  currentRisks: CommercialInsight[];
  recommendations: CommercialInsight[];
  insights: CommercialInsight[];
  pipeline: IntelligencePipelineView[];
  principles: IntelligencePrinciple[];
  capabilities: IntelligenceCapability[];
  recommendationDomains: RecommendationDomain[];
  pillow: CommercialIntelligencePillowAnalysis;
  integrations: {
    factoryStage: string;
    commerceHealth: string;
    automationLevel: string;
    intelligenceEngine: string;
  };
};
