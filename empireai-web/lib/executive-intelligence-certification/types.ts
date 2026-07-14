/** E4-15 — Executive Intelligence Certification frontend types (mirrors Pillow PILLOW-EIC-001). */

export type EicCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: string;
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type EicCertificationGate = {
  gateId: string;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type EicCertificationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type EicIntegrationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type EicExecutiveQualityMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EicExecutiveCapabilityAssessment = {
  capability: string;
  label: string;
  verified: boolean;
  summary: string;
};

export type EicCertificationDefect = {
  defectId: string;
  title: string;
  severity: string;
  category: string;
  recommendation: string;
};

export type ExecutiveIntelligenceCertification = {
  architectureVersion: string;
  computedAt: string;
  certificationSummary: string;
  certificationHealth: string;
  healthScore: number;
  programmeCertified: boolean;
  phaseE4Completed: boolean;
  certificationScope: EicCertificationScopeItem[];
  certificationGates: EicCertificationGate[];
  gatesPassed: number;
  gatesTotal: number;
  allGatesPassed: boolean;
  certificationValidations: EicCertificationValidationItem[];
  integrationValidations: EicIntegrationValidationItem[];
  executiveQualityReview: EicExecutiveQualityMetric[];
  executiveCapabilityAssessment: EicExecutiveCapabilityAssessment[];
  defects: EicCertificationDefect[];
  criticalDefectCount: number;
  highDefectCount: number;
  mediumDefectCount: number;
  lowDefectCount: number;
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE501: boolean;
  nextPhase: string;
  nextMission: string;
};
