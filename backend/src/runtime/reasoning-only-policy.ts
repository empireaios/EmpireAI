/**
 * Durable retries may produce an answer, never execute a command. This flag can
 * only restrict the chat path. It does not grant any additional authority.
 */
export function runChatActionStage<T>(reasoningOnly: boolean, action: () => T): T | undefined {
  return reasoningOnly ? undefined : action();
}

export function isReasoningOnlyRequest(headers: Record<string, unknown>): boolean {
  return headers["x-empire-pillow-request-kind"] === "reasoning";
}
