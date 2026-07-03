import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import { ARCHITECTURE_BOUNDARIES } from "./architecture-registry.js";
import {
  SCREEN_ROUTES,
  buildArchitectureDependencies,
  indexCodeModules,
} from "./code-indexer.js";
import { RUNTIME_FLOWS } from "./runtime-flows.js";
import type { RepositoryKnowledgeModel } from "./types.js";

/** Build unified Phase 2 repository knowledge model. */
export async function buildRepositoryKnowledgeModel(
  reader: RepositoryReader,
): Promise<RepositoryKnowledgeModel> {
  const { modules, indexedPaths } = await indexCodeModules(reader);
  const dependencies = buildArchitectureDependencies();

  return {
    version: "PILLOW-RI-001",
    builtAt: new Date().toISOString(),
    architecture: ARCHITECTURE_BOUNDARIES,
    runtimeFlows: RUNTIME_FLOWS,
    modules,
    screens: SCREEN_ROUTES,
    dependencies,
    indexedPaths,
  };
}
