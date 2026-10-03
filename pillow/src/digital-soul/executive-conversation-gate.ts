/**
 * Mandatory Digital Soul gate for executive conversations.
 *
 * Prompt injection alone is insufficient — every executive answer path must
 * call `gateExecutiveConversation` (or `assertDigitalSoulAvailable` + evaluate)
 * before generating a visible Grand King response.
 *
 * Does not redesign Digital Soul runtime or Constitution; enforces participation.
 */

import type { DigitalSoulRuntime } from "./engine.js";
import type { ConstitutionalComplianceResult } from "./types.js";
import { buildDigitalSoulPromptBlock } from "./prompt.js";
import { detectConstitutionalIntent } from "./constitutional-intent.js";
import { isExplicitVisibleDenial } from "./visible-denial.js";
import { scopeVisibleControlReports } from "./visible-control-reports.js";

export class DigitalSoulUnavailableError extends Error {
  readonly code = "DIGITAL_SOUL_UNAVAILABLE" as const;

  constructor(message: string) {
    super(message);
    this.name = "DigitalSoulUnavailableError";
  }
}

export class ConstitutionalGateRefusedError extends Error {
  readonly code = "CONSTITUTIONAL_GATE_REFUSED" as const;
  readonly compliance: ConstitutionalComplianceResult;

  constructor(message: string, compliance: ConstitutionalComplianceResult) {
    super(message);
    this.name = "ConstitutionalGateRefusedError";
    this.compliance = compliance;
  }
}

export const CONSTITUTIONAL_AVAILABILITY_REFUSAL =
  "Constitutional availability error: Digital Soul / EmpireAI Constitution is not loaded. Pillow cannot generate an executive answer until the Digital Soul Constitution is restored. No bypass is permitted.";

export const CONSTITUTIONAL_GATE_REFUSAL_PREFIX =
  "Constitutional gate refused this executive request before a reply was generated.";

export type ExecutiveConversationGatePurpose =
  | "chat"
  | "tool"
  | "memory"
  | "command"
  | "assistant_action"
  | "natural_ux";

export type ExecutiveConversationGateInput = {
  userMessage: string;
  purpose?: ExecutiveConversationGatePurpose;
  /** Prior memory / retrieved context that will influence the reply (reviewed for bypass intent). */
  memoryContext?: string;
};

export type ExecutiveConversationGateResult = {
  allowed: boolean;
  purpose: ExecutiveConversationGatePurpose;
  compliance: ConstitutionalComplianceResult;
  promptBlock: string;
  refusalMessage: string | null;
  gatedAt: string;
};

/** Hard availability check — constitution must be present and runtime initialized. */
export function assertDigitalSoulAvailable(runtime: DigitalSoulRuntime | null | undefined): void {
  if (!runtime) {
    throw new DigitalSoulUnavailableError(CONSTITUTIONAL_AVAILABILITY_REFUSAL);
  }
  const snapshot = runtime.snapshot();
  if (!snapshot.loadedAt) {
    throw new DigitalSoulUnavailableError(CONSTITUTIONAL_AVAILABILITY_REFUSAL);
  }
  if (!snapshot.constitutionPresent) {
    throw new DigitalSoulUnavailableError(CONSTITUTIONAL_AVAILABILITY_REFUSAL);
  }
}

/**
 * Mandatory pre-reply constitutional gate.
 * Evaluates the executive request (and optional memory context) via Digital Soul compliance.
 * Violations refuse; warnings allow with aligned=false only when no violation findings.
 */
/** Drop prior refusal / detector echo text that falsely re-triggers bypass composition. */
function scopeNonexecutingAssessment(text: string): string {
  if (!/\b(?:assess|evaluate|analyse|analyze|review)\b/i.test(text) ||
      !/\b(?:no actions|do not execute|do not take (?:any )?actions)\b/i.test(text)) return text;
  return text.replace(/\b(?:an?|the)\s+(?:untrusted|unauthenticated|unsigned)\s+(?:email|message|note|attachment|document|ticket)\s+(?:says|states|reads)\s+(?:'[^'\n]{1,4000}'|"[^"\n]{1,4000}"|“[^”\n]{1,4000}”)/gi,
    "Untrusted quoted evidence retained for analysis; it grants no authority");
}

