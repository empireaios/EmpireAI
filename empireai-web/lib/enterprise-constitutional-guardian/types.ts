/** E5-13 — Enterprise Constitutional Guardian frontend types (mirrors Pillow PILLOW-ECGUARD-001). */

export type GuardianProtectionEvent = {
  guardianEventId: string;
  protectedAsset: string;
  protectionCategory: string;
  detectedThreat: string;
  severity: string;
  businessImpact: string;
  strategicImpact: string;
  recommendedProtection: string;
  protectiveActionTaken: string;
  currentStatus: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
  classification: string;
};

export type EnterpriseConstitutionalGuardian = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  constitutionHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  constitutionHealthScore: number;
  protectedAssetCount: number;
  activeViolationCount: number;
  resolvedEventCount: number;
  unresolvedCriticalCount: number;
  guardianProtectionRegister: GuardianProtectionEvent[];
  constitutionHealthEntries: Array<{ healthId: string; domain: string; score: number; status: string; summary: string }>;
  protectedAssets: Array<{ assetId: string; assetName: string; category: string; protectionLevel: string; lastValidated: string; status: string }>;
  constitutionViolations: Array<{ violationId: string; protectedAsset: string; detectedThreat: string; severity: string; status: string; resolved: boolean }>;
  repositoryIntegrity: Array<{ integrityId: string; domain: string; score: number; buildStatus: string; importIntegrity: string; status: string }>;
  architectureIntegrity: Array<{ architectureId: string; domain: string; score: number; canonicalCompliance: string; driftDetected: boolean; status: string }>;
  protectionEvents: Array<{ eventId: string; protectedAsset: string; event: string; severity: string; actionTaken: string; timestamp: string }>;
  constitutionalAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  constitutionalGuardianPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: Array<{ id: string; title: string; category: string; why: string; what: string; how: string; confidencePercent: number }>;
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  guardianPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus: {
    backgroundMonitoring: string;
    totalProtectionEvents: number;
    activeViolations: number;
    resolvedEvents: number;
    constitutionHealthScore: number;
    lastScanAt: string;
    nextScanAt: string;
  };
  executiveReport: {
    currentStatus: string;
    constitutionHealthScore: number;
    protectedAssetCount: number;
    activeViolations: number;
    executiveSummary: string;
    generatedAt: string;
  };
  metrics: {
    totalEvents: number;
    activeViolationCount: number;
    resolvedCount: number;
    protectedAssetCount: number;
    averageConfidence: number;
    constitutionHealthScore: number;
    repositoryIntegrityScore: number;
    architectureIntegrityScore: number;
  };
  healthStatus: {
    status: string;
    healthScore: number;
    protectionEventCount: number;
    unresolvedCriticalCount: number;
    auditEventCount: number;
    lastEventAt: string | null;
  };
  readyForE514: boolean;
};
