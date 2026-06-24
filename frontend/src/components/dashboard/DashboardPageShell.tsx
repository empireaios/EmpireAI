import type { ReactNode } from "react";
import styles from "./DashboardPageShell.module.css";

interface DashboardPageShellProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function DashboardPageShell({
  title,
  description,
  children,
}: DashboardPageShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      {children ?? (
        <div className={styles.placeholder}>
          <p>Content coming soon.</p>
        </div>
      )}
    </div>
  );
}
