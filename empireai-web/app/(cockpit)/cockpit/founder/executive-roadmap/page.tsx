import { ExecutiveRoadmapDashboard } from "@/components/cockpit/executive-roadmap/ExecutiveRoadmapDashboard";

/** SCR E1-ROADMAP · E1-04 — Executive Roadmap Engine */
export default function ExecutiveRoadmapPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-04 · WHEN & ORDER</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Roadmap</h1>
        <p className="text-sm text-[#8a847a]">
          Vision defines WHY · Objectives define WHAT · Roadmap defines WHEN and IN WHAT ORDER
        </p>
      </header>
      <ExecutiveRoadmapDashboard />
    </div>
  );
}
