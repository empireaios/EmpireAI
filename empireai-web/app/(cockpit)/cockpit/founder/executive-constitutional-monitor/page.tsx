import { ExecutiveConstitutionalMonitorDashboard } from "@/components/cockpit/executive-constitutional-monitor/ExecutiveConstitutionalMonitorDashboard";

/** SCR E5-CONSTITUTIONAL · E5-02 — Executive Constitutional Monitor */
export default function ExecutiveConstitutionalMonitorPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-02 · EXECUTIVE CONSTITUTIONAL MONITOR</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Constitutional Monitor</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous constitutional validation — every executive action validated against the Empire Constitution
        </p>
      </header>
      <ExecutiveConstitutionalMonitorDashboard />
    </div>
  );
}
