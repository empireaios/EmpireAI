import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";

const PLACEHOLDER_EVENTS = [
  "14:02 Morgan · scan wireless",
  "14:01 Casey · manufacture Nova",
  "13:58 Guardian · risk check clear",
];

/** REAL-079 zone: Agent activity stream placeholder (no SSE). */
export function AgentActivityPlaceholder() {
  return (
    <CockpitPanel title="Agent Activity">
      <ul className="space-y-2">
        {PLACEHOLDER_EVENTS.map((event) => (
          <li key={event} className="font-mono text-xs text-[#8a847a]">
            {event}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-[#6f6a60]">
        Live stream · placeholder
      </p>
    </CockpitPanel>
  );
}