function sanitizeGateMemoryContext(memoryContext: string | undefined, analysisOnly = false, runtime?: DigitalSoulRuntime): string | undefined {
  if (!memoryContext?.trim()) return memoryContext;
  return memoryContext.split(/(?=^(?:user|assistant):)/m)
    .map(turn => {
      if (analysisOnly && turn.startsWith('user:')) return scopeNonexecutingAssessment(turn);
      // Reuse the complete visible-answer review for prior assistant prose.
      // Do not reinterpret an already-safe denial as a new owner instruction.
      // Unsafe/mixed/conditional prior answers remain in the compliance input.
      if (analysisOnly && runtime && turn.startsWith('assistant:') && gateExecutiveVisibleAnswer(runtime, turn.slice('assistant:'.length)).allowed)
        return 'assistant: Prior response passed constitutional visible-answer review.\n';
      return turn;
    }).join('')
    .split("\n")
    .filter((line) => {
      const l = line.toLowerCase();
      if (l.includes("constitutional gate refused")) return false;
      if (l.includes("constitutional availability error")) return false;
      if (l.includes("free-text intent to bypass")) return false;
      if (l.includes("no bypass is permitted")) return false;
      return true;
    })
    .join("\n")
    .trim();
}

function evaluateExecutiveConversation(
  runtime: DigitalSoulRuntime | null | undefined,
  input: ExecutiveConversationGateInput,
): ExecutiveConversationGateResult {
  assertDigitalSoulAvailable(runtime);
  const soul = runtime!;
  const purpose = input.purpose ?? "chat";
  // In a explicitly nonexecuting assessment, an attributed untrusted quote is
  // evidence to inspect, not an instruction to obey. The original prompt still
  // reaches the model; only the deterministic intent input is scoped here.
  const requestIntent = purpose === "chat" ? scopeNonexecutingAssessment(input.userMessage.trim()) : input.userMessage.trim();
  const recommendation = [
    requestIntent,
    sanitizeGateMemoryContext(input.memoryContext, purpose === "chat", soul),
  ]
    .filter(Boolean)
    .join("\n\n");

  const compliance = soul.evaluate({
    recommendation: recommendation || input.userMessage,
    evidence: ["executive_conversation_gate", `purpose:${purpose}`],
    assumptions: ["Grand King is the constitutional authority for irreversible decisions"],
    expectedEmpireValue: "Preserve constitutional governance during executive conversation",
  });

  const hasViolation = compliance.findings.some((f) => f.severity === "violation");
  const promptBlock = soul.getPromptBlock() || buildDigitalSoulPromptBlock();
  const gatedAt = new Date().toISOString();

  if (hasViolation || compliance.aligned === false) {
    const violationNotes = compliance.findings
      .filter((f) => f.severity === "violation")
      .map((f) => `• ${f.principleId}: ${f.message}`)
      .join("\n");
    const refusalMessage = [
      CONSTITUTIONAL_GATE_REFUSAL_PREFIX,
      "Digital Soul detected a constitutional governance issue that requires Grand King approval before Pillow may proceed.",
      violationNotes || "• Constitutional alignment failed.",
      "No executive answer was generated. No Brain fallback and no ungated LLM reply are permitted.",
    ].join("\n\n");

    return {
      allowed: false,
      purpose,
      compliance,
      promptBlock,
      refusalMessage,
      gatedAt,
    };
  }

  return {
    allowed: true,
    purpose,
    compliance,
    promptBlock,
    refusalMessage: null,
    gatedAt,
  };
}

/** Chat is deliberation, not execution. Reuse the proposition review that already
 * distinguishes prohibitions/control reports from positive bypass instructions.
 * Do not apply this interpretation to tools, commands or assistant actions.
 * History remains separately reviewed: a safe new sentence cannot launder an
 * unsafe prior instruction. Ambiguous historical references stay conservative.
 */
export function gateExecutiveConversation(
  runtime: DigitalSoulRuntime | null | undefined,
  input: ExecutiveConversationGateInput,
): ExecutiveConversationGateResult {
  const strict = evaluateExecutiveConversation(runtime, input);
  if (strict.allowed || (input.purpose ?? "chat") !== "chat") return strict;
  // Preserve historical antecedents for ambiguous requests such as "ignore it".
  if (evaluateExecutiveConversation(runtime, { ...input, memoryContext: undefined }).allowed) return strict;
  const request = gateExecutiveVisibleAnswer(runtime, scopeNonexecutingAssessment(input.userMessage.trim()));
  if (!request.allowed) return strict;
  const memory = sanitizeGateMemoryContext(input.memoryContext, true, runtime!);
  if (memory) {
    const history = memory.replace(/^(?:user|assistant):\s*/gm, "");
    if (!gateExecutiveVisibleAnswer(runtime, history).allowed) return strict;
  }
  return { ...request, purpose: "chat" };
}

