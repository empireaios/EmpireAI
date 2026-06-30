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
  const approvedExecutiveKnowledge = input.approvedKnowledge.filter(
    (item) => item.category === "A" && item.status === "approved",
  );
  const projectWorkingKnowledge = input.approvedKnowledge.filter(
    (item) => (item.category === "B" || item.category === "C") && item.status === "approved",
  );

  return {
    currentObjective: input.currentObjective,
    executiveConstitutionSummary: input.executiveConstitutionSummary,
    approvedExecutiveKnowledge,
    projectWorkingKnowledge,
    sessionContext: input.pendingSessionContext.filter((item) => item.category === "D"),
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
      ...bundle.approvedExecutiveKnowledge.map(
        (item) => `- ${item.title}: ${item.description}`,
      ),
    );
  }

  if (bundle.projectWorkingKnowledge.length > 0) {
    sections.push(
      "",
      "[Project Working Knowledge — may change over time]",
      ...bundle.projectWorkingKnowledge.map(
        (item) => `- ${item.title}: ${item.description}`,
      ),
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
    "Only APPROVED Executive Knowledge influences long-term reasoning. Never treat conversation history as permanent memory.",
  );

  return sections.join("\n");
}
