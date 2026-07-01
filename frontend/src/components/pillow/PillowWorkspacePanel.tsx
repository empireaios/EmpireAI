import { FolderGit2, GitBranch, MapPin, Shield } from "lucide-react";
import type { PillowApproval, PillowCursorStatus, PillowHostStatus } from "@/api/pillow";
import styles from "./PillowWorkspacePanel.module.css";

interface PillowWorkspacePanelProps {
  workspaceId: string;
  hostStatus: PillowHostStatus | null;
  cursorStatus: PillowCursorStatus | null;
  pendingApproval: PillowApproval | null;
}

export function PillowWorkspacePanel({
  workspaceId,
  hostStatus,
  cursorStatus,
  pendingApproval,
}: PillowWorkspacePanelProps) {
  const providers = hostStatus?.llmProviders?.join(", ") ?? "—";

  return (
    <section className={styles.root}>
      <h3>Workspace</h3>
      <dl className={styles.grid}>
        <div>
          <dt>Workspace</dt>
          <dd>{workspaceId}</dd>
        </div>
        <div>
          <dt>
            <FolderGit2 size={13} aria-hidden="true" /> Repository
          </dt>
          <dd>{hostStatus?.repositoryRoot ?? "—"}</dd>
        </div>
        <div>
          <dt>
            <GitBranch size={13} aria-hidden="true" /> Fingerprint
          </dt>
          <dd className={styles.mono}>{hostStatus?.repositoryFingerprint ?? "—"}</dd>
        </div>
        <div>
          <dt>
            <MapPin size={13} aria-hidden="true" /> Journey
          </dt>
          <dd>{hostStatus?.journeyPosition ?? "—"}</dd>
        </div>
        <div>
          <dt>Current mission</dt>
          <dd>{hostStatus?.currentMission ?? cursorStatus?.activeMissionId ?? "—"}</dd>
        </div>
        <div>
          <dt>
            <Shield size={13} aria-hidden="true" /> Brain providers
          </dt>
          <dd>{providers}</dd>
        </div>
        <div>
          <dt>Cursor presence</dt>
          <dd>{cursorStatus?.presence ?? "—"}</dd>
        </div>
        <div>
          <dt>Current approval</dt>
          <dd>{pendingApproval?.proposal.title ?? "None pending"}</dd>
        </div>
      </dl>
    </section>
  );
}
