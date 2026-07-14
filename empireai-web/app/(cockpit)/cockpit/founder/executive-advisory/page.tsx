import { ExecutiveAdvisoryEngineDashboard } from "@/components/cockpit/executive-advisory-engine/ExecutiveAdvisoryEngineDashboard";

/** SCR E4-ADVISORY · E4-14 — Executive Advisory Engine */
export default function ExecutiveAdvisoryPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-14 · EXECUTIVE ADVISORY ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Advisory Engine</h1>
        <p className="text-sm text-[#8a847a]">
          AI Executive Advisor · board-level recommendations · immediate actions · strategic guidance · proactive enterprise advisory
        </p>
      </header>
      <ExecutiveAdvisoryEngineDashboard />
    </div>
  );
}
