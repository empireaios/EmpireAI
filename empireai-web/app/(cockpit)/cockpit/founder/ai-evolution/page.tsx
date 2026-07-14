import { AiEvolutionDashboard } from "@/components/cockpit/ai-evolution/AiEvolutionDashboard";

/** SCR P9-AI-EVOLUTION · P9-04 — Continuous AI Evolution Architecture */
export default function AiEvolutionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Evolution · P9-04</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">AI Evolution</h1>
        <p className="text-sm text-[#8a847a]">
          Intelligence never static · explainable · constitutionally governed
        </p>
      </header>
      <AiEvolutionDashboard />
    </div>
  );
}
