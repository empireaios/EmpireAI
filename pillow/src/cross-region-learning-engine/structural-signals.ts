/** Returns bounded structural scores without contacting external systems. */
export function boundedStructuralScore(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.min(100, value ?? fallback));
}
