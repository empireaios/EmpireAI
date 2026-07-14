/** PILLOW-VIC-001 — Visual Intelligence Certification Engine exports (T5-10). */

export {
  VisualIntelligenceCertificationEngine,
  createVisualIntelligenceCertificationEngine,
  resetVisualIntelligenceCertificationForTesting,
} from "./engine.js";

export {
  buildVisualIntelligenceCertificationConfiguration,
  DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION,
  type VisualIntelligenceCertificationConfiguration,
} from "./configuration.js";

export {
  VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_REPORT_VERSION,
  CERTIFICATION_STATUSES,
  CERTIFICATION_DECISIONS,
  CERTIFIED_PROGRAMMES,
  T5_MISSION_IDS,
  CERTIFICATION_CATEGORIES,
} from "./paths.js";

export type {
  VisualIntelligenceCertificationEngineVersion,
  CertificationStatus,
  CertificationDecision,
  CertifiedProgramme,
  T5MissionId,
  CertificationCategory,
  ProgrammeValidationResult,
  MissionValidationResult,
  E2eValidationResult,
  ProductionReadinessResult,
  GovernanceComplianceResult,
  CapabilityValidationSummary,
  RecoveryVerificationResult,
  VisualIntelligenceCertificationReport,
  CertificationHealthReport,
  CertificationPerformanceStats,
  VisualIntelligenceCertificationState,
  CertificationCockpitSnapshot,
  VisualIntelligenceCertificationInput,
} from "./types.js";
