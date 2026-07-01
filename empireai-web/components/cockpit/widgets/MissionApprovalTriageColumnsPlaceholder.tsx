import {
  countMissionsByQueue,
  PLACEHOLDER_MISSION_QUEUE,
} from "@/components/cockpit/widgets/missionPlaceholderData";

const TRIAGE_COLUMNS = [
  { id: "urgent", label: "Urgent", queue: "urgent" as const },
  { id: "pending", label: "Pending", queue: "pending" as const },
  { id: "done", label: "Done", queue: "completed" as const },
  { id: "all", label: "All", queue: null },
];

/** SCR-020 zone: Approval triage summary columns (static counts). */
export function MissionApprovalTriageColumnsPlaceholder() {
  const total = PLACEHOLDER_MISSION_QUEUE.length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TRIAGE_COLUMNS.map((column, index) => {
        const count =
          column.queue === null ? total : countMissionsByQueue(column.queue);
        const active = index === 0;

        return (
          <div
            key={column.id}
            className={`rounded-xl border px-4 py-3 ${
              active
                ? "border-gold/30 bg-gold/10"
                : "border-gold/10 bg-white/[0.02]"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
              {column.label}
            </p>
            <p className="mt-1 font-display text-2xl text-[#f0d78c]">{count}</p>
          </div>
        );
      })}
    </div>
  );
}
