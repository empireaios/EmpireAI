/**
 * G5-02 — Registry filterExpression evaluator (decision gate).
 * No hardcoded business behaviour — expressions come from REG-AUTOMATION-TRIGGER rows.
 */

export type FilterEvaluationContext = Record<string, string | number | boolean | null | undefined>;

export function evaluateRegistryFilterExpression(
  expression: string | undefined,
  context: FilterEvaluationContext,
): boolean {
  if (!expression?.trim()) {
    return true;
  }

  const trimmed = expression.trim();

  const inMatch = trimmed.match(/^(\w+)\s+IN\s+\((.+)\)$/i);
  if (inMatch) {
    const field = inMatch[1] ?? "";
    const values = (inMatch[2] ?? "")
      .split(",")
      .map((value) => value.trim().replace(/^['"]|['"]$/g, ""));
    const actual = context[field];
    return values.some((value) => String(actual) === value);
  }

  const eqMatch = trimmed.match(/^(\w+)\s*==\s*['"]?([^'"]+)['"]?$/);
  if (eqMatch) {
    const field = eqMatch[1] ?? "";
    const expected = eqMatch[2] ?? "";
    return String(context[field]) === expected;
  }

  return false;
}
