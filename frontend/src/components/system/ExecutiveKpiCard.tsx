import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import styles from "./ExecutiveKpiCard.module.css";

export type KpiTrendDirection = "up" | "down" | "flat";
export type KpiHealth = "ok" | "warning" | "critical" | "neutral";

export interface KpiTrend {
  direction: KpiTrendDirection;
  label: string;
  /** When true, "up" is good (green). When false (e.g. cost), "up" is bad. Default true. */
  positiveIsGood?: boolean;
}

export interface ExecutiveKpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: KpiTrend;
  health?: KpiHealth;
  /** Click-through navigation target. */
  to?: string;
  source?: "REAL" | "SIMULATED" | "CIC";
  accent?: boolean;
}

function trendTone(trend: KpiTrend): "good" | "bad" | "flat" {
  if (trend.direction === "flat") return "flat";
  const positiveIsGood = trend.positiveIsGood ?? true;
  const isUp = trend.direction === "up";
  return isUp === positiveIsGood ? "good" : "bad";
}

export function ExecutiveKpiCard({
  label,
  value,
  hint,
  trend,
  health = "neutral",
  to,
  source,
  accent,
}: ExecutiveKpiCardProps) {
  const TrendIcon = trend
    ? trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : Minus
    : null;

  const body = (
    <>
      <span className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={styles.healthDot} data-health={health} aria-hidden="true" />
      </span>
      <span className={styles.value}>{value}</span>
      <span className={styles.foot}>
        {trend && TrendIcon && (
          <span className={styles.trend} data-tone={trendTone(trend)}>
            <TrendIcon size={14} aria-hidden="true" />
            {trend.label}
          </span>
        )}
        {hint && <span className={styles.hint}>{hint}</span>}
        {source && (
          <span className={styles.source} data-source={source}>
            {source}
          </span>
        )}
      </span>
    </>
  );

  const className = `${styles.card} ${accent ? styles.accent : ""} ${to ? styles.clickable : ""}`.trim();

  if (to) {
    return (
      <Link to={to} className={className} aria-label={`${label} — open`}>
        {body}
      </Link>
    );
  }
  return <article className={className}>{body}</article>;
}

export function ExecutiveKpiGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
