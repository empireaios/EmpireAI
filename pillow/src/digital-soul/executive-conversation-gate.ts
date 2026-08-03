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
function sanitizeGateMemoryContext(memoryContext: string | undefined): string | undefined {
  if (!memoryContext?.trim()) return memoryContext;
  return memoryContext
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

export function gateExecutiveConversation(
  runtime: DigitalSoulRuntime | null | undefined,
  input: ExecutiveConversationGateInput,
): ExecutiveConversationGateResult {
  assertDigitalSoulAvailable(runtime);
  const soul = runtime!;
  const purpose = input.purpose ?? "chat";
  const recommendation = [
    input.userMessage.trim(),
    sanitizeGateMemoryContext(input.memoryContext),
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

/** Post-LLM check — refuse to surface a response that itself violates constitutional intent. */
export function gateExecutiveVisibleAnswer(
  runtime: DigitalSoulRuntime | null | undefined,
  visibleAnswer: string,
): ExecutiveConversationGateResult {
  const gated = gateExecutiveConversation(runtime, {
    userMessage: visibleAnswer,
    purpose: "chat",
  });

  if (gated.allowed) {
    return gated;
  }

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

export function buildPillowUnavailableConstitutionalRefusal(): string {
  return [
    "Constitutional gate: Pillow executive pipeline unavailable.",
    "Pillow cannot safely generate an executive answer without Digital Soul participation.",
    "Brain assistant fallback is disabled for executive conversations.",
    "Restore the Pillow host session and retry.",
  ].join(" ");
}
