import { PLACEHOLDER_MISSION_BLOCKERS } from "@/components/cockpit/widgets/missionPlaceholderData";

/** SCR-020 zone: Active blocker strip (static placeholders). */
export function MissionBlockerStripPlaceholder() {
  return (
    <div className="space-y-2">
      {PLACEHOLDER_MISSION_BLOCKERS.map((blocker) => (
        <div
          key={blocker.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-500/25 bg-orange-500/5 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-orange-200">⚠ {blocker.label}</p>
            <p className="mt-0.5 text-xs text-[#8a847a]">{blocker.hint}</p>
          </div>
          <span className="shrink-0 rounded-md border border-gold/15 px-3 py-1 text-xs text-[#d4af37]">
            {blocker.action}
          </span>
        </div>
      ))}
    </div>
  );
}
