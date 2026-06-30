import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryInspection } from "../recovery/types.js";
import type { SyncPreview, SyncVerification } from "./types.js";
import { allSyncPaths } from "./scope.js";

export async function verifySynchronization(
  reader: RepositoryReader,
  preview: SyncPreview,
  postInspection: RepositoryInspection,
): Promise<SyncVerification> {
  const issues: string[] = [];

  const journeyConsistent = await verifyJourneyConsistency(reader, issues);
  const referencesValid = await verifyReferences(reader, preview, issues);
  const labelsPreserved = await verifyLabels(reader, issues);
  const integrityOk = postInspection.repositoryIntegrityOk;

  if (!integrityOk) {
    issues.push("Repository integrity check failed after synchronization");
  }

  const passed =
    journeyConsistent &&
    referencesValid &&
    labelsPreserved &&
    integrityOk &&
    issues.length === 0;

  return {
    passed,
    journeyConsistent,
    referencesValid,
    labelsPreserved,
    integrityOk,
    issues,
  };
}

async function verifyJourneyConsistency(
  reader: RepositoryReader,
  issues: string[],
): Promise<boolean> {
  const journey = await reader.readText("JOURNEY.md");
  if (!journey) {
    issues.push("JOURNEY.md not readable");
    return false;
  }
  if (!journey.includes("Current project position")) {
    issues.push("JOURNEY.md missing position marker");
    return false;
  }
  return true;
}

async function verifyReferences(
  reader: RepositoryReader,
  preview: SyncPreview,
  issues: string[],
): Promise<boolean> {
  for (const file of preview.affectedFiles) {
    if (!allSyncPaths().includes(file)) continue;
    const exists = await reader.exists(file);
    if (!exists) {
      issues.push(`Affected artifact missing: ${file}`);
      return false;
    }
  }
  return true;
}

async function verifyLabels(
  reader: RepositoryReader,
  issues: string[],
): Promise<boolean> {
  const status = await reader.readText("EMPIREAI_STATUS.md");
  if (status && !status.includes("EMPIREAI STATUS")) {
    issues.push("EMPIREAI_STATUS.md label header may be corrupted");
    return false;
  }
  return true;
}
