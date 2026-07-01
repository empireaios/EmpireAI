import Link from "next/link";
import { cockpitDepartmentNavigation } from "@/lib/cockpit/navigation";

type HealthStatus = "healthy" | "building" | "warning";

const PLACEHOLDER_STATUS: Record<string, HealthStatus> = {
  intelligence: "healthy",
  commerce: "building",
  operations: "healthy",
  finance: "healthy",
  workforce: "healthy",
  infrastructure: "warning",
  governance: "healthy",
  development: "building",
};

const statusGlyph: Record<HealthStatus, string> = {
  healthy: "●",
  building: "◐",
  warning: "⚠",
};

const statusColor: Record<HealthStatus, string> = {
  healthy: "text-emerald-400",
  building: "text-amber-400",
  warning: "text-orange-400",
};

/** REAL-079 zone: Department health row (8 mini status cards — W-E-005 placeholder). */
export function DepartmentHealthRowPlaceholder() {
  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.02] p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        Department Health
      </p>
      <div className="flex flex-wrap gap-2">
        {cockpitDepartmentNavigation.map((dept) => {
          const status = PLACEHOLDER_STATUS[dept.id] ?? "healthy";
          const shortLabel = dept.label.split(" ")[0] ?? dept.label;
          return (
            <Link
              key={dept.id}
              href={dept.href}
              className="flex items-center gap-1.5 rounded-lg border border-gold/10 px-3 py-2 text-xs text-[#c8c0b0] transition-colors hover:border-gold/25 hover:text-[#f0d78c]"
            >
              <span className={statusColor[status]}>{statusGlyph[status]}</span>
              <span>{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
