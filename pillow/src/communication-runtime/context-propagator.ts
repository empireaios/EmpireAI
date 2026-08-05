import type { CommunicationMessage, ComrtInput } from "./types.js";

/**
 * Attach and preserve contextReference across messages.
 * NEVER embeds secrets — contextReference strings only.
 */
export class ContextPropagator {
  resolveContextReference(input: ComrtInput, fallbackSeed?: string): string {
    if (input.contextReference?.startsWith("ctx://")) {
      return input.contextReference;
    }
    const seed = fallbackSeed ?? input.correlationId ?? input.messageId ?? "anonymous";
    return `ctx://structural/comrt/${seed}`;
  }

  propagate(
    source: CommunicationMessage,
    targetPartial: Partial<CommunicationMessage>,
  ): string {
    if (targetPartial.contextReference?.startsWith("ctx://")) {
      return targetPartial.contextReference;
    }
    return source.contextReference;
  }

  attachToMessage(
    message: CommunicationMessage,
    contextReference: string,
  ): CommunicationMessage {
    return {
      ...message,
      contextReference: contextReference.startsWith("ctx://")
        ? contextReference
        : message.contextReference,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }
}
