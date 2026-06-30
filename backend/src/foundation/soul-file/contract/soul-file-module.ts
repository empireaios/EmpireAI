import type { SoulFileDocument } from "../models/soul-file-document.js";
import type { SoulFileRepository } from "../repositories/soul-file-repository.js";
import { getSoulFileRepository } from "../repositories/sqlite-soul-file-repository.js";

export const SOUL_FILE_MODULE_ID = "soul-file" as const;

export type SoulFileCapability =
  | "soul-file.read"
  | "soul-file.initialize"
  | "soul-file.evolve"
  | "soul-file.export"
  | "soul-file.import"
  | "soul-file.integrity"
  | "soul-file.diff"
  | "soul-file.history";

export const SOUL_FILE_CAPABILITIES: SoulFileCapability[] = [
  "soul-file.read",
  "soul-file.initialize",
  "soul-file.evolve",
  "soul-file.export",
  "soul-file.import",
  "soul-file.integrity",
  "soul-file.diff",
  "soul-file.history",
];

export type SoulFileModuleContract = {
  moduleId: typeof SOUL_FILE_MODULE_ID;
  capabilities: SoulFileCapability[];
  repository: SoulFileRepository;
  getLatest(workspaceId: string): SoulFileDocument | null;
};

export function createSoulFileModuleContract(): SoulFileModuleContract {
  const repository = getSoulFileRepository();
  return {
    moduleId: SOUL_FILE_MODULE_ID,
    capabilities: SOUL_FILE_CAPABILITIES,
    repository,
    getLatest: (workspaceId) => repository.getLatestSnapshot(workspaceId),
  };
}
