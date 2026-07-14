import { ExecutiveEscalationEngineDashboard } from "@/components/cockpit/executive-escalation/ExecutiveEscalationEngineDashboard";

/** SCR E2-ESCALATIONS · E2-09 — Executive Escalation Engine */
export default function ExecutiveEscalationsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-09 · EXECUTIVE ESCALATIONS</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Escalation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Intelligent authority routing · least necessary escalation · constitutional executive oversight
        </p>
      </header>
      <ExecutiveEscalationEngineDashboard />
    </div>
  );
}
