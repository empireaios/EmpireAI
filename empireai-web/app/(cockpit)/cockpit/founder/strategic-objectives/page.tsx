import { StrategicObjectiveDashboard } from "@/components/cockpit/strategic-objective/StrategicObjectiveDashboard";

/** SCR E1-OBJECTIVES · E1-03 — Strategic Objective Engine */
export default function StrategicObjectivesPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-03 · Measurable WHAT</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Strategic Objectives</h1>
        <p className="text-sm text-[#8a847a]">
          Vision defines WHY · Strategic Objectives define WHAT must be achieved
        </p>
      </header>
      <StrategicObjectiveDashboard />
    </div>
  );
}
