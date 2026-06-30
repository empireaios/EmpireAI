import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SyncPreview, SyncProposal } from "./types.js";

export interface SyncApplyResult {
  applied: number;
  skipped: number;
  details: string[];
  dryRun: boolean;
}

export async function applyApprovedSync(
  repositoryRoot: string,
  preview: SyncPreview,
  dryRun: boolean,
): Promise<SyncApplyResult> {
  const details: string[] = [];
  let applied = 0;
  let skipped = 0;

  for (const proposal of preview.proposals) {
    if (proposal.changeType === "review_only") {
      skipped++;
      details.push(`Review only — ${proposal.artifact.relativePath}`);
      continue;
    }

    if (dryRun) {
      applied++;
      details.push(`[dry-run] Would apply to ${proposal.artifact.relativePath}`);
      continue;
    }

    try {
      await applyProposal(repositoryRoot, proposal);
      applied++;
      details.push(`Applied to ${proposal.artifact.relativePath}`);
    } catch (err) {
      skipped++;
      details.push(
        `Failed ${proposal.artifact.relativePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { applied, skipped, details, dryRun };
}

async function applyProposal(
  repositoryRoot: string,
  proposal: SyncProposal,
): Promise<void> {
  const absolute = path.join(repositoryRoot, proposal.artifact.relativePath);

  if (proposal.changeType === "append") {
    await appendFile(absolute, proposal.proposedContent, "utf8");
    return;
  }

  if (proposal.changeType === "update_marker") {
    const existing = await readFile(absolute, "utf8");
    const updated = updateLastUpdatedLine(existing, proposal.proposedContent);
    if (updated !== existing) {
      await writeFile(absolute, updated, "utf8");
    }
  }
}

function updateLastUpdatedLine(content: string, newLine: string): string {
  const marker = /\*\*Last updated:\*\*.+/;
  if (marker.test(content)) {
    return content.replace(marker, newLine);
  }
  return content;
}

export async function readArtifactSnapshot(
  reader: RepositoryReader,
  relativePath: string,
): Promise<string | null> {
  return reader.readText(relativePath);
}
