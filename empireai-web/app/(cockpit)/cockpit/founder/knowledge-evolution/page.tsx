import { KnowledgeEvolutionDashboard } from "@/components/cockpit/knowledge-evolution/KnowledgeEvolutionDashboard";

/** SCR P9-KNOWLEDGE · P9-02 — Continuous Knowledge Evolution Architecture */
export default function KnowledgeEvolutionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Evolution · P9-02</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Knowledge Evolution</h1>
        <p className="text-sm text-[#8a847a]">
          Every mission strengthens the Empire · evidence-based · no knowledge loss
        </p>
      </header>
      <KnowledgeEvolutionDashboard />
    </div>
  );
}
