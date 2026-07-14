/** PILLOW-EIC-001 — Executive Intelligence Certification types (E4-15). */

import type {
  EIC_CERTIFICATION_GATES,
  EIC_CERTIFICATION_VALIDATIONS,
  EIC_INTEGRATION_VALIDATIONS,
  EIC_EXECUTIVE_QUALITY_DOMAINS,
  EIC_DEFECT_SEVERITIES,
  EIC_DEFECT_CATEGORIES,
  EIC_EXECUTIVE_CAPABILITIES,
} from "./paths.js";

export type ExecutiveIntelligenceCertificationVersion = "E4-15";

export type EicCertificationGateId = (typeof EIC_CERTIFICATION_GATES)[number];
export type EicCertificationValidationDomain = (typeof EIC_CERTIFICATION_VALIDATIONS)[number];
export type EicIntegrationValidationDomain = (typeof EIC_INTEGRATION_VALIDATIONS)[number];
export type EicExecutiveQualityDomain = (typeof EIC_EXECUTIVE_QUALITY_DOMAINS)[number];
export type EicDefectSeverity = (typeof EIC_DEFECT_SEVERITIES)[number];
export type EicDefectCategory = (typeof EIC_DEFECT_CATEGORIES)[number];
export type EicExecutiveCapability = (typeof EIC_EXECUTIVE_CAPABILITIES)[number];

export type EicCertificationScopeItem = {
  missionId: string;
  key: string;
  title: string;
  status: "certified" | "pending" | "failed";
  healthScore: number;
  integrated: boolean;
  evidence: string[];
};

export type EicCertificationGate = {
  gateId: EicCertificationGateId;
  gateNumber: number;
  label: string;
  result: "PASS" | "FAIL";
  summary: string;
};

export type EicCertificationValidationItem = {
  domain: EicCertificationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type EicIntegrationValidationItem = {
  domain: EicIntegrationValidationDomain;
  label: string;
  status: string;
  verified: boolean;
};

export type EicExecutiveQualityMetric = {
  domain: EicExecutiveQualityDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EicCertificationDefect = {
  defectId: string;
  title: string;
  severity: EicDefectSeverity;
  category: EicDefectCategory;
  recommendation: string;
};

export type EicExecutiveCapabilityAssessment = {
  capability: EicExecutiveCapability;
  label: string;
  verified: boolean;
  summary: string;
};

export type ExecutiveIntelligenceCertification = {
  architectureVersion: ExecutiveIntelligenceCertificationVersion;
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
