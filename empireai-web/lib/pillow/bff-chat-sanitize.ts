/**
 * BFF chat sanitize — path-parity infrastructure.
 * Strip protected-state footers; never replace substantive executive answers
 * with the infrastructure-budget terminal solely because of those footers.
 */

export const DEGRADED_CHAT_MESSAGE = [
  "I accepted your request, but a completed executive answer was not produced within the infrastructure budget.",
  "This is a temporary system limit — not a judgment on your ask.",
  "The system retains ownership of this accepted request for internal recovery.",
].join(" ");

export function extractPillowChatMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      result?: { message?: string };
      message?: string;
      assistantMessage?: { content?: string };
    };
    return String(
      parsed?.result?.message ??
        parsed?.message ??
        parsed?.assistantMessage?.content ??
        "",
    ).trim();
  } catch {
    return "";
  }
}

export function stripForbiddenInfraDecoration(message: string, userAsk: string): string {
  const ask = String(userAsk || "");
  const synthetic =
    /\b(?:synthetic(?:canary)?|scenario\s+only|do\s+not\s+mention\s+(?:empireai|birth))\b/i.test(
      ask,
    );
  const stripProtectedFooters = synthetic || !/\bbirth\b/i.test(ask);

  const lines = String(message || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const kept = lines.filter((line) => {
    if (/\btell me which (?:theme|part) to deepen\b/i.test(line)) return false;
    if (/\bworker proxy timed out\b/i.test(line)) return false;
    if (stripProtectedFooters) {
      if (/\bBirth remains unauthoris/i.test(line)) return false;
      if (/\brealised commerce|product focus|commissioning state\b/i.test(line)) {
        return false;
      }
    }
    return true;
  });

  return kept.join("\n").trim();
}

export function isTransportFailureMessage(message: string): boolean {
  return /\bworker proxy timed out\b/i.test(message);
}

export type BffChatDegradeDecision =
  | { degrade: true; reason: "upstream_non_2xx" | "transport_failure_message" | "empty_message_after_strip" }
  | { degrade: false; message: string; stripped: boolean };

export function decideBffChatSurface(input: {
  upstreamOk: boolean;
  rawBody: string;
  userAsk: string;
}): BffChatDegradeDecision {
  const extracted = extractPillowChatMessage(input.rawBody);
  const stripped = stripForbiddenInfraDecoration(extracted, input.userAsk);
  if (!input.upstreamOk) {
    return { degrade: true, reason: "upstream_non_2xx" };
  }
  if (isTransportFailureMessage(extracted)) {
    return { degrade: true, reason: "transport_failure_message" };
  }
  if (stripped.length === 0) {
    return { degrade: true, reason: "empty_message_after_strip" };
  }
  return { degrade: false, message: stripped, stripped: stripped !== extracted };
}
