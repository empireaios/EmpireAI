import { ExecutiveConsensusEngineDashboard } from "@/components/cockpit/executive-consensus/ExecutiveConsensusEngineDashboard";

/** SCR E2-CONSENSUS · E2-11 — Executive Consensus Engine */
export default function ExecutiveConsensusPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-11 · EXECUTIVE CONSENSUS</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Consensus Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Multi-perspective reasoning · unified recommendations · transparent agreement and disagreement
        </p>
      </header>
      <ExecutiveConsensusEngineDashboard />
    </div>
  );
}
