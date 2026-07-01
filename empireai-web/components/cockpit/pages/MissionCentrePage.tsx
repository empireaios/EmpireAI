import { MissionApprovalTriageColumnsPlaceholder } from "@/components/cockpit/widgets/MissionApprovalTriageColumnsPlaceholder";
import { MissionBlockerStripPlaceholder } from "@/components/cockpit/widgets/MissionBlockerStripPlaceholder";
import { MissionQueueFullPlaceholder } from "@/components/cockpit/widgets/MissionQueueFullPlaceholder";

/** SCR-020 — Mission Centre composition (REAL-079 wireframe zones). */
export function MissionCentrePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6f6a60]">
            Executive Command
          </p>
          <h1 className="font-display text-2xl font-semibold text-[#f0d78c] sm:text-3xl">
            Mission Centre
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["Urgent (3)", "Pending (4)", "Done", "All"].map((filter, index) => (
            <span
              key={filter}
              className={`rounded-lg border px-3 py-1.5 ${
                index === 0
                  ? "border-gold/30 bg-gold/10 text-[#f0d78c]"
                  : "border-gold/15 text-[#8a847a]"
              }`}
            >
              {filter}
            </span>
          ))}
        </div>
      </div>

      <MissionBlockerStripPlaceholder />
      <MissionApprovalTriageColumnsPlaceholder />
      <MissionQueueFullPlaceholder />
    </div>
  );
}
