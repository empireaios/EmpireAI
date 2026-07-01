import { Activity, CheckCircle2, Scale, Sparkles } from "lucide-react";
import type { PillowApproval, PillowCursorStatus, PillowHostStatus } from "@/api/pillow";
import styles from "./PillowExecutivePanel.module.css";

interface PillowExecutivePanelProps {
  hostStatus: PillowHostStatus | null;
  cursorStatus: PillowCursorStatus | null;
  approvals: PillowApproval[];
}

export function PillowExecutivePanel({
  hostStatus,
  cursorStatus,
  approvals,
}: PillowExecutivePanelProps) {
  const recentAudits = approvals
    .filter((item) => item.type === "executive_audit_generation")
    .slice(0, 3);
  const pendingCount = approvals.filter((item) => item.status === "Pending").length;
  const journeySync = hostStatus?.journeyPosition ? "Synchronized" : "Unknown";
  const repoHealth =
    hostStatus?.repositoryFingerprint && hostStatus.repositoryRoot ? "Healthy" : "Unverified";
  const commercialReady = cursorStatus?.dryRunLaunch
    ? "Dry-run only (no commercial automation)"
    : "Awaiting approval gate";

  return (
    <section className={styles.root}>
      <h3>Executive Panel</h3>
      <div className={styles.cards}>
        <article>
          <Sparkles size={16} aria-hidden="true" />
          <div>
            <h4>Recommendations</h4>
            <p>{pendingCount} pending approval{pendingCount === 1 ? "" : "s"}</p>
          </div>
        </article>
        <article>
          <Activity size={16} aria-hidden="true" />
          <div>
            <h4>Repository health</h4>
            <p>{repoHealth}</p>
          </div>
        </article>
        <article>
          <Scale size={16} aria-hidden="true" />
          <div>
            <h4>Journey sync</h4>
            <p>{journeySync}</p>
          </div>
        </article>
        <article>
          <CheckCircle2 size={16} aria-hidden="true" />
          <div>
            <h4>Commercial readiness</h4>
            <p>{commercialReady}</p>
          </div>
        </article>
      </div>
      <div className={styles.audits}>
        <h4>Recent audits</h4>
        {recentAudits.length === 0 ? (
          <p className={styles.empty}>No executive audit cards yet</p>
        ) : (
          <ul>
            {recentAudits.map((audit) => (
              <li key={audit.approvalId}>
                <strong>{audit.proposal.title}</strong>
                <span>
                  {audit.status} · {new Date(audit.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
