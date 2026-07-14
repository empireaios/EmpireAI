/** PILLOW-EGC-001 — Executive Governance Certification types (E5-16). */

import type {
  EGOC_CERTIFICATION_GATES,
  EGOC_CERTIFICATION_VALIDATIONS,
  EGOC_INTEGRATION_VALIDATIONS,
  EGOC_EXECUTIVE_QUALITY_DOMAINS,
  EGOC_DEFECT_SEVERITIES,
  EGOC_DEFECT_CATEGORIES,
} from "./paths.js";

export type ExecutiveGovernanceCertificationVersion = "E5-16";

export type EgcCertificationGateId = (typeof EGOC_CERTIFICATION_GATES)[number];
export type EgcCertificationValidationDomain = (typeof EGOC_CERTIFICATION_VALIDATIONS)[number];
export type EgcIntegrationValidationDomain = (typeof EGOC_INTEGRATION_VALIDATIONS)[number];
export type EgcExecutiveQualityDomain = (typeof EGOC_EXECUTIVE_QUALITY_DOMAINS)[number];
export type EgcDefectSeverity = (typeof EGOC_DEFECT_SEVERITIES)[number];
export type EgcDefectCategory = (typeof EGOC_DEFECT_CATEGORIES)[number];

export type EgcCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: "certified" | "pending" | "failed";
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type EgcCertificationGate = {
  gateId: EgcCertificationGateId;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type EgcCertificationValidationItem = {
  domain: EgcCertificationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type EgcIntegrationValidationItem = {
  domain: EgcIntegrationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type EgcExecutiveQualityMetric = {
  domain: EgcExecutiveQualityDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EgcCertificationDefect = {
  defectId: string;
  title: string;
  severity: EgcDefectSeverity;
  category: EgcDefectCategory;
  recommendation: string;
};

export type ExecutiveGovernanceCertification = {
  architectureVersion: ExecutiveGovernanceCertificationVersion;
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
