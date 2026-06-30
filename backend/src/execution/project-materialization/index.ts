export {
  MATERIALIZATION_SIGNAL_TYPES,
  materializationSignalSchema,
  validateMaterializationSignal,
} from "./models/materialization-signal.js";
export type {
  MaterializationSignalType,
  MaterializationSignal,
} from "./models/materialization-signal.js";

export {
  MATERIALIZED_FILE_STATUSES,
  materializedFileSchema,
  validateMaterializedFile,
} from "./models/materialized-file.js";
export type {
  MaterializedFileType,
  MaterializedFileStatus,
  MaterializedFile,
} from "./models/materialized-file.js";

export {
  materializedProjectStructureSchema,
  buildMetadataSchema,
  materializedProjectSchema,
  validateMaterializedProject,
} from "./models/materialized-project.js";
export type {
  MaterializedProjectId,
  MaterializedProjectStructure,
  BuildMetadata,
  MaterializedProject,
  MaterializedFileCreateInput,
  MaterializedProjectCreateInput,
} from "./models/materialized-project.js";

export type {
  MaterializationRepositoryQuery,
  MaterializationRepository,
} from "./repositories/materialization-repository.js";

export {
  InMemoryMaterializationRepository,
  createInMemoryMaterializationRepository,
} from "./repositories/in-memory-materialization-repository.js";

export {
  MATERIALIZATION_SIGNAL_WEIGHTS,
  scoreProjectMaterialization,
  materializationScoring,
} from "./scoring/materialization-scoring.js";
export type {
  MaterializationArtifactInput,
  ProjectMaterializationInput,
  ProjectMaterializationBreakdown,
} from "./scoring/materialization-scoring.js";

export {
  ProjectMaterializationEngine,
  defaultProjectMaterializationEngine,
} from "./engines/project-materialization-engine.js";

export {
  PROJECT_MATERIALIZATION_MODULE_ID,
  PROJECT_MATERIALIZATION_MODULE_VERSION,
  PROJECT_MATERIALIZATION_CAPABILITIES,
  PROJECT_MATERIALIZATION_MODULE_CONTRACT,
  ProjectMaterializationModule,
  createProjectMaterializationModule,
  projectMaterializationModule,
} from "./contract/project-materialization-module.js";
export type {
  ProjectMaterializationModuleId,
  ProjectMaterializationCapability,
  ProjectMaterializationModuleContract,
} from "./contract/project-materialization-module.js";
