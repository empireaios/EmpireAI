import { ExecutivePerformanceDashboardPanel } from "@/components/cockpit/executive-performance/ExecutivePerformanceDashboardPanel";

/** SCR E3-PERFORMANCE · E3-13 — Executive Performance Dashboard */
export default function ExecutivePerformancePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-13 · EXECUTIVE PERFORMANCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Performance Dashboard</h1>
        <p className="text-sm text-[#8a847a]">
          Unified financial command center · all E3 capabilities · real-time executive interface
        </p>
      </header>
      <ExecutivePerformanceDashboardPanel />
    </div>
  );
}
