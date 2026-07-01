import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";
import {
  PLACEHOLDER_MISSION_QUEUE,
  type MissionQueueItem,
} from "@/components/cockpit/widgets/missionPlaceholderData";

function MissionQueueSection({
  title,
  items,
}: {
  title: string;
  items: MissionQueueItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <CockpitPanel title={title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-[10px] uppercase tracking-[0.15em] text-[#6f6a60]">
              <th className="pb-2 pr-4 font-semibold">Type</th>
              <th className="pb-2 pr-4 font-semibold">Title</th>
              <th className="pb-2 pr-4 font-semibold">Age</th>
              <th className="pb-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((mission) => (
              <tr key={mission.id} className="border-b border-gold/5 last:border-0">
                <td className="py-3 pr-4 text-xs uppercase tracking-wider text-[#d4af37]">
                  {mission.type}
                </td>
                <td className="py-3 pr-4 text-[#c8c0b0]">
                  {mission.queue === "completed" && (
                    <span className="mr-1 text-emerald-400">✓</span>
                  )}
                  {mission.title}
                </td>
                <td className="py-3 pr-4 text-[#8a847a]">{mission.age}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {mission.actions.length === 0 ? (
                      <span className="text-xs text-[#6f6a60]">—</span>
                    ) : (
                      mission.actions.map((action) => (
                        <span
                          key={action}
                          className="rounded border border-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#d4af37]"
                        >
                          {action}
                        </span>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CockpitPanel>
  );
}

/** SCR-020 zone: Full mission queue (urgent, pending, completed sections). */
export function MissionQueueFullPlaceholder() {
  const urgent = PLACEHOLDER_MISSION_QUEUE.filter((item) => item.queue === "urgent");
  const pending = PLACEHOLDER_MISSION_QUEUE.filter((item) => item.queue === "pending");
  const completed = PLACEHOLDER_MISSION_QUEUE.filter(
    (item) => item.queue === "completed",
  );

  return (
    <div className="flex flex-col gap-4">
      <MissionQueueSection title="Urgent" items={urgent} />
      <MissionQueueSection title="Pending" items={pending} />
      <MissionQueueSection title="Completed Today" items={completed} />
    </div>
  );
}
