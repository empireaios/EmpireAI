"use client";

import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import { INTELLIGENCE_RESEARCH_NOTES } from "@/components/cockpit/widgets/intelligence/intelligenceDemoData";

/** SCR-102 research workspace extension (REAL-101). */
export function IntelligenceResearchPanel() {
  return (
    <Panel title="Research Workspace" subtitle="Discovery session notes and synthesis — demo">
      <ul className="space-y-3 text-sm text-[#c8c0b0]">
        {INTELLIGENCE_RESEARCH_NOTES.map((note) => (
          <li key={note} className="rounded-lg border border-gold/10 px-4 py-3">
            {note}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
