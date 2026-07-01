import Link from "next/link";
import { COCKPIT_BASE } from "@/lib/cockpit/types";
import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";
import {
  PLACEHOLDER_MISSION_PREVIEWS,
  type MissionPreviewItem,
} from "@/components/cockpit/widgets/missionPlaceholderData";

const severityStyles: Record<MissionPreviewItem["severity"], string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  low: "text-[#8a847a]",
};

const severityGlyph: Record<MissionPreviewItem["severity"], string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "○",
};

/** REAL-079 zone: Mission queue preview (top items — routes to Mission Centre). */
export function MissionQueuePreviewPlaceholder() {
  return (
    <CockpitPanel
      title="Mission Queue"
      action={
        <Link
          href={`${COCKPIT_BASE}/missions`}
          className="text-xs text-[#d4af37] hover:text-[#f0d78c]"
        >
          Open Mission Centre →
        </Link>
      }
    >
      <ul className="space-y-3">
        {PLACEHOLDER_MISSION_PREVIEWS.map((mission) => (
          <li
            key={mission.id}
            className="flex items-center justify-between gap-3 border-b border-gold/5 pb-3 last:border-0 last:pb-0"
          >
            <span className={`text-sm ${severityStyles[mission.severity]}`}>
              {severityGlyph[mission.severity]} {mission.label}
            </span>
            <span className="shrink-0 rounded border border-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#d4af37]">
              {mission.action}
            </span>
          </li>
        ))}
      </ul>
    </CockpitPanel>
  );
}
