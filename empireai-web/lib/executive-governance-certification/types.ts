/** E5-16 — Executive Governance Certification frontend types (mirrors Pillow PILLOW-EGC-001). */

export type EgcCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: string;
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type EgcCertificationGate = {
  gateId: string;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type EgcCertificationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type EgcIntegrationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type EgcExecutiveQualityMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EgcCertificationDefect = {
  defectId: string;
  title: string;
  severity: string;
  category: string;
  recommendation: string;
};

export type ExecutiveGovernanceCertification = {
  architectureVersion: string;
  computedAt: string;
  certificationSummary: string;
  certificationHealth: string;
  healthScore: number;
  programmeCertified: boolean;
  phaseE5Completed: boolean;
  executiveGovernanceCertified: boolean;
  certificationScope: EgcCertificationScopeItem[];
  certificationGates: EgcCertificationGate[];
  gatesPassed: number;
  gatesTotal: number;
  allGatesPassed: boolean;
  certificationValidations: EgcCertificationValidationItem[];
  integrationValidations: EgcIntegrationValidationItem[];
  executiveQualityReview: EgcExecutiveQualityMetric[];
  defects: EgcCertificationDefect[];
  criticalDefectCount: number;
  highDefectCount: number;
  mediumDefectCount: number;
  lowDefectCount: number;
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE601: boolean;
  nextPhase: string;
  nextMission: string;
};
