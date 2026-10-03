/** Classify delivery independently of provider success; never retry a paid completed answer. */
export function classifyReasoningFailure(providerCompleted: boolean, error: unknown) {
  const detail = error instanceof Error ? error.message : '';
  const code = providerCompleted
    ? detail.startsWith('ANSWER_INTEGRITY_REJECTED:') ? 'ANSWER_REJECTED' : 'POSTPROCESS_FAILED'
    : 'INFERENCE_FAILED';
  return { code, retryable: false as const, providerCompleted,
    message: providerCompleted
      ? 'Pillow received a provider answer, but could not release it after application validation. The original request, provider usage and spending reservation are retained for investigation. No retry was submitted.'
      : 'Pillow could not complete the provider inference. The original request and spending reservation are retained for investigation. No retry was submitted.' };
}
