import styles from "./MetricCard.module.css";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  source?: "REAL" | "SIMULATED";
  tone?: "default" | "success" | "warning";
}

export function MetricCard({ label, value, hint, source, tone = "default" }: MetricCardProps) {
  return (
    <article className={styles.card} data-tone={tone}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
      {source && (
        <span className={styles.source} data-source={source}>
          {source}
        </span>
      )}
    </article>
  );
}
