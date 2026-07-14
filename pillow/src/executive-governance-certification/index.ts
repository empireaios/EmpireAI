export {
  assembleExecutiveGovernanceCertification,
  buildFallbackExecutiveGovernanceCertification,
} from "./assembler.js";
export {
  EXECUTIVE_GOVERNANCE_CERTIFICATION_PATH,
  EGOC_CERTIFICATION_SCOPE,
  EGOC_CERTIFICATION_GATES,
  EGOC_CERTIFICATION_VALIDATIONS,
  EGOC_INTEGRATION_VALIDATIONS,
  EGOC_EXECUTIVE_QUALITY_DOMAINS,
} from "./paths.js";
export type {
  ExecutiveGovernanceCertification,
  EgcCertificationScopeItem,
  EgcCertificationGate,
  EgcCertificationValidationItem,
  EgcIntegrationValidationItem,
  EgcExecutiveQualityMetric,
  EgcCertificationDefect,
} from "./types.js";
