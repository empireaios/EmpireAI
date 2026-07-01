import styles from "./StatusBadge.module.css";

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const normalized = status.toLowerCase().replace(/_/g, "-");
  return (
    <span className={styles.badge} data-status={normalized}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
