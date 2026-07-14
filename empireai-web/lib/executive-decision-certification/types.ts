/** E2-16 — Executive Decision Certification frontend types (mirrors Pillow PILLOW-EDEC-001). */

export type EdecCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: string;
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type EdecCertificationGate = {
  gateId: string;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type EdecCertificationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type EdecIntegrationValidationItem = {
  domain: string;
  label: string;
  status: string;
  verified: boolean;
};

export type EdecExecutiveQualityMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EdecCertificationDefect = {
  defectId: string;
  title: string;
  severity: string;
  category: string;
  recommendation: string;
};

export type ExecutiveDecisionCertification = {
  architectureVersion: string;
  computedAt: string;
  certificationSummary: string;
  certificationHealth: string;
  healthScore: number;
  programmeCertified: boolean;
  phaseE2Completed: boolean;
  certificationScope: EdecCertificationScopeItem[];
  certificationGates: EdecCertificationGate[];
  gatesPassed: number;
  gatesTotal: number;
  allGatesPassed: boolean;
  certificationValidations: EdecCertificationValidationItem[];
  integrationValidations: EdecIntegrationValidationItem[];
  executiveQualityReview: EdecExecutiveQualityMetric[];
  defects: EdecCertificationDefect[];
  criticalDefectCount: number;
  highDefectCount: number;
  mediumDefectCount: number;
  lowDefectCount: number;
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE301: boolean;
  nextPhase: string;
  nextMission: string;
};
