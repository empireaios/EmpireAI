import path from "node:path";
import { fileURLToPath } from "node:url";

import { findRepositoryRoot } from "@empireai/pillow";
import { env } from "../../config/env.js";
import {
  auditGovernanceKnowledge,
  type GovernanceKnowledgeDiagnostics,
} from "./governance-knowledge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Bundled governance mirror produced by scripts/sync-pillow-governance.mjs during Railway build. */
export function resolveBundledGovernanceRoot(): string {
  return path.resolve(__dirname, "../../../.pillow-governance-bundle");
}

let lastGovernanceAudit: GovernanceKnowledgeDiagnostics | null = null;

export function getLastGovernanceKnowledgeAudit(): GovernanceKnowledgeDiagnostics | null {
  return lastGovernanceAudit;
}

export type PillowRepositoryRootResolution = {
  repositoryRoot: string;
  governanceAudit: GovernanceKnowledgeDiagnostics;
};

function buildRepositoryRootCandidates(override?: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (value: string | undefined) => {
    if (!value?.trim()) return;
    const resolved = path.resolve(value.trim());
    if (seen.has(resolved)) return;
    seen.add(resolved);
    ordered.push(resolved);
  };

  push(override);
  // Railway runtime checkout may omit governance trees; prefer the build-time bundle first.
  if (process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_ENVIRONMENT) {
    push(resolveBundledGovernanceRoot());
  }
  push(env.EMPIREAI_REPO_ROOT);
  push(process.env.EMPIREAI_REPO_ROOT);
  if (process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_ENVIRONMENT) {
    push("/app");
  }
  push(process.cwd());
  push(path.resolve(__dirname, "../../../.."));
  if (!(process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_ENVIRONMENT)) {
    push(resolveBundledGovernanceRoot());
  }

  return ordered;
}

/** Resolve monorepo root for Pillow bootstrap — prefer roots with complete executive knowledge. */
export async function resolvePillowRepositoryRoot(
  override?: string,
): Promise<string> {
  const resolution = await resolvePillowRepositoryRootWithAudit(override);
  return resolution.repositoryRoot;
}

export async function resolvePillowRepositoryRootWithAudit(
  override?: string,
): Promise<PillowRepositoryRootResolution> {
  const candidates = buildRepositoryRootCandidates(override);
  const discovered: PillowRepositoryRootResolution[] = [];

  for (const candidate of candidates) {
    const found = await findRepositoryRoot(candidate);
    if (!found) continue;

    const governanceAudit = await auditGovernanceKnowledge(found);
    const resolution = { repositoryRoot: found, governanceAudit };
    discovered.push(resolution);

    if (governanceAudit.requiredKnowledgeFilesFound && governanceAudit.bootstrapRequiredFilesFound) {
      lastGovernanceAudit = governanceAudit;
      return resolution;
    }
  }

  if (discovered.length === 0) {
    throw new Error(
      "Could not resolve EmpireAI repository root for Pillow. Set EMPIREAI_REPO_ROOT.",
    );
  }

  const best = discovered.reduce((current, next) => {
    const currentMissing =
      current.governanceAudit.missingKnowledgeFiles.length +
      current.governanceAudit.missingBootstrapFiles.length;
    const nextMissing =
      next.governanceAudit.missingKnowledgeFiles.length +
      next.governanceAudit.missingBootstrapFiles.length;
    if (nextMissing < currentMissing) return next;
    if (nextMissing > currentMissing) return current;
    return next.governanceAudit.doctrineFilesFound >
      current.governanceAudit.doctrineFilesFound
      ? next
      : current;
  });

  lastGovernanceAudit = best.governanceAudit;
  return best;
}
