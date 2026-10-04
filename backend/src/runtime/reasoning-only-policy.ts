/**
 * Durable retries may produce an answer, never execute a command. This flag can
 * only restrict the chat path. It does not grant any additional authority.
 */
export function runChatActionStage<T>(reasoningOnly: boolean, action: () => T): T | undefined {
  return reasoningOnly ? undefined : action();
}

export function isReasoningOnlyRequest(headers: Record<string, unknown>): boolean {
  return process.env.EMPIRE_RUNTIME_PROFILE === "LOCKED_COMMISSIONING_V1" ||
    headers["x-empire-pillow-request-kind"] === "reasoning";
}

/** An effect denial is independent of whether useful analysis can be answered.
 * No user wording, hypothetical flag, approval claim or model output changes it. */
export const REASONING_EFFECT_BOUNDARY = Object.freeze({
  scope: "read_only_reasoning" as const,
  externalEffects: "DENIED" as const,
  authorityChanges: "DENIED" as const,
  assuranceOverrides: "DENIED" as const,
  executionPerformed: false as const,
});
