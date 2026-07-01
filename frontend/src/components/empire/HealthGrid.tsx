import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { healthFromStatus } from "@/lib/empire-data";
import styles from "./HealthGrid.module.css";

export interface HealthItem {
  id: string;
  label: string;
  status: string;
  detail?: string;
}

interface HealthGridProps {
  items: HealthItem[];
  title?: string;
}

export function HealthGrid({ items, title = "System Health" }: HealthGridProps) {
  return (
    <section className={styles.grid}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.items}>
        {items.map((item) => {
          const health = healthFromStatus(item.status);
          return (
            <article key={item.id} className={styles.item} data-health={health}>
              <span className={styles.dot} data-health={health} aria-hidden="true" />
              <div className={styles.content}>
                <span className={styles.label}>{item.label}</span>
                <StatusBadge status={item.status} />
                {item.detail && <span className={styles.detail}>{item.detail}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface CommandMetricProps {
  label: string;
  value: ReactNode;
  hint?: string;
  source?: "REAL" | "SIMULATED";
  accent?: boolean;
  /** When set, the tile deep-links to its owner screen (UX-004 acceptance). */
  to?: string;
}

export function CommandMetric({ label, value, hint, source, accent, to }: CommandMetricProps) {
  const className = [styles.metric, accent ? styles.metricAccent : "", to ? styles.metricLink : ""]
    .filter(Boolean)
    .join(" ");
  const inner = (
    <>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
      {hint && <span className={styles.metricHint}>{hint}</span>}
      {source && (
        <span className={styles.metricSource} data-source={source}>
          {source}
        </span>
      )}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return <article className={className}>{inner}</article>;
}
