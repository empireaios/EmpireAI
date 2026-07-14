import { AutonomousDecisionMonitorDashboard } from "@/components/cockpit/autonomous-decision-monitor/AutonomousDecisionMonitorDashboard";

/** SCR E2-MONITOR · E2-15 — Autonomous Decision Monitor */
export default function AutonomousDecisionMonitorPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-15 · AUTONOMOUS DECISION MONITOR</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Autonomous Decision Monitor</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous post-decision monitoring · deviation detection · autonomous corrective actions
        </p>
      </header>
      <AutonomousDecisionMonitorDashboard />
    </div>
  );
}
