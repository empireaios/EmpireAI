import type { ReactNode } from "react";
import { Check, Clock, Search, X } from "lucide-react";
import styles from "./ApprovalPanel.module.css";

export interface ApprovalItem {
  id: string;
  title: string;
  detail?: string;
  meta?: ReactNode;
}

export interface ApprovalPanelProps {
  title?: string;
  items: ApprovalItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDefer?: (id: string) => void;
  onInvestigate?: (id: string) => void;
  /** Disable Approve/Reject/Defer while a decision is in flight or ungated. */
  disabled?: boolean;
  emptyMessage?: string;
}

/** Reusable Approve / Reject / Investigate decision panel (governed actions). */
export function ApprovalPanel({
  title = "Awaiting Your Decision",
  items,
  onApprove,
  onReject,
  onDefer,
  onInvestigate,
  disabled = false,
  emptyMessage = "Nothing awaiting your approval.",
}: ApprovalPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {items.length > 0 && <span className={styles.count}>{items.length}</span>}
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemMain}>
                <p className={styles.itemTitle}>{item.title}</p>
                {item.detail && <p className={styles.itemDetail}>{item.detail}</p>}
                {item.meta && <div className={styles.itemMeta}>{item.meta}</div>}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.investigate}`}
                  onClick={() => onInvestigate?.(item.id)}
                  aria-label={`Investigate ${item.title}`}
                >
                  <Search size={15} aria-hidden="true" /> Investigate
                </button>
                {onDefer && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.defer}`}
                    onClick={() => onDefer(item.id)}
                    disabled={disabled}
                    aria-label={`Defer ${item.title}`}
                  >
                    <Clock size={15} aria-hidden="true" /> Defer
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.reject}`}
                  onClick={() => onReject?.(item.id)}
                  disabled={disabled}
                  aria-label={`Reject ${item.title}`}
                >
                  <X size={15} aria-hidden="true" /> Reject
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.approve}`}
                  onClick={() => onApprove?.(item.id)}
                  disabled={disabled}
                  aria-label={`Approve ${item.title}`}
                >
                  <Check size={15} aria-hidden="true" /> Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
