/** P8-06 — Grand King Operating Account frontend types (mirrors Pillow PILLOW-GK-001). */

export type GrandKingPortfolioBusiness = {
  id: string;
  name: string;
  stage: string;
  revenue: string;
  profit: string;
  health: string;
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

export type GrandKingExperienceLayerView = {
  layer: string;
  label: string;
  route: string;
  status: string;
  summary: string;
};

export type GrandKingOperatingAccount = {
  architectureVersion: "P8-06";
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
  governedDomains: string[];
  grandKingResponsibilities: string[];
  empireAiResponsibilities: string[];
  productionRequirements: string[];
  pillowAdvisory: string[];
};
