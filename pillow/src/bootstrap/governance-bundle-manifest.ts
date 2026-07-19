/**
 * Railway governance bundle manifest (PILLOW-002 / PILLOW-016).
 * Single source of truth for which repository trees are mirrored at build time
 * and which files PillowHost must verify before session bootstrap.
 */

import { RECONSTRUCTION_SCAN_PROFILES } from "./reconstruction-rules.js";
import {
  BRAIN_ARCHITECTURE_COMPANION_PATH,
  BRAIN_RUNTIME_AUDIT_PATH,
  BRAIN_RUNTIME_SYSTEM_PATH,
} from "../brain-runtime/paths.js";

/** Scan profiles copied into backend/.pillow-governance-bundle during build. */
export const GOVERNANCE_BUNDLE_SCAN_PROFILES = RECONSTRUCTION_SCAN_PROFILES;

/** Root executive knowledge required by PillowHost pre-bootstrap audit. */
export const PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES = [
  "EMPIREAI_SOUL.md",
  "EMPIREAI_CONSTITUTION.md",
  "PILLOW_ARCHITECTURE_CONTRACT.md",
  "JOURNEY.md",
] as const;

export const PILLOW_HOST_MIN_DOCTRINE_FILES = 2;

/**
 * Runtime companion documents required during Pillow session bootstrap
 * (initialize() hard-fail paths) but outside reconstruction category scans
 * until architecture/audit profiles were added.
 */
export const PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES = [
  ...PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES,
  BRAIN_RUNTIME_SYSTEM_PATH,
  BRAIN_ARCHITECTURE_COMPANION_PATH,
  BRAIN_RUNTIME_AUDIT_PATH,
  "docs/architecture/EMPIREAI_BUILDER_ARCHITECTURE.md",
] as const;

export type GovernanceBundleAudit = {
  resolvedRepoRoot: string;
  requiredKnowledgeFilesFound: boolean;
  bootstrapRequiredFilesFound: boolean;
  missingKnowledgeFiles: string[];
  missingBootstrapFiles: string[];
  doctrineFilesFound: number;
  checkedAt: string;
};

export async function auditGovernanceBundle(
  repositoryRoot: string,
  readFile: (absolutePath: string) => Promise<boolean>,
  countDoctrineFiles: (root: string) => Promise<number>,
): Promise<GovernanceBundleAudit> {
  const missingKnowledgeFiles: string[] = [];
  const missingBootstrapFiles: string[] = [];

  for (const file of PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES) {
    const ok = await readFile(`${repositoryRoot}/${file}`.replace(/\\/g, "/"));
    if (!ok) missingKnowledgeFiles.push(file);
  }

  for (const file of PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES) {
    const ok = await readFile(`${repositoryRoot}/${file}`.replace(/\\/g, "/"));
    if (!ok) missingBootstrapFiles.push(file);
  }

  const doctrineFilesFound = await countDoctrineFiles(repositoryRoot);
  if (doctrineFilesFound < PILLOW_HOST_MIN_DOCTRINE_FILES) {
    missingKnowledgeFiles.push(
      `doctrine_files>=${PILLOW_HOST_MIN_DOCTRINE_FILES} (found ${doctrineFilesFound})`,
    );
  }

  return {
    resolvedRepoRoot: repositoryRoot,
    requiredKnowledgeFilesFound: missingKnowledgeFiles.length === 0,
    bootstrapRequiredFilesFound: missingBootstrapFiles.length === 0,
    missingKnowledgeFiles,
    missingBootstrapFiles,
    doctrineFilesFound,
    checkedAt: new Date().toISOString(),
  };
}
