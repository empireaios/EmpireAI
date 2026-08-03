/** Executive Learning governance classification helpers (certification surface). */

import type {
  ExecutiveKnowledgeEntry,
  ExecutiveLearningCategory,
  ExecutiveLearningStatus,
  LearningGovernanceClass,
  PendingExecutiveLearning,
} from "./types.js";

/** Map Category A–D to canonical governance labels. */
export function governanceClassForCategory(
  category: ExecutiveLearningCategory,
): LearningGovernanceClass {
  switch (category) {
    case "A":
      return "Permanent";
    case "B":
      return "Strategic";
    case "C":
      return "Temporary";
    case "D":
      return "Experimental";
    default:
      return "Experimental";
  }
}

/** Resolve governance class from pending/approved record + status. */
export function resolveLearningGovernanceClass(input: {
  category: ExecutiveLearningCategory;
  status: ExecutiveLearningStatus | ExecutiveKnowledgeEntry["status"];
  requiresGrandKingApproval?: boolean;
}): LearningGovernanceClass {
  if (input.status === "rejected") return "Rejected";
  if (input.status === "archived" || input.status === "superseded") return "Historical";
  if (input.status === "approved") {
    if (input.category === "A") return "Owner-approved";
    if (input.category === "B") return "Strategic";
    return "Temporary";
  }
  if (input.status === "expired" || input.status === "session_active") return "Experimental";
  return governanceClassForCategory(input.category);
}

/** Constitutional / permanent knowledge always outranks learned working knowledge. */
export function retrievalPriorityRank(entry: {
  category: ExecutiveLearningCategory;
  status?: string;
}): number {
  // Lower number = higher priority in retrieval.
  if (entry.category === "A") return 1;
  if (entry.category === "B") return 2;
  if (entry.category === "C") return 3;
  return 4;
}

export function sortByRetrievalPriority<T extends { category: ExecutiveLearningCategory }>(
  entries: T[],
): T[] {
  return [...entries].sort(
    (a, b) => retrievalPriorityRank(a) - retrievalPriorityRank(b),
  );
}

export function assertCannotBypassConstitution(pending: PendingExecutiveLearning): void {
  const text = `${pending.title} ${pending.description} ${pending.observation}`.toLowerCase();
  const malicious =
    /bypass constitution|ignore digital soul|override grand king|disable constitutional|skip approval/.test(
      text,
    );
  if (malicious) {
    throw new Error(
      "Learning rejected: content attempts constitutional / Digital Soul bypass",
    );
  }
}
