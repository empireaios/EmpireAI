/** PILLOW-BA-001 — Business Automation types (P8-04). */

import type {
  BUSINESS_AUTOMATION_PIPELINE,
  BUSINESS_AUTOMATION_PRINCIPLES,
  BUSINESS_AUTOMATION_LEVELS,
  AUTOMATED_BUSINESS_CAPABILITIES,
} from "./paths.js";

export type BusinessAutomationArchitectureVersion = "P8-04";

export type BusinessAutomationPipelinePhase = (typeof BUSINESS_AUTOMATION_PIPELINE)[number];
export type BusinessAutomationPrinciple = (typeof BUSINESS_AUTOMATION_PRINCIPLES)[number];
export type BusinessAutomationLevel = (typeof BUSINESS_AUTOMATION_LEVELS)[number];
export type AutomatedBusinessCapability = (typeof AUTOMATED_BUSINESS_CAPABILITIES)[number];

export type AutomationLevelRecord = {
  level: BusinessAutomationLevel;
  label: string;
  current: boolean;
  target: boolean;
  dependencies: string[];
  safetyRequirements: string[];
};

export type AutomationRule = {
  id: string;
  name: string;
  capability: string;
  trigger: string;
  conditions: string[];
  actions: string[];
  dependencies: string[];
  safetyRules: string[];
  rollbackStrategy: string;
  recoveryStrategy: string;
  auditTrail: string;
  status: "active" | "pending" | "standby";
};

export type ActiveAutomationRecord = {
  id: string;
  name: string;
  status: string;
  businessId: string | null;
  performance: string;
};

export type BusinessAutomationPipelineView = {
  phase: BusinessAutomationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type BusinessAutomationPillowAnalysis = {
  opportunities: string[];
  efficiency: string[];
  commercialPerformance: string[];
  safety: string[];
  growthOpportunities: string[];
  operationalImprovements: string[];
  recommendations: string[];
};

export type BusinessAutomationArchitecture = {
  architectureVersion: BusinessAutomationArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  automationStatus: string;
  automationLevel: string;
  targetAutomationLevel: string;
  automationHealth: string;
  automationPerformance: string;
  automationRecovery: string;
  businessEfficiency: string;
  activeAutomations: ActiveAutomationRecord[];
  pendingAutomations: ActiveAutomationRecord[];
  automationLevels: AutomationLevelRecord[];
  automationRules: AutomationRule[];
  pipeline: BusinessAutomationPipelineView[];
  principles: BusinessAutomationPrinciple[];
  capabilities: AutomatedBusinessCapability[];
  pillow: BusinessAutomationPillowAnalysis;
  integrations: {
    factoryStage: string;
    commerceHealth: string;
    marketplaceConnectors: number;
    zeroHumanLevel: string;
  };
};
