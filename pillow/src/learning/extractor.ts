import { EXECUTIVE_PRINCIPLE_PATTERNS } from "./patterns.js";
import type {
  ConversationLearningInput,
  ExtractedLearningCandidate,
  LearningObservation,
  ReasoningArea,
} from "./types.js";

const STRONG_SIGNAL_PHRASES = [
  /\balways\b/i,
  /\bnever\b/i,
  /\bconsistently\b/i,
  /\bmust\b/i,
  /\bnon-negotiable\b/i,
  /\bprefer\b/i,
  /\bprioriti[sz]e\b/i,
];

export function extractLearningCandidates(
  input: ConversationLearningInput,
): ExtractedLearningCandidate[] {
  const corpus = [
    input.userMessage,
    input.assistantMessage,
    input.executiveReasoning.briefingAnchor,
    input.executiveReasoning.currentConversation,
  ].join("\n");

  const candidates: ExtractedLearningCandidate[] = [];
  const seen = new Set<string>();

  for (const pattern of EXECUTIVE_PRINCIPLE_PATTERNS) {
    const matched = pattern.keywords.some((rx) => rx.test(corpus));
    if (!matched || seen.has(pattern.id)) continue;
    seen.add(pattern.id);

    const evidence = collectEvidence(corpus, pattern.keywords);
    const observation: LearningObservation = {
      observation: pattern.template,
      evidence,
      reasoningArea: pattern.reasoningArea,
    };

    candidates.push({
      title: pattern.title,
      description: pattern.template,
      category: pattern.defaultCategory,
      reasoningAreas: [pattern.reasoningArea],
      observation,
      confidence: scoreExtractionConfidence(corpus, pattern.keywords, evidence),
      impactSummary: describeImpact(pattern.reasoningArea, pattern.defaultCategory),
      requiresGrandKingApproval: pattern.defaultCategory === "A",
    });
  }

  const preferenceCandidate = extractExplicitPreference(input.userMessage);
  if (preferenceCandidate && !seen.has(preferenceCandidate.title)) {
    candidates.push(preferenceCandidate);
  }

  return candidates;
}

function collectEvidence(corpus: string, keywords: RegExp[]): string[] {
  const lines = corpus.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const hits: string[] = [];
  for (const line of lines) {
    if (keywords.some((rx) => rx.test(line))) {
      hits.push(line.length > 280 ? `${line.slice(0, 277)}...` : line);
    }
    if (hits.length >= 3) break;
  }
  return hits.length > 0 ? hits : [corpus.slice(0, 200)];
}

function scoreExtractionConfidence(
  corpus: string,
  keywords: RegExp[],
  evidence: string[],
): number {
  let score = 0.55;
  const keywordHits = keywords.filter((rx) => rx.test(corpus)).length;
  score += Math.min(0.25, keywordHits * 0.08);
  score += Math.min(0.12, evidence.length * 0.04);
  if (STRONG_SIGNAL_PHRASES.some((rx) => rx.test(corpus))) score += 0.1;
  return Math.min(0.99, Math.round(score * 100) / 100);
}

function describeImpact(area: ReasoningArea, category: "A" | "B" | "C" | "D"): string {
  const areaLabel = area.replace(/_/g, " ");
  if (category === "A") {
    return `May permanently influence ${areaLabel} in executive reasoning if Grand King approves.`;
  }
  if (category === "D") {
    return `Ephemeral session context only — expires automatically.`;
  }
  return `Informs ${areaLabel} during strategic synthesis; promotion requires confirmation.`;
}

function extractExplicitPreference(userMessage: string): ExtractedLearningCandidate | null {
  const preferMatch = userMessage.match(
    /(?:i\s+(?:always|consistently)\s+)?prefer\s+(.{8,120})/i,
  );
  if (!preferMatch) return null;

  const preference = preferMatch[1]!.trim().replace(/\.$/, "");
  return {
    title: `Preference: ${preference.slice(0, 60)}`,
    description: `Grand King expressed preference: ${preference}`,
    category: "A",
    reasoningAreas: ["recurring_preferences"],
    observation: {
      observation: `Grand King prefers ${preference}.`,
      evidence: [userMessage.trim()],
      reasoningArea: "recurring_preferences",
    },
    confidence: 0.85,
    impactSummary: "May permanently influence recurring preference reasoning if Grand King approves.",
    requiresGrandKingApproval: true,
  };
}
