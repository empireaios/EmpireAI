import type { CockpitScreenId } from "@/lib/cockpit/types";

type DepartmentTabPlaceholderProps = {
  screenId: CockpitScreenId;
  title: string;
};

/** Department tab content placeholder — replaced in REAL-090+ department missions. */
export function DepartmentTabPlaceholder({ screenId, title }: DepartmentTabPlaceholderProps) {
  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.02] px-6 py-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        {screenId}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-[#f0d78c]">{title}</h2>
      <p className="mt-3 text-sm text-[#8a847a]">
        Department screen placeholder. Store, supplier, and live commerce integrations ship in
        REAL-090+.
      </p>
    </div>
  );
}
