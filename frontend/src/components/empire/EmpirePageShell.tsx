import type { ReactNode } from "react";
import styles from "./EmpirePageShell.module.css";

interface EmpirePageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function EmpirePageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: EmpirePageShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children}
    </div>
  );
}
