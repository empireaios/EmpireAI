import type { ReactNode } from "react";
import styles from "./PageStates.module.css";

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className={styles.centered} role="status">
      <div className={styles.spinner} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.centered} role="alert">
      <p className={styles.error}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
