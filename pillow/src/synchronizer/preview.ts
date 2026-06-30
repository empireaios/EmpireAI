import { randomUUID } from "node:crypto";
import type { DetectedChange, SyncPreview, SyncProposal } from "./types.js";
import { findSyncTarget, SYNC_ARTIFACT_CATALOG } from "./scope.js";
import type { RepositoryInspection } from "../recovery/types.js";

export function generateSyncPreview(
  changes: DetectedChange[],
  inspection: RepositoryInspection,
  context: { missionId?: string; missionTitle?: string },
): SyncPreview {
  const proposals: SyncProposal[] = [];
  const affectedKinds = new Set<string>();

  for (const change of changes) {
    for (const kind of change.affectedArtifacts) {
      affectedKinds.add(kind);
    }
  }

  for (const kind of affectedKinds) {
    const target = findSyncTarget(kind as SyncProposal["artifact"]["kind"]);
    if (!target) continue;

    const related = changes.filter((c) => c.affectedArtifacts.includes(kind as never));
    const reason = related.map((c) => c.summary).join(" · ");
    const evidence = related.flatMap((c) => c.evidence);

    const requirement =
      kind === "journey_audit" || kind === "empire_status"
        ? "required"
        : kind === "empire_soul"
          ? "optional"
          : "optional";

    proposals.push({
      proposalId: randomUUID(),
      artifact: target,
      reason,
      changeType:
        kind === "journey_audit"
          ? "append"
          : kind === "empire_status"
            ? "update_marker"
            : "review_only",
      proposedContent: buildProposedContent(target.relativePath, context, evidence, reason),
      impactSummary: `${target.label} — ${requirement} sync derived from verified evidence`,
      requirement,
      requiresApproval: true,
    });
  }

  if (proposals.length === 0 && changes.length > 0) {
    const audit = findSyncTarget("journey_audit")!;
    proposals.push({
      proposalId: randomUUID(),
      artifact: audit,
      reason: changes.map((c) => c.summary).join("; "),
      changeType: "append",
      proposedContent: buildProposedContent(
        audit.relativePath,
        context,
        changes.flatMap((c) => c.evidence),
        "Repository synchronization review",
      ),
      impactSummary: "Journey Audit — log synchronization review",
      requirement: "required",
      requiresApproval: true,
    });
  }

  const affectedFiles = [
    ...new Set(proposals.map((p) => p.artifact.relativePath)),
  ];

  return {
    previewId: randomUUID(),
    generatedAt: new Date().toISOString(),
    changes,
    proposals,
    affectedFiles,
    approvalRequired: proposals.some((p) => p.requiresApproval),
    impactSummary: `${proposals.length} proposal(s) across ${affectedFiles.length} artifact(s) — approval required before write`,
    inspection,
  };
}

function buildProposedContent(
  path: string,
  context: { missionId?: string; missionTitle?: string },
  evidence: string[],
  reason: string,
): string {
  const at = new Date().toISOString().slice(0, 10);
  const mission = context.missionId ?? "repository-event";
  const title = context.missionTitle ?? "Synchronization";

  if (path === "JOURNEY_AUDIT.md") {
    return `
---

**${mission} — ${title} (${at})** — ${reason}

| Action | Row / Artifact | Note |
|---|---|---|
| Synchronized | \`${path}\` | Evidence: ${evidence.slice(0, 3).join(", ")} |

`;
  }

  if (path === "EMPIREAI_STATUS.md") {
    return `**Last updated:** ${mission} ${title} (${at}) — derived from ${reason}`;
  }

  return `<!-- Sync review ${at}: ${reason} — evidence: ${evidence.slice(0, 2).join(", ")} -->`;
}

export function previewTouchesGovernance(preview: SyncPreview): boolean {
  return preview.proposals.some((p) =>
    SYNC_ARTIFACT_CATALOG.some((t) => t.relativePath === p.artifact.relativePath),
  );
}
