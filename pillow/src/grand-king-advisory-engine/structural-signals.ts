/** Explicit boundary: Grand King Advisory Engine emits structural signals only — never raw sensitive enterprise values. */
export const STRUCTURAL_SIGNALS_ONLY = true as const;
export function toStructuralEnterpriseScope(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "empire-wide";
}
