/** PILLOW-EPC-001 — Executive Planning Certification types (E1-15). */

import type {
  CERTIFICATION_GATES,
  CERTIFICATION_VALIDATIONS,
  INTEGRATION_VALIDATIONS,
  EXECUTIVE_QUALITY_DOMAINS,
  DEFECT_SEVERITIES,
  DEFECT_CATEGORIES,
} from "./paths.js";

export type ExecutivePlanningCertificationVersion = "E1-15";

export type CertificationGateId = (typeof CERTIFICATION_GATES)[number];
export type CertificationValidationDomain = (typeof CERTIFICATION_VALIDATIONS)[number];
export type IntegrationValidationDomain = (typeof INTEGRATION_VALIDATIONS)[number];
export type ExecutiveQualityDomain = (typeof EXECUTIVE_QUALITY_DOMAINS)[number];
export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number];
export type DefectCategory = (typeof DEFECT_CATEGORIES)[number];

export type CertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: "certified" | "pending" | "failed";
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type CertificationGate = {
  gateId: CertificationGateId;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type CertificationValidationItem = {
  domain: CertificationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type IntegrationValidationItem = {
  domain: IntegrationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type ExecutiveQualityMetric = {
  domain: ExecutiveQualityDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CertificationDefect = {
  defectId: string;
  title: string;
  severity: DefectSeverity;
  category: DefectCategory;
  recommendation: string;
};

export type ExecutivePlanningCertification = {
  architectureVersion: ExecutivePlanningCertificationVersion;
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
