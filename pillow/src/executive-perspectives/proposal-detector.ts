/** Detect when Pillow should run internal Executive Perspectives debate. */
export function shouldRunExecutivePerspectives(userMessage: string): boolean {
  const text = userMessage.trim();
  if (text.length < 12) return false;

  const triggers = [
    /\bshould\s+we\b/i,
    /\brecommend\b/i,
    /\bpropose\b/i,
    /\bdecide\b/i,
    /\bapprove\b/i,
    /\bimplement\b/i,
    /\bprioriti[sz]e\b/i,
    /\bstrategy\b/i,
    /\bmission\b/i,
    /\bnext\s+step\b/i,
    /\bwhat\s+do\s+you\s+think\b/i,
    /\bgo\s+live\b/i,
    /\blaunch\b/i,
    /\bbuild\b/i,
    /\brefactor\b/i,
    /\binvest\b/i,
  ];

  return triggers.some((pattern) => pattern.test(text));
}

export function summarizeProposalTopic(userMessage: string): string {
  const trimmed = userMessage.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117)}...`;
}

export function inferSubjectType(
  userMessage: string,
): "general" | "engineering" | "commercial" | "repository" | "strategy" {
  const text = userMessage.toLowerCase();
  if (/journey|repository|adr|documentation|sync|governance/.test(text)) return "repository";
  if (/architecture|refactor|code|engineering|technical|cursor|pillow|backend|frontend/.test(text)) {
    return "engineering";
  }
  if (/marketplace|supplier|revenue|profit|pricing|commercial|customer|launch|product/.test(text)) {
    return "commercial";
  }
  if (/strategy|roadmap|objective|milestone|long-term|sequenc/.test(text)) return "strategy";
  return "general";
}
