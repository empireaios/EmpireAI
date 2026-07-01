import type { ReactNode } from "react";
import styles from "./ExecutivePanel.module.css";

export interface ExecutivePanelProps {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  /** Right-aligned header actions (links, buttons). */
  actions?: ReactNode;
  variant?: "default" | "accent" | "muted";
  /** Optional footer area (e.g. "view all"). */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Generic executive container for summaries, investigations, recommendations,
 * and AI insights. Header + body + optional footer.
 */
export function ExecutivePanel({
  title,
  eyebrow,
  icon,
  actions,
  variant = "default",
  footer,
  children,
}: ExecutivePanelProps) {
  return (
    <section className={styles.panel} data-variant={variant}>
      <div className={styles.header}>
        <div className={styles.heading}>
          {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 className={styles.title}>{title}</h2>
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
