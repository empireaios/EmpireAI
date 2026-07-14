/** E5-14 — Executive Resilience Engine frontend types (mirrors Pillow PILLOW-ERES-001). */

export type ResilienceIncidentRecord = {
  resilienceId: string;
  incidentTitle: string;
  incidentCategory: string;
  affectedSystems: string;
  severity: string;
  businessImpact: string;
  strategicImpact: string;
  recoveryStrategy: string;
  recoveryStatus: string;
  recoveryTime: string;
  responsibleExecutive: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
  classification: string;
};

export type ExecutiveResilienceEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  resilienceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  enterpriseHealthScore: number;
  operationalReadinessScore: number;
  recoveryReadinessScore: number;
  totalIncidentCount: number;
  activeIncidentCount: number;
  recoveredIncidentCount: number;
  unresolvedCriticalCount: number;
  resilienceIncidentRegister: ResilienceIncidentRecord[];
  enterpriseHealth: Array<{ healthId: string; domain: string; score: number; status: string; summary: string }>;
  continuityStatus: Array<{ continuityId: string; domain: string; label: string; availability: number; status: string; lastValidated: string }>;
  activeIncidents: Array<{ incidentId: string; incidentTitle: string; severity: string; recoveryStatus: string; affectedSystems: string }>;
  recoveryProgress: Array<{ progressId: string; incidentTitle: string; recoveryStrategy: string; progress: number; recoveryStatus: string; recoveryTime: string }>;
  operationalReadiness: Array<{ readinessId: string; domain: string; score: number; status: string; summary: string }>;
  resilienceAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  executiveResiliencePipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: Array<{ id: string; title: string; category: string; why: string; what: string; how: string; confidencePercent: number }>;
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  resiliencePrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus: {
    backgroundMonitoring: string;
    totalIncidents: number;
    activeIncidents: number;
    recoveredIncidents: number;
    resilienceHealthScore: number;
    lastScanAt: string;
    nextScanAt: string;
  };
  executiveReport: {
    currentStatus: string;
    enterpriseHealthScore: number;
    activeIncidents: number;
    recoveryReadiness: number;
    executiveSummary: string;
    generatedAt: string;
  };
  metrics: {
    totalIncidents: number;
    activeIncidentCount: number;
    recoveredCount: number;
    averageRecoveryTime: string;
    enterpriseHealthScore: number;
    operationalReadinessScore: number;
    continuityAvailability: number;
  };
  healthStatus: {
    status: string;
    healthScore: number;
    incidentRegisterCount: number;
    unresolvedCriticalCount: number;
    auditEventCount: number;
    lastEventAt: string | null;
  };
  readyForE515: boolean;
};
