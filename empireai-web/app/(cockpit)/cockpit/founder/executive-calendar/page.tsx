import { ExecutiveCalendarDashboard } from "@/components/cockpit/executive-calendar/ExecutiveCalendarDashboard";

/** SCR E1-CALENDAR · E1-08 — Executive Calendar Engine */
export default function ExecutiveCalendarPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-08 · WHEN IT HAPPENS</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Calendar</h1>
        <p className="text-sm text-[#8a847a]">
          Planning determines WHAT · Calendar determines WHEN · one constitutional planning cadence
        </p>
      </header>
      <ExecutiveCalendarDashboard />
    </div>
  );
}
