/** PILLOW-CI-001 — Commerce Intelligence Executive types (Phase 7). */

export type QualityTier = "recommended" | "review" | "reject";

export interface ProductOpportunity {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  marketIds: string[];
  costUsd: number;
  suggestedPriceUsd: number;
  profitMarginPercent: number;
  competitionLevel: "low" | "medium" | "high";
  demandScore: number;
  seasonality: string;
  growthTrend: "rising" | "stable" | "declining";
  advertisingPotential: number;
  customerInterest: number;
}

export interface ProductEvaluation {
  product: ProductOpportunity;
  profitScore: number;
  competitionScore: number;
  demandScore: number;
  growthScore: number;
  advertisingScore: number;
  overallScore: number;
  qualityTier: QualityTier;
  rationale: string;
}

export interface SupplierProfile {
  id: string;
  name: string;
  country: string;
  reliabilityScore: number;
  shippingDaysAvg: number;
  costIndex: number;
  qualityScore: number;
  returnRatePercent: number;
  communicationScore: number;
  capacityScore: number;
  stabilityScore: number;
}

export interface SupplierRanking {
  supplier: SupplierProfile;
  compositeScore: number;
  preferred: boolean;
  strengths: string[];
  risks: string[];
}

export interface CompetitorProfile {
  id: string;
  name: string;
  positioning: string;
  priceIndex: number;
  brandingScore: number;
  reviewSentiment: number;
  marketingIntensity: number;
  websiteQuality: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CompetitorAnalysis {
  competitor: CompetitorProfile;
  threatLevel: "low" | "medium" | "high";
  competitiveAdvantage: string[];
}

export interface MarketProfile {
  id: string;
  name: string;
  country: string;
  language: string;
  currency: string;
  marketSizeUsd: number;
  growthPercent: number;
  saturation: "low" | "medium" | "high";
  demandScore: number;
  shippingFeasible: boolean;
}

export interface MarketAnalysis {
  market: MarketProfile;
  opportunityScore: number;
  launchPriority: number;
  recommendation: string;
}

export interface WinningProductScore {
  product: ProductOpportunity;
  evaluation: ProductEvaluation;
  supplierRanking: SupplierRanking | null;
  marketFit: number;
  sustainabilityScore: number;
  compositeScore: number;
  aboveThreshold: boolean;
}

export interface BusinessLaunchPlan {
  productId: string;
  storeConcept: string;
  brandPositioning: string;
  catalogueItems: string[];
  preferredSupplierId: string;
  pricingStrategy: string;
  marketingRecommendations: string[];
  launchChecklist: string[];
  launchReadiness: "ready" | "conditional" | "not_ready";
}

export interface CommerceIntelligenceReport {
  version: "PILLOW-CI-001";
  generatedAt: string;
  recommendedProducts: WinningProductScore[];
  supplierRankings: SupplierRanking[];
  marketOpportunities: MarketAnalysis[];
  competitorThreats: CompetitorAnalysis[];
  launchPlans: BusinessLaunchPlan[];
  riskAssessment: string;
  recommendedActions: string[];
  executiveBrief: string;
}

export interface CommerceIntelligenceState {
  intelligenceVersion: "PILLOW-CI-001";
  status: "ready";
  initializedAt: string;
  totalAnalyses: number;
  qualityThreshold: number;
  catalogProducts: number;
  catalogSuppliers: number;
  catalogMarkets: number;
}
