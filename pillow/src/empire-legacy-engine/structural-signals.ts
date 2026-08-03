/** Explicit boundary: Empire Legacy Engine emits structural signals only — never raw sensitive enterprise values. */
export const STRUCTURAL_SIGNALS_ONLY = true as const;
export function toStructuralCompanyReference(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "unspecified enterprise";
}
