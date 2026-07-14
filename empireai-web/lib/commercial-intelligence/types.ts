/** P8-05 — Commercial Intelligence frontend types (mirrors Pillow PILLOW-CIN-001). */

export type CommercialInsight = {
  id: string;
  classification: string;
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

export type CommercialIntelligenceArchitecture = {
  architectureVersion: "P8-05";
  computedAt: string;
  grandKingSummary: string;
  businessHealth: string;
  revenueTrends: string[];
  profitTrends: string[];
  growthTrends: string[];
  winningProducts: Array<{
    productId: string;
    name: string;
    score: number;
    marginPercent: number;
    rationale: string;
  }>;
  currentOpportunities: CommercialInsight[];
  currentRisks: CommercialInsight[];
  recommendations: CommercialInsight[];
  insights: CommercialInsight[];
  pipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  principles: string[];
  capabilities: string[];
  recommendationDomains: string[];
  pillow: {
    commercialTrends: string[];
    businessOpportunities: string[];
    revenueGrowth: string[];
    competitivePosition: string[];
    automationOpportunities: string[];
    strategicRecommendations: string[];
  };
  integrations: {
    factoryStage: string;
    commerceHealth: string;
    automationLevel: string;
    intelligenceEngine: string;
  };
};
