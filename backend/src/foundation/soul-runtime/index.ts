export {
  SOUL_RUNTIME_EVENT_SOURCES,
  soulRuntimeEventSchema,
  soulRuntimeCaptureInputSchema,
} from "./models/soul-runtime-event.js";
export type {
  SoulRuntimeEventSource,
  SoulRuntimeEvent,
  SoulRuntimeCaptureInput,
} from "./models/soul-runtime-event.js";

export type { SoulRuntimeRepository } from "./repositories/soul-runtime-repository.js";
export {
  SqliteSoulRuntimeRepository,
  getSoulRuntimeRepository,
  resetSoulRuntimeRepository,
  createSoulRuntimeEvent,
} from "./repositories/sqlite-soul-runtime-repository.js";

export { mapAuditEntryToCaptures } from "./services/soul-runtime-audit-mapper.js";

export {
  SoulRuntimeEngine,
  getSoulRuntimeEngine,
  resetSoulRuntimeEngine,
  captureSoulRuntimeEvent,
  listSoulRuntimeEvents,
  getSoulRuntimeEvent,
} from "./services/soul-runtime-engine.js";

export { registerSoulRuntimeRoutes } from "./routes/soul-runtime-routes.js";
export { soulRuntimeTools } from "./tools/soul-runtime-tools.js";

export {
  SOUL_RUNTIME_MODULE_ID,
  SOUL_RUNTIME_CAPABILITIES,
  createSoulRuntimeModuleContract,
} from "./contract/soul-runtime-module.js";
export type {
  SoulRuntimeCapability,
  SoulRuntimeModuleContract,
} from "./contract/soul-runtime-module.js";
