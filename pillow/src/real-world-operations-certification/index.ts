/** PILLOW-RWOC-001 — Real World Operations Certification exports (R5-20). */

export {
  RealWorldOperationsCertificationEngine,
  createRealWorldOperationsCertificationEngine,
  resetRealWorldOperationsCertificationForTesting,
} from "./engine.js";

export {
  buildRealWorldOperationsCertificationConfiguration,
  DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION,
  type RealWorldOperationsCertificationConfiguration,
} from "./configuration.js";

export {
  REAL_WORLD_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  RWOC_METADATA_VERSION,
  CERTIFICATION_SCHEMA_VERSION,
  REAL_WORLD_OPERATIONS_CERTIFIED_ID,
  CERTIFIED_PHASE,
  CERTIFIED_PROGRAMMES,
  RWOC_CAPABILITIES,
} from "./paths.js";

export type {
  RealWorldOperationsCertificationEngineVersion,
  RealWorldOperationsCertificationReport,
  RealWorldOperationsCertificationState,
  RealWorldOperationsCertificationCockpitSnapshot,
  RealWorldOperationsCertificationHealthReport,
  RealWorldOperationsCertificationPerformanceStats,
  ProgrammeValidationResult,
  RunRealWorldOperationsCertificationInput,
  CertificationStatus,
  EngineStatus,
  HealthStatus,
} from "./types.js";

export type {
  RealWorldOperationsCertificationContext,
  ProgrammeCertificationProbe,
} from "./real-world-operations-certification-context.js";
