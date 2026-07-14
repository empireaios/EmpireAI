import { ExecutiveTransparencyEngineDashboard } from "@/components/cockpit/executive-transparency-engine/ExecutiveTransparencyEngineDashboard";

/** SCR E5-TRANSPARENCY · E5-07 — Executive Transparency Engine */
export default function ExecutiveTransparencyPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-07 · EXECUTIVE TRANSPARENCY ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Transparency Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Complete executive visibility — governance reporting with constitutional security
        </p>
      </header>
      <ExecutiveTransparencyEngineDashboard />
    </div>
  );
}
