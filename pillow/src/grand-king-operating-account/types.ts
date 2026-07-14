/** PILLOW-GK-001 — Grand King Operating Account types (P8-06). */

import type {
  GRAND_KING_GOVERNED_DOMAINS,
  GRAND_KING_RESPONSIBILITIES,
  EMPIREAI_RESPONSIBILITIES,
  GRAND_KING_EXPERIENCE_STACK,
  PRODUCTION_REQUIREMENTS,
} from "./paths.js";

export type GrandKingOperatingAccountVersion = "P8-06";

export type GrandKingGovernedDomain = (typeof GRAND_KING_GOVERNED_DOMAINS)[number];
export type GrandKingResponsibility = (typeof GRAND_KING_RESPONSIBILITIES)[number];
export type EmpireAiResponsibility = (typeof EMPIREAI_RESPONSIBILITIES)[number];
export type GrandKingExperienceLayer = (typeof GRAND_KING_EXPERIENCE_STACK)[number];
export type ProductionRequirement = (typeof PRODUCTION_REQUIREMENTS)[number];

export type GrandKingPortfolioBusiness = {
  id: string;
  name: string;
  stage: string;
  revenue: string;
  profit: string;
  health: string;
};

export type GrandKingExperienceLayerView = {
  layer: GrandKingExperienceLayer;
  label: string;
  route: string;
  status: string;
  summary: string;
};

export type GrandKingExecutiveControl = {
  empireHealth: string;
  businessHealth: string;
  currentMission: string;
  journey: string;
  eta: string;
  production: string;
  commerce: string;
  revenue: string;
  profit: string;
  recommendations: string[];
  currentRisks: string[];
  currentOpportunities: string[];
};

export type GrandKingOperatingAccount = {
  architectureVersion: GrandKingOperatingAccountVersion;
  computedAt: string;
  accountId: string;
  workspaceId: string;
  grandKingSummary: string;
  empireStatus: string;
  businessPortfolio: GrandKingPortfolioBusiness[];
  currentRevenue: string;
  currentProfit: string;
  currentMission: string;
  currentEta: string;
  businessOpportunities: string[];
  businessRisks: string[];
  recommendations: string[];
  productionHealth: string;
  executiveControl: GrandKingExecutiveControl;
  experienceStack: GrandKingExperienceLayerView[];
  governedDomains: GrandKingGovernedDomain[];
  grandKingResponsibilities: GrandKingResponsibility[];
  empireAiResponsibilities: EmpireAiResponsibility[];
  productionRequirements: ProductionRequirement[];
  pillowAdvisory: string[];
};
