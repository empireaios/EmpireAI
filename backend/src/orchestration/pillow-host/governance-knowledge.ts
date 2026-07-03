import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

/** Mandatory executive knowledge paths checked before Pillow bootstrap (self-assessment). */
export const REQUIRED_KNOWLEDGE_FILES = [
  "EMPIREAI_SOUL.md",
  "EMPIREAI_CONSTITUTION.md",
  "PILLOW_ARCHITECTURE_CONTRACT.md",
  "JOURNEY.md",
] as const;

export const MIN_DOCTRINE_FILES = 2;

export type GovernanceKnowledgeDiagnostics = {
  resolvedRepoRoot: string;
  requiredKnowledgeFilesFound: boolean;
  missingKnowledgeFiles: string[];
  doctrineFilesFound: number;
  checkedAt: string;
};

async function isReadableFile(root: string, relativePath: string): Promise<boolean> {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function countDoctrineFiles(root: string): Promise<number> {
  let count = 0;
  try {
    const entries = await readdir(root);
    for (const name of entries) {
      if (/^EMPIREAI_.*_DOCTRINE.*\.md$/i.test(name)) {
        if (await isReadableFile(root, name)) count += 1;
      }
    }
  } catch {
    return 0;
  }
  return count;
}

/** Audit whether a resolved repository root exposes approved executive knowledge. */
export async function auditGovernanceKnowledge(
  repositoryRoot: string,
): Promise<GovernanceKnowledgeDiagnostics> {
  const missingKnowledgeFiles: string[] = [];

  for (const file of REQUIRED_KNOWLEDGE_FILES) {
    if (!(await isReadableFile(repositoryRoot, file))) {
      missingKnowledgeFiles.push(file);
    }
  }

  const doctrineFilesFound = await countDoctrineFiles(repositoryRoot);
  if (doctrineFilesFound < MIN_DOCTRINE_FILES) {
    missingKnowledgeFiles.push(
      `doctrine_files>=${MIN_DOCTRINE_FILES} (found ${doctrineFilesFound})`,
    );
  }

  return {
    resolvedRepoRoot: repositoryRoot,
    requiredKnowledgeFilesFound: missingKnowledgeFiles.length === 0,
    missingKnowledgeFiles,
    doctrineFilesFound,
    checkedAt: new Date().toISOString(),
  };
}
