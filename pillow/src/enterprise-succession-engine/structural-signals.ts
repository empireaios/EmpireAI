/** Explicit boundary: Enterprise Succession Engine emits structural signals only — never raw sensitive organizational values. */
export const STRUCTURAL_SIGNALS_ONLY = true as const;
export function toStructuralOrganizationalUnit(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "unspecified organizational unit";
}
