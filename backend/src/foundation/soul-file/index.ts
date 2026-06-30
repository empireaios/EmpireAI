export {
  soulFileIdentitySchema,
  soulFileContinuitySchema,
  soulFileOperationalStateSchema,
  soulFileDocumentSchema,
  SOUL_FILE_CHANGE_TYPES,
  SOUL_RUNTIME_MEMORY_KEYS,
  validateSoulFileDocument,
  createDefaultSoulFileDocument,
  createEmptyRuntimeMemory,
  normalizeSoulFileDocument,
} from "./models/soul-file-document.js";
export type {
  SoulFileIdentity,
  SoulFileContinuity,
  SoulFileOperationalState,
  SoulRuntimeEntry,
  SoulFileRuntimeMemory,
  SoulRuntimeMemoryKey,
  SoulFileDocument,
  SoulFileChangeType,
  SoulFileChangeRecord,
  SoulFileDiffEntry,
  SoulFileDiffResult,
  SoulFileIntegrityResult,
  SoulFileExportResult,
} from "./models/soul-file-document.js";

export type { SoulFileRepository } from "./repositories/soul-file-repository.js";
export {
  SqliteSoulFileRepository,
  getSoulFileRepository,
  resetSoulFileRepository,
} from "./repositories/sqlite-soul-file-repository.js";

export {
  canonicalizeSoulFilePayload,
  computeSoulFileChecksum,
  validateSoulFileIntegrity,
  attachSoulFileChecksum,
} from "./services/soul-file-integrity.js";

export { diffSoulFileVersions } from "./services/soul-file-diff.js";

export {
  exportSoulFileJson,
  exportSoulFileMarkdown,
  parseSoulFileJson,
  parseSoulFileMarkdown,
  finalizeImportedSoulFile,
} from "./services/soul-file-serializer.js";

export {
  SoulFileNotFoundError,
  SoulFileIntegrityError,
  initializeSoulFile,
  getSoulFile,
  evolveSoulFile,
  exportSoulFile,
  importSoulFile,
  verifySoulFileIntegrity,
  diffSoulFile,
  listSoulFileVersions,
  getSoulFileByVersion,
  listSoulFileChangeHistory,
  captureSoulRuntimeMemory,
} from "./services/soul-file-service.js";
export type {
  EvolveSoulFileInput,
  ImportSoulFileInput,
  CaptureSoulRuntimeInput,
} from "./services/soul-file-service.js";

export { registerSoulFileRoutes } from "./routes/soul-file-routes.js";
export { soulFileTools } from "./tools/soul-file-tools.js";

export {
  SOUL_FILE_MODULE_ID,
  SOUL_FILE_CAPABILITIES,
  createSoulFileModuleContract,
} from "./contract/soul-file-module.js";
export type {
  SoulFileCapability,
  SoulFileModuleContract,
} from "./contract/soul-file-module.js";
