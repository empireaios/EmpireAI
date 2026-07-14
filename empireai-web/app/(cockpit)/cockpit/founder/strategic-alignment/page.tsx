import { StrategicAlignmentDashboard } from "@/components/cockpit/strategic-alignment/StrategicAlignmentDashboard";

/** SCR E1-ALIGNMENT · E1-13 — Strategic Alignment Monitor */
export default function StrategicAlignmentPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-13 · NO STRATEGIC DRIFT</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Strategic Alignment</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous alignment validation · drift detection · corrective actions · vision synchronization
        </p>
      </header>
      <StrategicAlignmentDashboard />
    </div>
  );
}
