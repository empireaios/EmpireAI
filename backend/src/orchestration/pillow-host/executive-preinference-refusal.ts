/** A blocked inference has no answer to reconstruct from scenario templates. */
export function preInferenceRefusal(unavailable: boolean) {
  return {
    message: unavailable
      ? "Constitutional availability error: the required governance check was unavailable. No model reasoning was performed; the requested analysis remains incomplete. Existing authority limits and Assurance holds remain in force."
      : "Constitutional gate refused this request before model reasoning. The requested analysis remains incomplete. Existing authority limits and Assurance holds remain in force.",
    kind: "authority_refusal" as const,
    semanticSuccess: false,
    brainCompleted: false,
    reasoningFailure: {
      code: unavailable ? "DIGITAL_SOUL_UNAVAILABLE" : "CONSTITUTIONAL_GATE_REFUSED",
      retryable: false,
    },
  };
}
