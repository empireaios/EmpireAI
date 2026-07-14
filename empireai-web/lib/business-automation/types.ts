/** P8-04 — Business Automation frontend types (mirrors Pillow PILLOW-BA-001). */

export type BusinessAutomationArchitecture = {
  architectureVersion: "P8-04";
  computedAt: string;
  grandKingSummary: string;
  automationStatus: string;
  automationLevel: string;
  targetAutomationLevel: string;
  automationHealth: string;
  automationPerformance: string;
  automationRecovery: string;
  businessEfficiency: string;
  activeAutomations: Array<{
    id: string;
    name: string;
    status: string;
    businessId: string | null;
    performance: string;
  }>;
  pendingAutomations: Array<{
    id: string;
    name: string;
    status: string;
    businessId: string | null;
    performance: string;
  }>;
  automationLevels: Array<{
    level: string;
    label: string;
    current: boolean;
    target: boolean;
    dependencies: string[];
    safetyRequirements: string[];
  }>;
  automationRules: Array<{
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
    status: string;
  }>;
  pipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  principles: string[];
  capabilities: string[];
  pillow: {
    opportunities: string[];
    efficiency: string[];
    commercialPerformance: string[];
    safety: string[];
    growthOpportunities: string[];
    operationalImprovements: string[];
    recommendations: string[];
  };
  integrations: {
    factoryStage: string;
    commerceHealth: string;
    marketplaceConnectors: number;
    zeroHumanLevel: string;
  };
};
