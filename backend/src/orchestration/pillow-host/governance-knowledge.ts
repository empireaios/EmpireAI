import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import {
  auditGovernanceBundle,
  PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES,
  type GovernanceBundleAudit,
} from "@empireai/pillow";

/** Mandatory executive knowledge paths checked before Pillow bootstrap (self-assessment). */
export const REQUIRED_KNOWLEDGE_FILES = PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES;

export const MIN_DOCTRINE_FILES = 2;

export type GovernanceKnowledgeDiagnostics = GovernanceBundleAudit;

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
  return auditGovernanceBundle(
    repositoryRoot,
    async (absolutePath) => {
      try {
        await access(absolutePath, constants.R_OK);
        return true;
      } catch {
        return false;
      }
    },
    countDoctrineFiles,
  );
}
