/** Explicit boundary: Civilization Knowledge Engine emits structural signals only — never raw sensitive enterprise values. */
export const STRUCTURAL_SIGNALS_ONLY = true as const;
export function toStructuralSourceDomain(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "external civilization domain";
}
