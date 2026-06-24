import type { ReactNode } from "react";
import type { MetricTrend } from "@/lib/platform/types";

type PlatformPageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PlatformPageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PlatformPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-gold/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-gold/70">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold text-[#f0d78c] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8a847a] sm:text-base">
          {description}
        </p>
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  change?: string;
  trend?: MetricTrend;
};

export function StatCard({ label, value, change, trend }: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-[#6f6a60]";

  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.02] p-5 transition-all duration-500 hover:border-gold/25 hover:bg-white/[0.04]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#6f6a60]">{label}</p>
      <p className="mt-2 font-display text-2xl text-[#f0d78c]">{value}</p>
      {change && (
        <p className={`mt-1 text-xs font-medium ${trendColor}`}>{change}</p>
      )}
    </div>
  );
}

type PanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
}: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-gold/10 bg-white/[0.02] ${className}`}
    >
      <div className="flex items-start justify-between border-b border-gold/10 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[#f0d78c]">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-[#6f6a60]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles = {
    default: "border-gold/20 bg-white/[0.03] text-[#a8a095]",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    danger: "border-red-500/30 bg-red-500/10 text-red-400",
    gold: "border-gold/30 bg-gold/10 text-[#d4af37]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

type DataTableProps<T> = {
  columns: { key: string; header: string; render?: (row: T) => ReactNode }[];
  data: T[];
  keyField: keyof T;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gold/10 text-xs uppercase tracking-[0.15em] text-[#6f6a60]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              className="border-b border-gold/5 transition-colors hover:bg-white/[0.02]"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-[#c8c0b0]">
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ActionButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function ActionButton({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  onClick,
}: ActionButtonProps) {
  const styles = {
    primary:
      "bg-gradient-to-r from-[#b8922a] to-[#d4af37] text-[#1a1408] hover:opacity-90",
    secondary:
      "border border-gold/25 bg-white/[0.03] text-[#f0d78c] hover:border-gold/40",
    ghost: "text-[#a8a095] hover:bg-white/[0.04] hover:text-[#f0d78c]",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
