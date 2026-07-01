import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";

const PLACEHOLDER_DECISIONS = [
  { id: "d1", label: "Scale Meta ads" },
  { id: "d2", label: "Approve new supplier" },
];

/** SCR-010 zone: Pending decisions placeholder (no approve/deny actions). */
export function PendingDecisionsPlaceholder() {
  return (
    <CockpitPanel title="Pending Decisions">
      <ul className="space-y-3">
        {PLACEHOLDER_DECISIONS.map((decision) => (
          <li
            key={decision.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-3"
          >
            <span className="text-sm text-[#c8c0b0]">{decision.label}</span>
            <div className="flex gap-2">
              <span className="rounded border border-gold/15 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#8a847a]">
                Deny
              </span>
              <span className="rounded border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#d4af37]">
                Approve
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CockpitPanel>
  );
}
