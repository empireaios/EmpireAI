import { ExecutivePlanningCertificationPanel } from "@/components/cockpit/executive-planning-certification/ExecutivePlanningCertificationPanel";

/** SCR E1-CERTIFIED · E1-15 — Executive Planning Programme Certification */
export default function ExecutivePlanningCertificationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-15 · PHASE E1 CERTIFICATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Planning Certified</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional certification of the complete E1 Executive Planning Programme · canonical completion record
        </p>
      </header>
      <ExecutivePlanningCertificationPanel />
    </div>
  );
}
