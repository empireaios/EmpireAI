/** Explicit boundary: Autonomous Investment Engine emits structural signals only — never raw sensitive financial values. */
export const STRUCTURAL_SIGNALS_ONLY = true as const;
export function toStructuralInvestmentTarget(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "unspecified investment target";
}
