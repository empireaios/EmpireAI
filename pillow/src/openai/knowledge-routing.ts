import type { ContextTask } from "../context/types.js";

/** How Pillow should source an answer for a given question. */
export type KnowledgeSource = "repository" | "general" | "live";

export interface KnowledgeRoutingAssessment {
  primarySource: KnowledgeSource;
  repositoryApplicable: boolean;
  requiresLiveInformation: boolean;
  isRepositorySpecificQuestion: boolean;
}

const REPOSITORY_QUESTION_PATTERNS = [
  /where is .+ implement/i,
  /who owns .+ module/i,
  /which file renders/i,
  /what depends on/i,
  /what happens if .+ change/i,
  /how does .+ (flow|runtime|deploy|startup|request)/i,
  /which mission introduced/i,
  /repository intelligence/i,
  /codebase architecture/i,
  /system boundary/i,
  /where is|who owns|depends on|what happens if|how does|which file renders|which mission/i,
];

const LIVE_INFORMATION_PATTERNS = [
  /\b(right now|as of today|today'?s|currently|live|real[- ]time|realtime)\b/i,
  /\b(current price|stock price|weather now|latest news|breaking news)\b/i,
  /\bwhat is .+ trading at\b/i,
  /\bwho is winning (right now|today|currently)\b/i,
  /\bscore (right now|today|currently)\b/i,
  /\b(latest meta ads|meta ads policy|facebook ads policy)\b/i,
  /\b(current football|football results|match score|live score)\b/i,
  /\b(exchange rate|forex rate|currency rate)\b/i,
  /\b(latest openai|openai announcement|openai release)\b/i,
  /\b(amazon marketplace rules|amazon seller policy)\b/i,
  /\b(stripe documentation|stripe api changes|current stripe)\b/i,
];

/** Historical questions must not trigger live-information routing. */
const HISTORICAL_EXCLUSION_PATTERNS = [
  /\bwho won the (19|20)\d{2}/i,
  /\bworld cup (19|20)\d{2}\b/i,
  /\b(in|during|at) (19|20)\d{2}\b/,
];

const REPOSITORY_CONTEXT_TASKS = new Set<ContextTask>([
  "repository_intelligence",
  "architecture",
  "generate_cursor_mission",
  "review_executive_audit",
  "technical_chief",
  "recovery",
  "cursor_bridge",
  "infrastructure",
]);

export function isRepositorySpecificQuestion(
  userMessage: string,
  task: ContextTask,
): boolean {
  if (REPOSITORY_CONTEXT_TASKS.has(task)) return true;
  const text = userMessage.trim();
  return REPOSITORY_QUESTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function isHistoricalKnowledgeQuestion(userMessage: string): boolean {
  return HISTORICAL_EXCLUSION_PATTERNS.some((pattern) => pattern.test(userMessage));
}

export function requiresLiveInformation(userMessage: string): boolean {
  if (isHistoricalKnowledgeQuestion(userMessage)) return false;
  return LIVE_INFORMATION_PATTERNS.some((pattern) => pattern.test(userMessage));
}

export function assessKnowledgeRouting(
  userMessage: string,
  options: {
    hasRepositoryAnswer: boolean;
    contextTask: ContextTask;
  },
): KnowledgeRoutingAssessment {
  const repositoryApplicable = isRepositorySpecificQuestion(
    userMessage,
    options.contextTask,
  );
  const live = requiresLiveInformation(userMessage);

  let primarySource: KnowledgeSource = "general";
  if (live) {
    primarySource = "live";
  } else if (repositoryApplicable && options.hasRepositoryAnswer) {
    primarySource = "repository";
  } else if (repositoryApplicable && !options.hasRepositoryAnswer) {
    primarySource = "repository";
  }

  return {
    primarySource,
    repositoryApplicable,
    requiresLiveInformation: live,
    isRepositorySpecificQuestion: repositoryApplicable,
  };
}

/** Natural executive dialogue — keeps repository discipline without template labels. */
export function buildExecutiveConversationKnowledgeSection(
  assessment: KnowledgeRoutingAssessment,
  hasRepositoryContext: boolean,
  userMessage?: string,
): string {
  const lines = [
    "## Executive Conversation",
    "",
    "Speak naturally as a professional executive AI assistant to the Grand King.",
    "- Answer the exact question first; match depth to what was asked.",
    "- Maintain continuity with prior turns in this session when present.",
    "- For follow-ups (e.g. tell me more, why, simplify, continue), answer in context of the immediately preceding exchange.",
    "- For ambiguous requests (e.g. fix it, do it, explain), ask one concise clarifying question — do not web-search or dump blocker lists.",
    "- Do not prefix answers with [Repository Fact], [General Knowledge], or other template labels.",
    "- Avoid repetitive certification blockers or executive alerts unless directly relevant.",
    "- When recommending actions, explain why briefly and note risks or alternatives when useful.",
    "",
    "Knowledge discipline:",
    "- Use repository context when it directly answers the question; never invent repository facts.",
    "- Answer general-knowledge questions helpfully when the repository has no answer.",
    "- If live or real-time data is required and unavailable, say so plainly without a label prefix.",
    "",
    "EmpireAI state discipline (mandatory when Live Operational Truth is present):",
    "- Distinguish CURRENT_VERIFIED vs HISTORICAL vs ESTIMATED vs MODEL_INFERENCE vs UNKNOWN.",
    "- CURRENT_VERIFIED live state outranks stale mission docs (including old P0-1/B5 language).",
    "- Product ASIN and title are bound entities — never rename an ASIN.",
    "- Never invent sales, orders, revenue, demand trends, ratings, or competitor analyses.",
    "- If realised orders/revenue are zero, commercial history is UNKNOWN.",
    "- Do not claim executable deploy/publish/spend/Birth authority unless Live Operational Truth says so.",
    "- Unsupported factual claims about EmpireAI state are UNKNOWN/INFERENCE — never KNOW/Evidenced.",
  ];

  if (assessment.requiresLiveInformation) {
    lines.push(
      "",
      "This question explicitly requests current public information. Answer from available tools if present; otherwise state plainly that live data is unavailable — without a label prefix.",
    );
  } else if (userMessage && isHistoricalKnowledgeQuestion(userMessage)) {
    lines.push("", "Historical question — answer directly without live-information disclaimers.");
  } else if (assessment.isRepositorySpecificQuestion && !hasRepositoryContext) {
    lines.push(
      "",
      "Repository-specific question: search context below. If absent, say the repository does not contain it — do not fabricate.",
    );
  }

  return lines.join("\n");
}

export function buildKnowledgeRoutingPromptSection(
  assessment: KnowledgeRoutingAssessment,
  hasRepositoryContext: boolean,
  userMessage?: string,
): string {
  const lines = [
    "## Knowledge Routing (constitutional)",
    "",
    "Repository knowledge is the PRIMARY source — not the EXCLUSIVE source.",
    "",
    "Source rules:",
    "1. [Repository Fact] — Use when the answer exists in repository context below.",
    "   Never invent repository facts. Never claim repository knowledge that does not exist.",
    "2. [General Knowledge] — Use when the repository does not contain the answer.",
    "   Do NOT reject general-knowledge questions simply because they are absent from the repository.",
    "3. [Live Information Unavailable] — Use when the question requires live or real-time data you cannot know.",
    "   Clearly state that live information is unavailable; do not guess current values.",
    "",
    "Answer format:",
    "- Begin each answer with exactly one label: [Repository Fact], [General Knowledge], or [Live Information Unavailable].",
    "- Repository-specific questions: use repository context ONLY. If missing, say so — never fabricate.",
    "- General questions: answer helpfully from general knowledge when the repository has no answer.",
  ];

  if (assessment.requiresLiveInformation) {
    lines.push(
      "",
      "Routing hint: This question requires current public information.",
      "Invoke Web Search when available. Produce a [Web Search Report] with citations.",
      "Only use [Live Information Unavailable] if Web Search is genuinely unavailable.",
    );
  } else if (userMessage && isHistoricalKnowledgeQuestion(userMessage)) {
    lines.push(
      "",
      "Routing hint: Historical question — answer directly with [General Knowledge].",
      "Do NOT add unnecessary real-time or live-information disclaimers.",
    );
  } else if (assessment.isRepositorySpecificQuestion && !hasRepositoryContext) {
    lines.push(
      "",
      "Routing hint: This is a repository-specific question but no deterministic repository answer was found.",
      "Search repository context slices below. If still absent, state that the repository does not contain this information — do not fabricate.",
    );
  } else if (assessment.isRepositorySpecificQuestion && hasRepositoryContext) {
    lines.push(
      "",
      "Routing hint: Repository intelligence matched this question. Prefer [Repository Fact] from repository context.",
    );
  } else if (!assessment.isRepositorySpecificQuestion) {
    lines.push(
      "",
      "Routing hint: This appears to be a general-knowledge question. Answer with [General Knowledge] unless repository context below directly answers it.",
    );
  }

  return lines.join("\n");
}