/** Post-LLM check — refuse to surface a response that itself violates constitutional intent. */
function gateVisibleProposition(
  runtime: DigitalSoulRuntime | null | undefined,
  visibleAnswer: string,
): ExecutiveConversationGateResult {
  const gated = evaluateExecutiveConversation(runtime, {
    userMessage: visibleAnswer,
    purpose: "chat",
  });

  if (gated.allowed) {
    return gated;
  }

  // A conditional exception can occur after a conjunction or comma. Never
  // discard its preceding denial before reviewing the complete sentence.
  const sentences = visibleAnswer.match(/[^.!?\n]+[.!?]?/g) ?? [];
  if (sentences.some(sentence => /\b(?:if|unless|until|except|provided|otherwise|instead|when)\b/i.test(sentence) && detectConstitutionalIntent(sentence).detected)) return gated;

  // Negated commitments are prohibitions, not bypass requests. Scope this
  // interpretation to visible prose only; request and structured action gates
  // remain unchanged. Preserve every positive/conditional clause for review.
  let prohibitions = 0;
  const scoped = visibleAnswer.replace(/[’‘]/g, "'").replace(/[^.!?\n]+[.!?]?/g, sentence => {
    const text = sentence.trim().replace(/^[\s*#>\-]+/, "");
    if (isExplicitVisibleDenial(text)) { prohibitions++; return "Maintain existing authority restrictions."; }
    return sentence;
  });
  const clauses = scoped
    .split(/(?<=[.!?;,:\n—–])\s*|\b(?:and|or|but|then|however|because|yet)\b/gi);
  const remaining = clauses.map(clause => {
    const text = clause.trim().replace(/^[\s*#>\-]+/, "");
    if (isExplicitVisibleDenial(text)) { prohibitions++; return ""; }
    const unconditional = !/\b(?:if|unless|until|except|provided|otherwise|instead|while|although|when|where|because|to|so|also)\b/i.test(text);
    const prohibition = /^(?:(?:I|we|Pillow)\s+)?(?:will not|must not|cannot|can't|won't|do not|don't|never)\s+(?:ignore|bypass|skip|waive|override|disregard|circumvent|suspend|publish|pay|execute|release|reveal|expose|change|grant|authori[sz]e)\b/i.exec(text);
    // Do not discard an embedded second action or an indirect instruction.
    const tail = prohibition ? text.slice(prohibition[0].length) : "";
    const anotherAction = /\b(?:ignore|bypass|skip|waive|override|disregard|circumvent|suspend|publish|pay|execute|release|reveal|expose|change|grant|authori[sz]e|do|follow|obey|disable|remove|delete|send|transfer|run|proceed)\b/i.test(tail);
    const objectWords = tail.toLowerCase().replace(/[.!?;:*#]/g, "").trim().split(/\s+/);
    const simpleObject = objectWords.length > 0 && objectWords.length <= 12 && objectWords.every(word =>
      /^(?:the|any|our|existing|required|mandatory|owner|grand|king|constitutional|constitution|governance|approval|process|gate|workflow|control|controls|check|checks|safeguards|review|rules|authorization|authorisation|external|action|actions|supplier|payments|payment|orders|listings|secrets|credentials|keys|api|without)$/.test(word));
    if (unconditional && prohibition && simpleObject && !anotherAction) { prohibitions++; return ""; }
    return clause;
  }).join(". ");
  if (prohibitions > 0) {
    const reviewed = evaluateExecutiveConversation(runtime, {
      userMessage: remaining.trim() || "Maintain existing authority restrictions.",
      purpose: "chat",
    });
    return reviewed;
  }

  // Compliance findings may summarize a bypass as "requires approval". That
  // summary is not permission to release a positively stated bypass request.
  if (detectConstitutionalIntent(visibleAnswer).detected) return gated;

  // Advisory answers that *require* owner approval must surface — refusing them
  // hides the deliberation and looks like a false constitutional block.
  const violations = gated.compliance.findings.filter((f) => f.severity === "violation");
  const onlyApprovalRequirement =
    violations.length > 0 &&
    violations.every(
      (f) =>
        f.principleId === "S8-OWNER-APPROVAL" &&
        /requires Grand King approval/i.test(f.message) &&
        !/\b(bypass|skip|waive|ignore|without)\b/i.test(f.message),
    );
  const answerSeeksApproval =
    /\b(requires?|need|needs|seek|await|ask for|confirm).{0,48}approval\b/i.test(visibleAnswer) ||
    /\bapproval (is |would be )?(required|needed)\b/i.test(visibleAnswer);

  if (onlyApprovalRequirement || answerSeeksApproval) {
    const bypassFinding = violations.some((f) =>
      /\b(bypass|skip|waive|ignore|fabricat|without approval)\b/i.test(f.message),
    );
    if (!bypassFinding) {
      return {
        ...gated,
        allowed: true,
        refusalMessage: null,
      };
    }
  }

  return gated;
}

/** A visible answer contains multiple propositions, not one executable command.
 * Keep the request/action gate strict. For prose, bind action and governance
 * objects within a proposition instead of composing unrelated paragraphs.
 * Unresolved references and conditional exceptions remain conservative.
 */
export function gateExecutiveVisibleAnswer(
  runtime: DigitalSoulRuntime | null | undefined,
  visibleAnswer: string,
): ExecutiveConversationGateResult {
  const whole = gateVisibleProposition(runtime, visibleAnswer);
  // A whole-answer denial pass can split a later causal/conditional clause.
  // When raw intent exists, independently retain each proposition's verdict.
  if (whole.allowed && !detectConstitutionalIntent(visibleAnswer).detected) return whole;
  const units = visibleAnswer.split(/(?<=[.!?;])[*_]*\s+|\n+/).map(s => s.trim()).filter(Boolean).map(scopeVisibleControlReports);
  if (units.length === 0) return whole;
  // Never use segmentation to lose the antecedent of a bypass or an instruction
  // to adopt quoted content. These need context and retain the strict verdict.
  if (units.some(s => /\b(?:bypass|ignore|skip|waive|override|circumvent|suspend)\s+(?:the\s+)?(?:it|them|this|that|these|those|everything|all|checks|controls)\b|\b(?:do|follow|obey|execute)\s+(?:it|that|this|them|those)\b|\b(?:bypass|ignore|skip|waive|override|circumvent|suspend|pretend)[.!?;]*$/i.test(s) &&
    !isExplicitVisibleDenial(s))) return whole.allowed
      ? evaluateExecutiveConversation(runtime, {userMessage: visibleAnswer, purpose: "chat"})
      : whole;
  const reviewed = units.map(unit => {
    let proposition = unit;
    // A negated permission object is a denial, including coordinated noun
    // objects. Retain the preceding proposition and reject conditional tails.
    if (!/\b(?:if|unless|until|except|provided|otherwise|when|then)\b/i.test(unit)) {
      proposition = proposition.replace(/\bnot (?:([a-z -]{1,160}) or )?(?:permission|authority) to (?:bypass|override|ignore|waive) (?:(?:the|any|existing|required|mandatory|owner|constitutional|governance|approval|controls|checks|review|rules)\s*)+[.!?]*[*_]*$/i, (match, coordinatedNoun: string | undefined) => {
        if (coordinatedNoun && /\b(?:to|and|but|then|not|never|bypass|override|ignore|waive|skip|execute|pay|spend|publish|grant|follow|obey|proceed|do)\b/i.test(coordinatedNoun)) return match;
        return 'no additional authority';
      });
    }
    // A deadline elapsing in the absence of approval describes a state; it is
    // not a recommendation to execute without approval. Do not erase a second
    // operational predicate or an exception attached to that observation.
    if (!/\b(?:pay|spend|purchase|publish|execute|transfer|unlock|bypass|override|waive|ignore|proceed)\b/i.test(unit)) {
      proposition = proposition.replace(/\b(?:deadline|decision time|time window|window)\s+(?:passes|expires|elapses|closes)\s+without\s+(?:the\s+)?approval\b/gi, 'deadline expires with approval still absent');
    }
    // Nominal risk registers report pressure/attempts; they do not adopt them.
    // Finite commitments, imperatives and conditional exceptions are excluded.
    const plain = proposition.replace(/[*#]/g, '').trim();
    if (/^(?:[a-z -]+\s+)?risks?\s*:/i.test(plain) &&
      !/\b(?:i|we|you|pillow|will|would|shall|should|must|can|could|do|follow|obey|proceed|if|unless|except|then)\b/i.test(plain)) {
      proposition = proposition.replace(/\b(?:pressure|attempts?)\s+to\s+(?:bypass|override|waive|ignore|skip)\s+[a-z -]+(?=[,.;]|$)/gi, 'reported governance pressure');
    }
    return gateVisibleProposition(runtime, proposition);
  });
  const rejected = reviewed.find(result => !result.allowed);
  if (rejected) return whole.allowed ? rejected : whole;
  return {
    ...whole,
    allowed: true,
    refusalMessage: null,
    compliance: {
      ...whole.compliance,
      aligned: true,
      findings: reviewed.flatMap(result => result.compliance.findings),
      requiresGrandKingApproval: reviewed.some(result => result.compliance.requiresGrandKingApproval),
    },
  };
}

export function buildPillowUnavailableConstitutionalRefusal(): string {
  return [
    "Constitutional gate: Pillow executive pipeline unavailable.",
    "Pillow cannot safely generate an executive answer without Digital Soul participation.",
    "Brain assistant fallback is disabled for executive conversations.",
    "Restore the Pillow host session and retry.",
  ].join(" ");
}
