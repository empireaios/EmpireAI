/** E1-15 — Executive Planning Certification frontend types (mirrors Pillow PILLOW-EPC-001). */

export type CertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: string;
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type CertificationGate = {
  gateId: string;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type CertificationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type IntegrationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type ExecutiveQualityMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CertificationDefect = {
  defectId: string;
  title: string;
  severity: string;
  category: string;
  recommendation: string;
};

export type ExecutivePlanningCertification = {
  architectureVersion: string;
  computedAt: string;
  certificationSummary: string;
  certificationHealth: string;
  healthScore: number;
  programmeCertified: boolean;
  phaseE1Completed: boolean;
  certificationScope: CertificationScopeItem[];
  certificationGates: CertificationGate[];
  gatesPassed: number;
  gatesTotal: number;
  allGatesPassed: boolean;
  certificationValidations: CertificationValidationItem[];
  integrationValidations: IntegrationValidationItem[];
  executiveQualityReview: ExecutiveQualityMetric[];
  defects: CertificationDefect[];
  criticalDefectCount: number;
  highDefectCount: number;
  mediumDefectCount: number;
  lowDefectCount: number;
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE201: boolean;
  nextPhase: string;
  nextMission: string;
};
