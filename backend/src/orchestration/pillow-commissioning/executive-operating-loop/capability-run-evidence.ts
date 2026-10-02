/** Internal consistency of a recorded sandbox run; never independent certification. */
export function hasCompleteSandboxCapabilityPass(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const run = value as Record<string, unknown>;
  const summary = run.summary as Record<string, unknown> | null;
  if (!summary || summary.total !== 8 || summary.passed !== 8 || summary.failed !== 0 ||
    !Array.isArray(run.results) || run.results.length !== 8) return false;
  const missing = new Set(["A", "B", "C", "D", "E", "F", "G", "H"]);
  for (const value of run.results) {
    if (!value || typeof value !== "object") return false;
    const result = value as Record<string, unknown>;
    if (typeof result.id !== "string" || !missing.delete(result.id) || result.status !== "PASS" ||
      !Array.isArray(result.checks) || result.checks.length === 0 ||
      !result.checks.every(check => check && typeof check === "object" && check.pass === true)) return false;
  }
  return missing.size === 0;
}
