import { ExecutiveKnowledgeGraphDashboard } from "@/components/cockpit/executive-knowledge-graph/ExecutiveKnowledgeGraphDashboard";

/** SCR E4-KNOWLEDGE · E4-08 — Executive Knowledge Graph */
export default function ExecutiveKnowledgeGraphPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-08 · EXECUTIVE KNOWLEDGE GRAPH</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Knowledge Graph</h1>
        <p className="text-sm text-[#8a847a]">
          Unified executive knowledge network · relationship discovery · cross-domain intelligence
        </p>
      </header>
      <ExecutiveKnowledgeGraphDashboard />
    </div>
  );
}
