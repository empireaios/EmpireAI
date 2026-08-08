import { retrievalPriorityRank, sortByRetrievalPriority } from "./governance.js";
import type {
  ExecutiveKnowledgeEntry,
  ExecutiveLearningReasoningBundle,
  PendingExecutiveLearning,
} from "./types.js";

export function buildExecutiveLearningReasoningBundle(input: {
  currentObjective: string | null;
  executiveConstitutionSummary: string;
  approvedKnowledge: ExecutiveKnowledgeEntry[];
  pendingSessionContext: PendingExecutiveLearning[];
  executivePerspectives?: string[];
}): ExecutiveLearningReasoningBundle {
  const approvedExecutiveKnowledge = sortByRetrievalPriority(
    input.approvedKnowledge.filter(
      (item) => item.category === "A" && item.status === "approved",
    ),
  );
  const projectWorkingKnowledge = sortByRetrievalPriority(
    input.approvedKnowledge.filter(
      (item) => (item.category === "B" || item.category === "C") && item.status === "approved",
    ),
  );

  return {
    currentObjective: input.currentObjective,
    executiveConstitutionSummary: input.executiveConstitutionSummary,
    approvedExecutiveKnowledge,
    projectWorkingKnowledge,
    sessionContext: input.pendingSessionContext.filter(
      (item) => item.category === "D" && item.status === "session_active",
    ),
    executivePerspectives: input.executivePerspectives ?? [],
    loadedAt: new Date().toISOString(),
  };
}

export function formatExecutiveLearningForLlm(
  bundle: ExecutiveLearningReasoningBundle,
): string {
  const sections: string[] = [
    "=== EXECUTIVE LEARNING CONTEXT (NOT chat memory) ===",
    "",
    "[Current Objective]",
    bundle.currentObjective ?? "No active objective registered",
    "",
    "[Executive Constitution]",
    bundle.executiveConstitutionSummary,
  ];

  if (bundle.approvedExecutiveKnowledge.length > 0) {
    sections.push(
      "",
      "[Approved Executive Principles — permanent reasoning only]",
      ...bundle.approvedExecutiveKnowledge.map((item) => formatKnowledgeLine(item)),
    );
  }

  if (bundle.projectWorkingKnowledge.length > 0) {
    sections.push(
      "",
      "[Project Working Knowledge — may change over time]",
      ...bundle.projectWorkingKnowledge.map((item) => formatKnowledgeLine(item)),
    );
  }

  if (bundle.sessionContext.length > 0) {
    sections.push(
      "",
      "[Session Context — ephemeral, auto-expires]",
      ...bundle.sessionContext.map((item) => `- ${item.title}: ${item.description}`),
    );
  }

  if (bundle.executivePerspectives.length > 0) {
    sections.push(
      "",
      "[Executive Perspectives]",
      ...bundle.executivePerspectives.map((line) => `- ${line}`),
    );
  }

  sections.push(
    "",
    "CONSTITUTIONAL OVERRIDE: Executive Constitution always outranks learned knowledge.",
    "Only APPROVED Executive Knowledge influences long-term reasoning. Never treat conversation history as permanent memory.",
    "Never hallucinate prior Grand King approvals. Category D session context is experimental and expires.",
    "Treat OWNER_DIRECTIVE and external FACT as higher authority than HYPOTHESIS or ESTIMATE.",
    "When institutional experience applies, cite it explicitly (e.g. prior Amazon ACCEPTED≠BUYABLE failure).",
  );

  return sections.join("\n");
}

function formatKnowledgeLine(item: ExecutiveKnowledgeEntry): string {
  const authority = item.authority ? ` authority=${item.authority}` : "";
  const epistemic = item.epistemicStatus ? ` epistemic=${item.epistemicStatus}` : "";
  const tags = item.tags?.length ? ` tags=${item.tags.join(",")}` : "";
  return `- ${item.title}: ${item.description} [${item.category}${authority}${epistemic}${tags}]`;
}

/** Bounded relevance retrieval for a task — do not dump the entire EKB. */
export function selectRelevantInstitutionalKnowledge(
  knowledge: ExecutiveKnowledgeEntry[],
  query: {
    tags?: string[];
    keywords?: string[];
    memoryClasses?: string[];
    limit?: number;
  },
): ExecutiveKnowledgeEntry[] {
  const tags = (query.tags ?? []).map((t) => t.toLowerCase());
  const keywords = (query.keywords ?? []).map((k) => k.toLowerCase());
  const classes = (query.memoryClasses ?? []).map((c) => c.toLowerCase());
  const limit = query.limit ?? 12;

  const scored = knowledge
    .filter((item) => item.status === "approved")
    .map((item) => {
      let score = 0;
      const hay = `${item.title} ${item.description} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      for (const tag of tags) {
        if ((item.tags ?? []).some((t) => t.toLowerCase() === tag) || hay.includes(tag)) score += 3;
      }
      for (const kw of keywords) {
        if (hay.includes(kw)) score += 2;
      }
      if (classes.length && item.memoryClass && classes.includes(item.memoryClass.toLowerCase())) {
        score += 2;
      }
      if (item.category === "A") score += 1;
      if (item.authority === "grand_king_directive") score += 2;
      if (item.epistemicStatus === "OWNER_DIRECTIVE" || item.epistemicStatus === "FACT") score += 1;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || retrievalPriorityRank(a.item) - retrievalPriorityRank(b.item));

  return scored.slice(0, limit).map((row) => row.item);
}
