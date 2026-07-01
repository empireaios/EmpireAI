import { Link } from "react-router-dom";
import { AlertTriangle, Info, ShieldAlert, X } from "lucide-react";
import styles from "./AlertBanner.module.css";

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertBannerProps {
  severity?: AlertSeverity;
  title: string;
  message?: string;
  action?: { label: string; to?: string; onClick?: () => void };
  onDismiss?: () => void;
}

const ICONS = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
} as const;

/** Business-critical alert banner. Use sparingly — only for executive-grade alerts. */
export function AlertBanner({ severity = "critical", title, message, action, onDismiss }: AlertBannerProps) {
  const Icon = ICONS[severity];
  return (
    <div className={styles.banner} data-severity={severity} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      {action &&
        (action.to ? (
          <Link to={action.to} className={styles.action}>
            {action.label}
          </Link>
        ) : (
          <button type="button" className={styles.action} onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss alert">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
