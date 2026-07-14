/** PILLOW-EDEC-001 — Executive Decision Certification types (E2-16). */

import type {
  EDEC_CERTIFICATION_GATES,
  EDEC_CERTIFICATION_VALIDATIONS,
  EDEC_INTEGRATION_VALIDATIONS,
  EDEC_EXECUTIVE_QUALITY_DOMAINS,
  EDEC_DEFECT_SEVERITIES,
  EDEC_DEFECT_CATEGORIES,
} from "./paths.js";

export type ExecutiveDecisionCertificationVersion = "E2-16";

export type EdecCertificationGateId = (typeof EDEC_CERTIFICATION_GATES)[number];
export type EdecCertificationValidationDomain = (typeof EDEC_CERTIFICATION_VALIDATIONS)[number];
export type EdecIntegrationValidationDomain = (typeof EDEC_INTEGRATION_VALIDATIONS)[number];
export type EdecExecutiveQualityDomain = (typeof EDEC_EXECUTIVE_QUALITY_DOMAINS)[number];
export type EdecDefectSeverity = (typeof EDEC_DEFECT_SEVERITIES)[number];
export type EdecDefectCategory = (typeof EDEC_DEFECT_CATEGORIES)[number];

export type EdecCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: "certified" | "pending" | "failed";
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type EdecCertificationGate = {
  gateId: EdecCertificationGateId;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type EdecCertificationValidationItem = {
  domain: EdecCertificationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type EdecIntegrationValidationItem = {
  domain: EdecIntegrationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type EdecExecutiveQualityMetric = {
  domain: EdecExecutiveQualityDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EdecCertificationDefect = {
  defectId: string;
  title: string;
  severity: EdecDefectSeverity;
  category: EdecDefectCategory;
  recommendation: string;
};

export type ExecutiveDecisionCertification = {
  architectureVersion: ExecutiveDecisionCertificationVersion;
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
