import { Check, Clock, ExternalLink, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { ApprovalQueueItem } from "@/lib/approval-queue";
import type { ApprovalVerdict } from "@/hooks/useFounderGovernanceChrome";
import { paths } from "@/routes/paths";
import styles from "./GlobalApprovalBar.module.css";

export interface GlobalApprovalBarProps {
  pendingCount: number;
  topItem: ApprovalQueueItem | null;
  onVerdict: (item: ApprovalQueueItem, verdict: ApprovalVerdict) => void;
}

/** GC-02 — persistent approval bar for founder screens. */
export function GlobalApprovalBar({ pendingCount, topItem, onVerdict }: GlobalApprovalBarProps) {
  const location = useLocation();

  return (
    <div className={styles.bar} data-testid="gc-02-approval-bar" aria-label="Approval Bar">
      <div className={styles.summary}>
        <span className={styles.label}>Approval Bar</span>
        <span className={styles.count} data-count={pendingCount}>
          {pendingCount} pending
        </span>
        {topItem ? (
          <span className={styles.topItem} title={topItem.detail}>
            {topItem.title}
          </span>
        ) : (
          <span className={styles.clear}>No money-moving items awaiting verdict</span>
        )}
      </div>

      <div className={styles.actions}>
        {topItem && (
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.defer}`}
              onClick={() => onVerdict(topItem, "deferred")}
              aria-label={`Defer ${topItem.title}`}
            >
              <Clock size={14} aria-hidden="true" /> Defer
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.reject}`}
              onClick={() => onVerdict(topItem, "rejected")}
              aria-label={`Reject ${topItem.title}`}
            >
              <X size={14} aria-hidden="true" /> Reject
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.approve}`}
              onClick={() => onVerdict(topItem, "approved")}
              aria-label={`Approve ${topItem.title}`}
            >
              <Check size={14} aria-hidden="true" /> Approve
            </button>
          </>
        )}
        <Link
          to={paths.dashboard.approvals}
          state={{ from: location.pathname }}
          className={styles.queueLink}
        >
          Open queue <ExternalLink size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
