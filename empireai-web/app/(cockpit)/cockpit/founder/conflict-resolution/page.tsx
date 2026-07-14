import { ConflictResolutionEngineDashboard } from "@/components/cockpit/conflict-resolution/ConflictResolutionEngineDashboard";

/** SCR E2-CONFLICTS · E2-06 — Conflict Resolution Engine */
export default function ConflictResolutionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-06 · CONFLICT RESOLUTION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Conflict Resolution Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Detect · analyse · resolve · explainable · no hidden conflicts · constitutional governance
        </p>
      </header>
      <ConflictResolutionEngineDashboard />
    </div>
  );
}
