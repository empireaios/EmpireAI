import { ExecutiveEthicsEngineDashboard } from "@/components/cockpit/executive-ethics-engine/ExecutiveEthicsEngineDashboard";

/** SCR E5-ETHICS · E5-05 — Executive Ethics Engine */
export default function ExecutiveEthicsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-05 · EXECUTIVE ETHICS ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Ethics Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous ethical evaluation — responsible executive guidance aligned with constitutional values
        </p>
      </header>
      <ExecutiveEthicsEngineDashboard />
    </div>
  );
}
