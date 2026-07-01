import Link from "next/link";
import { COCKPIT_BASE } from "@/lib/cockpit/types";
import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";

const PLACEHOLDER_HEADLINE =
  "Portfolio velocity is accelerating across commerce and intelligence.";

const PLACEHOLDER_PRIORITIES = ["Scale top revenue", "Launch Nova ads", "Manufacture vertical"];

/** REAL-079 zone: Command snapshot (summary only — routes to Command Centre). */
export function CommandSnapshotPlaceholder() {
  return (
    <CockpitPanel
      title="Command Snapshot"
      action={
        <Link
          href={`${COCKPIT_BASE}/command`}
          className="text-xs text-[#d4af37] hover:text-[#f0d78c]"
        >
          Open Command Centre →
        </Link>
      }
    >
      <p className="text-sm leading-relaxed text-[#c8c0b0]">{PLACEHOLDER_HEADLINE}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        Priorities
      </p>
      <ul className="mt-2 space-y-1.5">
        {PLACEHOLDER_PRIORITIES.map((priority) => (
          <li key={priority} className="text-sm text-[#8a847a]">
            · {priority}
          </li>
        ))}
      </ul>
    </CockpitPanel>
  );
}
